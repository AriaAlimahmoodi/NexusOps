"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfisicalProvider = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const constants_2 = require("../constants");
const external_secrets_config_1 = require("../external-secrets.config");
const secrets_provider_errors_1 = require("../errors/secrets-provider-errors");
const types_1 = require("../types");
const TOKEN_REFRESH_LEEWAY_SECONDS = 60;
const MIN_REFRESH_DELAY_MS = 60 * 1000;
class InfisicalProvider extends types_1.SecretsProvider {
    constructor(logger = di_1.Container.get(backend_common_1.Logger), outboundHttp = di_1.Container.get(backend_network_1.OutboundHttp)) {
        super();
        this.logger = logger;
        this.outboundHttp = outboundHttp;
        this.properties = [
            constants_2.DOCS_HELP_NOTICE,
            {
                displayName: 'Site URL',
                name: 'siteURL',
                type: 'string',
                hint: "The absolute URL of the Infisical instance. Change it only if you're self-hosting Infisical.",
                required: true,
                noDataExpression: true,
                placeholder: 'https://app.infisical.com',
                default: 'https://app.infisical.com',
            },
            {
                displayName: 'Project ID',
                name: 'projectId',
                type: 'string',
                hint: 'The Infisical project to read secrets from',
                required: true,
                noDataExpression: true,
                placeholder: 'e.g. 7c1cbe9c-3f1b-4a92-b3a2-9d5e2f1c8a4b',
                default: '',
            },
            {
                displayName: 'Environment',
                name: 'environment',
                type: 'string',
                hint: 'Environment slug (e.g. dev, staging, prod)',
                required: true,
                noDataExpression: true,
                placeholder: 'dev',
                default: 'dev',
            },
            {
                displayName: 'Secret Path',
                name: 'secretPath',
                type: 'string',
                hint: 'The path within the project to read secrets from',
                required: true,
                noDataExpression: true,
                placeholder: '/',
                default: '/',
            },
            {
                displayName: 'Authentication Method',
                name: 'authMethod',
                type: 'options',
                required: true,
                noDataExpression: true,
                options: [{ name: 'Universal Auth', value: 'universalAuth' }],
                default: 'universalAuth',
            },
            {
                displayName: 'Client ID',
                name: 'clientId',
                type: 'string',
                default: '',
                required: true,
                noDataExpression: true,
                placeholder: 'e.g. 8a7b1f1c-9f2a-4d6c-bf1a-2c4e6f8b1d3a',
                displayOptions: {
                    show: {
                        authMethod: ['universalAuth'],
                    },
                },
            },
            {
                displayName: 'Client Secret',
                name: 'clientSecret',
                type: 'string',
                default: '',
                required: true,
                noDataExpression: true,
                placeholder: '***************',
                typeOptions: { password: true },
                displayOptions: {
                    show: {
                        authMethod: ['universalAuth'],
                    },
                },
            },
        ];
        this.displayName = 'Infisical';
        this.name = 'infisical';
        this.cachedSecrets = {};
        this.currentToken = null;
        this.tokenExpiresAt = null;
        this.refreshTimeout = null;
        this.refreshAbort = new AbortController();
        this.tokenRefresh = async () => {
            if (this.refreshAbort.signal.aborted)
                return;
            try {
                await this.loginUniversalAuth();
                if (this.refreshAbort.signal.aborted)
                    return;
                this.setupTokenRefresh();
            }
            catch (error) {
                this.logOperationFailure('Failed to refresh Infisical token. Attempting reconnect.', {
                    operation: 'tokenRefresh',
                    error,
                    context: (0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error),
                });
                void this.connect();
            }
        };
        this.logger = this.logger.scoped('external-secrets');
    }
    async init(settings) {
        this.settings = settings.settings;
        const config = di_1.Container.get(external_secrets_config_1.ExternalSecretsConfig);
        this.http = this.outboundHttp.requests({
            baseURL: this.settings.siteURL,
            headers: () => this.buildAuthHeaders(),
            useDefaultSsrfPolicy: 'unsafe',
            timeout: Math.max(config.connectTimeout, config.refreshTimeout) * constants_1.Time.seconds.toMilliseconds,
        });
        this.logger.debug('Infisical provider initialized');
    }
    async doConnect() {
        this.refreshAbort = new AbortController();
        try {
            if (this.settings.authMethod === 'universalAuth') {
                if (!this.settings.clientId || !this.settings.clientSecret) {
                    throw new n8n_workflow_1.UnexpectedError('Client ID and Client Secret are required for Universal Auth');
                }
                await this.loginUniversalAuth();
            }
            await this.verifyWorkspaceAccess();
            this.setupTokenRefresh();
        }
        catch (error) {
            const context = error instanceof n8n_workflow_1.UnexpectedError ? undefined : (0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error);
            this.logOperationFailure('Failed to connect Infisical provider', {
                operation: 'connect',
                error,
                context,
            });
            throw error;
        }
    }
    async disconnect() {
        if (this.refreshTimeout !== null) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
        this.refreshAbort.abort();
        this.currentToken = null;
        this.tokenExpiresAt = null;
        this.cachedSecrets = {};
    }
    async test() {
        try {
            await this.verifyWorkspaceAccess();
            return [true];
        }
        catch (error) {
            this.logOperationFailure('Infisical provider test failed', {
                operation: 'test',
                error,
                context: {
                    ...(0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error),
                    endpoint: 'workspace',
                },
            });
            if ((0, backend_network_1.isConnectionRefusedError)(error)) {
                return [false, 'Connection refused. Check the Site URL.'];
            }
            return [false, error instanceof Error ? error.message : 'Connection test failed'];
        }
    }
    async update() {
        if (!this.currentToken) {
            throw new n8n_workflow_1.UnexpectedError('Update attempted on Infisical before authentication');
        }
        try {
            await this.ensureTokenFresh();
            try {
                this.cacheSecrets(await this.fetchSecrets());
            }
            catch (error) {
                if ((0, backend_network_1.httpStatusFromError)(error) === 401) {
                    this.logger.debug('Infisical token rejected during update; re-authenticating and retrying');
                    await this.loginUniversalAuth();
                    this.cacheSecrets(await this.fetchSecrets());
                    return;
                }
                throw error;
            }
        }
        catch (error) {
            this.logOperationFailure('Failed to update Infisical provider secrets', {
                operation: 'update',
                error,
                context: {
                    ...(0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error),
                    endpoint: 'secrets',
                },
            });
            throw error;
        }
    }
    async fetchSecrets() {
        return await this.http.request({
            url: '/api/v4/secrets',
            method: 'GET',
            qs: {
                projectId: this.settings.projectId,
                environment: this.settings.environment,
                secretPath: this.settings.secretPath,
            },
            json: true,
        });
    }
    dedupeSecrets(secrets, imports) {
        const dedupedSecrets = new Map();
        secrets.forEach((s) => {
            dedupedSecrets.set(s.secretKey, s);
        });
        imports.forEach((i) => {
            i.secrets.forEach((s) => {
                if (!dedupedSecrets.has(s.secretKey)) {
                    dedupedSecrets.set(s.secretKey, s);
                }
            });
        });
        return Array.from(dedupedSecrets.values());
    }
    cacheSecrets(data) {
        const dedupedSecrets = this.dedupeSecrets(data.secrets, data.imports);
        this.cachedSecrets = Object.fromEntries(dedupedSecrets.map((s) => [s.secretKey, s.secretValue]));
        this.logger.debug(`Infisical provider cached ${Object.keys(this.cachedSecrets).length} secrets`);
    }
    async ensureTokenFresh() {
        if (this.tokenExpiresAt === null)
            return;
        if (Date.now() < this.tokenExpiresAt)
            return;
        await this.loginUniversalAuth();
    }
    async loginUniversalAuth() {
        const body = await this.http.request({
            url: '/api/v1/auth/universal-auth/login',
            method: 'POST',
            body: {
                clientId: this.settings.clientId,
                clientSecret: this.settings.clientSecret,
            },
            json: true,
        });
        this.currentToken = body.accessToken;
        this.tokenExpiresAt =
            Date.now() + Math.max(body.expiresIn - TOKEN_REFRESH_LEEWAY_SECONDS, 60) * 1000;
    }
    setupTokenRefresh() {
        if (this.refreshTimeout !== null) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
        if (this.tokenExpiresAt === null)
            return;
        const remaining = this.tokenExpiresAt - Date.now();
        const refreshIn = Math.max(remaining / 2, MIN_REFRESH_DELAY_MS);
        this.refreshTimeout = setTimeout(this.tokenRefresh, refreshIn);
    }
    getSecret(name) {
        return this.cachedSecrets[name];
    }
    getSecretNames() {
        return Object.keys(this.cachedSecrets);
    }
    hasSecret(name) {
        return name in this.cachedSecrets;
    }
    buildAuthHeaders() {
        if (this.currentToken) {
            return {
                Authorization: `Bearer ${this.currentToken}`,
            };
        }
        return {};
    }
    async verifyWorkspaceAccess() {
        const resp = await this.http.request({
            url: `/api/v1/workspace/${encodeURIComponent(this.settings.projectId)}`,
            method: 'GET',
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
        });
        if (resp.statusCode >= 200 && resp.statusCode < 300) {
            return;
        }
        if (resp.statusCode === 401) {
            throw new Error('Invalid credentials');
        }
        if (resp.statusCode === 403) {
            throw new Error('Permission denied. Verify the machine identity has access to this project.');
        }
        if (resp.statusCode === 404) {
            throw new Error('Project not found. Check the Project ID and Site URL.');
        }
        throw new Error(`Unexpected response from Infisical (status ${resp.statusCode}).`);
    }
    logOperationFailure(message, params) {
        const context = { ...params.context };
        if (this.settings) {
            const { siteURL, projectId, authMethod, environment, secretPath } = this.settings;
            Object.assign(context, { siteURL, projectId });
            if (params.operation === 'connect' || params.operation === 'tokenRefresh') {
                context.authMethod = authMethod;
            }
            else if (params.operation === 'update') {
                Object.assign(context, { environment, secretPath });
            }
        }
        (0, secrets_provider_errors_1.logSecretsProviderOperationFailure)({
            logger: this.logger,
            message,
            providerName: this.name,
            providerDisplayName: this.displayName,
            operation: params.operation,
            error: params.error,
            context,
        });
    }
}
exports.InfisicalProvider = InfisicalProvider;
//# sourceMappingURL=infisical.js.map