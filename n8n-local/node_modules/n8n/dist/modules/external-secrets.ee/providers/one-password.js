"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnePasswordProvider = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../constants");
const secrets_provider_errors_1 = require("../errors/secrets-provider-errors");
const types_1 = require("../types");
class OnePasswordProvider extends types_1.SecretsProvider {
    constructor(logger = di_1.Container.get(backend_common_1.Logger)) {
        super();
        this.logger = logger;
        this.name = 'onePassword';
        this.displayName = '1Password';
        this.properties = [
            constants_1.DOCS_HELP_NOTICE,
            {
                displayName: 'Connect Server URL',
                name: 'serverUrl',
                type: 'string',
                default: '',
                required: true,
                placeholder: 'e.g. http://localhost:8080',
                hint: 'URL of your <a href="https://developer.1password.com/docs/connect/get-started/" target="_blank">1Password Connect Server</a>.',
                noDataExpression: true,
            },
            {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                default: '',
                required: true,
                typeOptions: { password: true },
                placeholder: 'e.g. eyJhbGciOiJFUzI1NiIsImtpZCI6...',
                hint: 'Token created for your Connect Server integration.',
                noDataExpression: true,
            },
        ];
        this.cachedSecrets = {};
        this.logger = this.logger.scoped('external-secrets');
    }
    async init(context) {
        try {
            const trimmedServerUrl = context.settings.serverUrl?.trim();
            const trimmedAccessToken = context.settings.accessToken?.trim();
            if (!trimmedServerUrl) {
                throw new n8n_workflow_1.UserError('Connect Server URL is required.');
            }
            if (!trimmedAccessToken) {
                throw new n8n_workflow_1.UserError('Access Token is required.');
            }
            this.settings = {
                serverUrl: trimmedServerUrl,
                accessToken: trimmedAccessToken,
            };
        }
        catch (error) {
            this.logOperationFailure('Failed to initialize 1Password provider', {
                operation: 'initialize',
                error,
            });
            throw error;
        }
    }
    async doConnect() {
        try {
            const { OnePasswordConnect } = await import('@1password/connect');
            this.client = OnePasswordConnect({
                serverURL: this.settings.serverUrl,
                token: this.settings.accessToken,
                keepAlive: true,
            });
            await this.verifyConnection();
            this.logger.debug('1Password provider connected');
        }
        catch (error) {
            this.logOperationFailure('Failed to connect 1Password provider', {
                operation: 'connect',
                error,
                context: (0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error),
            });
            throw error;
        }
    }
    async test() {
        if (!this.client)
            return [false, 'Client not initialized'];
        try {
            await this.verifyConnection();
            return [true];
        }
        catch (error) {
            this.logOperationFailure('1Password provider test failed', {
                operation: 'test',
                error,
                context: {
                    ...(0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error),
                    endpoint: 'vaults',
                },
            });
            return [false, error instanceof Error ? error.message : 'Unknown error'];
        }
    }
    async disconnect() {
    }
    async update() {
        try {
            const vaults = await this.client.listVaults();
            const secrets = {};
            for (const vault of vaults) {
                if (!vault.id)
                    continue;
                const items = await this.client.listItems(vault.id);
                for (const item of items) {
                    if (!item.id || !item.title)
                        continue;
                    const fullItem = await this.client.getItemById(vault.id, item.id);
                    if (!fullItem.fields?.length)
                        continue;
                    const fieldValues = {};
                    for (const field of fullItem.fields) {
                        if (field.label && field.value) {
                            fieldValues[field.label] = field.value;
                        }
                    }
                    if (Object.keys(fieldValues).length === 0)
                        continue;
                    secrets[item.title] = fieldValues;
                }
            }
            this.cachedSecrets = secrets;
            this.logger.debug('1Password provider secrets updated');
        }
        catch (error) {
            this.logOperationFailure('Failed to update 1Password provider secrets', {
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
    getSecret(name) {
        return this.cachedSecrets[name];
    }
    hasSecret(name) {
        return name in this.cachedSecrets;
    }
    getSecretNames() {
        return Object.entries(this.cachedSecrets).flatMap(([itemName, fields]) => Object.keys(fields).map((fieldName) => `${itemName}.${fieldName}`));
    }
    async verifyConnection() {
        await this.client.listVaults();
    }
    logOperationFailure(message, params) {
        const context = { ...params.context };
        if (this.settings?.serverUrl) {
            context.serverUrl = this.settings.serverUrl;
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
exports.OnePasswordProvider = OnePasswordProvider;
//# sourceMappingURL=one-password.js.map