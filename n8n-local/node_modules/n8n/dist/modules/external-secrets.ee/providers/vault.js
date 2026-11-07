"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _VaultProvider_currentToken, _VaultProvider_http;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultProvider = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const p_limit_1 = __importDefault(require("p-limit"));
const constants_2 = require("../constants");
const secrets_provider_errors_1 = require("../errors/secrets-provider-errors");
const external_secrets_config_1 = require("../external-secrets.config");
const retry_manager_service_1 = require("../retry-manager.service");
const types_1 = require("../types");
const KV_READ_CONCURRENCY = 50;
class VaultProvider extends types_1.SecretsProvider {
    constructor(logger = di_1.Container.get(backend_common_1.Logger), outboundHttp = di_1.Container.get(backend_network_1.OutboundHttp)) {
        super();
        this.logger = logger;
        this.outboundHttp = outboundHttp;
        this.properties = [
            constants_2.DOCS_HELP_NOTICE,
            {
                displayName: 'Vault URL',
                name: 'url',
                type: 'string',
                required: true,
                noDataExpression: true,
                placeholder: 'e.g. https://example.com/v1/',
                default: '',
            },
            {
                displayName: 'Vault Namespace (optional)',
                name: 'namespace',
                type: 'string',
                hint: 'Leave blank if not using namespaces',
                required: false,
                noDataExpression: true,
                placeholder: 'e.g. admin',
                default: '',
            },
            {
                displayName: 'Authentication Method',
                name: 'authMethod',
                type: 'options',
                required: true,
                noDataExpression: true,
                options: [
                    { name: 'Token', value: 'token' },
                    { name: 'Username and Password', value: 'usernameAndPassword' },
                    { name: 'AppRole', value: 'appRole' },
                ],
                default: 'token',
            },
            {
                displayName: 'Token',
                name: 'token',
                type: 'string',
                default: '',
                required: true,
                noDataExpression: true,
                placeholder: 'e.g. hvs.2OCsZxZA6Z9lChbt0janOOZI',
                typeOptions: { password: true },
                displayOptions: {
                    show: {
                        authMethod: ['token'],
                    },
                },
            },
            {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                default: '',
                required: true,
                noDataExpression: true,
                placeholder: 'Username',
                displayOptions: {
                    show: {
                        authMethod: ['usernameAndPassword'],
                    },
                },
            },
            {
                displayName: 'Password',
                name: 'password',
                type: 'string',
                default: '',
                required: true,
                noDataExpression: true,
                placeholder: '***************',
                typeOptions: { password: true },
                displayOptions: {
                    show: {
                        authMethod: ['usernameAndPassword'],
                    },
                },
            },
            {
                displayName: 'Role ID',
                name: 'roleId',
                type: 'string',
                default: '',
                required: true,
                noDataExpression: true,
                placeholder: '59d6d1ca-47bb-4e7e-a40b-8be3bc5a0ba8',
                displayOptions: {
                    show: {
                        authMethod: ['appRole'],
                    },
                },
            },
            {
                displayName: 'Secret ID',
                name: 'secretId',
                type: 'string',
                default: '',
                required: true,
                noDataExpression: true,
                placeholder: '84896a0c-1347-aa90-a4f6-aca8b7558780',
                typeOptions: { password: true },
                displayOptions: {
                    show: {
                        authMethod: ['appRole'],
                    },
                },
            },
            {
                displayName: 'KV Mount Path (optional)',
                name: 'kvMountPath',
                type: 'string',
                default: '',
                required: false,
                noDataExpression: true,
                placeholder: 'e.g. secret/',
                hint: 'Specify the KV engine mount path to skip sys/mounts auto-discovery. Leave blank to auto-detect.',
            },
            {
                displayName: 'KV Version',
                name: 'kvVersion',
                type: 'options',
                default: '2',
                required: false,
                noDataExpression: true,
                options: [
                    { name: 'v1', value: '1' },
                    { name: 'v2', value: '2' },
                ],
                hint: 'Only used when KV Mount Path is specified.',
            },
            {
                displayName: 'KV Secret Path (optional)',
                name: 'kvSecretPath',
                type: 'string',
                default: '',
                required: false,
                noDataExpression: true,
                placeholder: 'e.g. my-app/',
                hint: 'Folder inside the KV mount to read secrets from. Leave blank to read the whole mount. Only used when KV Mount Path is specified.',
            },
        ];
        this.displayName = 'HashiCorp Vault';
        this.name = 'vault';
        this.cachedSecrets = {};
        _VaultProvider_currentToken.set(this, null);
        _VaultProvider_http.set(this, void 0);
        this.refreshTimeout = null;
        this.refreshAbort = new AbortController();
        this.tokenReauthenticate = async () => {
            this.refreshTimeout = null;
            if (this.refreshAbort.signal.aborted) {
                return;
            }
            await this.retryManager.runWithRetry(this.name, async () => {
                if (this.refreshAbort.signal.aborted) {
                    return { success: true };
                }
                await this.connect();
                return {
                    success: this.refreshAbort.signal.aborted || this.state === 'connected',
                    error: this.lastError,
                };
            });
        };
        this.tokenRefresh = async () => {
            this.refreshTimeout = null;
            if (this.refreshAbort.signal.aborted) {
                return;
            }
            try {
                await __classPrivateFieldGet(this, _VaultProvider_http, "f").request({ url: 'auth/token/renew-self', method: 'POST' });
                const [tokenInfo] = await this.getTokenInfo();
                if (!tokenInfo) {
                    throw new n8n_workflow_1.OperationalError('Failed to fetch Vault token info');
                }
                if (this.refreshAbort.signal.aborted) {
                    return;
                }
                this.setupTokenRefresh(tokenInfo);
            }
            catch (error) {
                this.logOperationFailure('Failed to renew Vault token. Attempting to reconnect.', {
                    operation: 'tokenRefresh',
                    error,
                    context: {
                        ...(0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error),
                        authMethod: this.settings.authMethod,
                    },
                });
                await this.tokenReauthenticate();
            }
        };
        this.logger = this.logger.scoped('external-secrets');
        this.retryManager = new retry_manager_service_1.ExternalSecretsRetryManager(logger);
    }
    async init(settings) {
        this.settings = settings.settings;
        const config = di_1.Container.get(external_secrets_config_1.ExternalSecretsConfig);
        __classPrivateFieldSet(this, _VaultProvider_http, this.outboundHttp.requests({
            baseURL: new URL(this.settings.url).toString(),
            headers: () => this.buildAuthHeaders(),
            useDefaultSsrfPolicy: 'unsafe',
            timeout: Math.max(config.connectTimeout, config.refreshTimeout) * constants_1.Time.seconds.toMilliseconds,
        }), "f");
        this.logger.debug('Vault provider initialized');
    }
    async doConnect() {
        try {
            if (this.settings.authMethod === 'token') {
                __classPrivateFieldSet(this, _VaultProvider_currentToken, this.settings.token, "f");
            }
            else if (this.settings.authMethod === 'usernameAndPassword') {
                __classPrivateFieldSet(this, _VaultProvider_currentToken, await this.authUsernameAndPassword(this.settings.username, this.settings.password), "f");
                if (!__classPrivateFieldGet(this, _VaultProvider_currentToken, "f")) {
                    throw new Error('Failed to authenticate with Username and Password');
                }
            }
            else if (this.settings.authMethod === 'appRole') {
                __classPrivateFieldSet(this, _VaultProvider_currentToken, await this.authAppRole(this.settings.roleId, this.settings.secretId), "f");
                if (!__classPrivateFieldGet(this, _VaultProvider_currentToken, "f")) {
                    throw new Error('Failed to authenticate with AppRole');
                }
            }
            const [testSuccess, failureMessage] = await this.test();
            if (!testSuccess) {
                throw new Error(failureMessage ?? 'Connection test failed');
            }
            const [tokenInfo] = await this.getTokenInfo();
            if (!tokenInfo) {
                throw new n8n_workflow_1.OperationalError('Failed to fetch Vault token info');
            }
            if (!this.refreshAbort.signal.aborted) {
                this.setupTokenRefresh(tokenInfo);
            }
        }
        catch (error) {
            if (!this.isVaultAuthFailure(error)) {
                this.logOperationFailure('Failed to connect Vault provider', {
                    operation: 'connect',
                    error,
                    context: {
                        ...(0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error),
                        authMethod: this.settings.authMethod,
                    },
                });
            }
            throw error;
        }
    }
    async disconnect() {
        this.retryManager.cancelRetry(this.name);
        this.clearTokenRefresh();
        this.refreshAbort.abort();
    }
    clearTokenRefresh() {
        if (this.refreshTimeout !== null) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
    }
    setupTokenRefresh(tokenInfo) {
        this.clearTokenRefresh();
        if (tokenInfo.expire_time === null) {
            return;
        }
        if (!tokenInfo.renewable && this.settings.authMethod === 'token') {
            return;
        }
        const expireDate = new Date(tokenInfo.expire_time);
        this.refreshTimeout = setTimeout(tokenInfo.renewable ? this.tokenRefresh : this.tokenReauthenticate, (expireDate.valueOf() - Date.now()) / 2);
    }
    async authUsernameAndPassword(username, password) {
        try {
            const body = await __classPrivateFieldGet(this, _VaultProvider_http, "f").request({
                method: 'POST',
                url: `auth/userpass/login/${username}`,
                json: true,
                body: { password },
            });
            return body.auth.client_token;
        }
        catch (error) {
            this.logOperationFailure('Vault provider username/password authentication failed', {
                operation: 'connect',
                error,
                context: {
                    ...(0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error),
                    authMethod: 'usernameAndPassword',
                },
            });
            return null;
        }
    }
    async authAppRole(roleId, secretId) {
        try {
            const body = await __classPrivateFieldGet(this, _VaultProvider_http, "f").request({
                method: 'POST',
                url: 'auth/approle/login',
                json: true,
                body: { role_id: roleId, secret_id: secretId },
            });
            return body.auth.client_token;
        }
        catch (error) {
            this.logOperationFailure('Vault provider AppRole authentication failed', {
                operation: 'connect',
                error,
                context: {
                    ...(0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error),
                    authMethod: 'appRole',
                },
            });
            return null;
        }
    }
    async getTokenInfo() {
        const resp = await this.requestFull({
            method: 'GET',
            url: 'auth/token/lookup-self',
            json: true,
        });
        const body = resp.body;
        if (resp.statusCode !== 200 || !body?.data) {
            return [null, resp];
        }
        return [body.data, resp];
    }
    async getKVSecrets(mount, path, limit) {
        const { path: mountPath, version: kvVersion, subPath } = mount;
        this.logger.debug(`Getting kv secrets from ${mountPath}${path} (version ${kvVersion})`);
        const listRequest = this.kvListRequest(this.kvApiPath(mountPath, kvVersion, 'metadata', path));
        let listBody;
        try {
            listBody = await limit(async () => await __classPrivateFieldGet(this, _VaultProvider_http, "f").request(listRequest));
        }
        catch (error) {
            if ((0, backend_network_1.isTransportFailure)(error))
                throw error;
            const errorContext = (0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error);
            this.logger.debug('Vault provider failed to list KV secrets', {
                providerName: this.name,
                operation: 'update',
                mountPath,
                kvVersion,
                vaultApiPath: listRequest.url,
                ...errorContext,
            });
            return null;
        }
        const data = Object.fromEntries((await Promise.allSettled(listBody.data.keys.map(async (key) => {
            if (key.endsWith('/')) {
                const folder = await this.getKVSecrets(mount, path + key, limit);
                const folderKey = (path + key).slice(subPath.length, -1);
                return folder === null ? null : [folderKey, folder];
            }
            const secretPath = this.kvApiPath(mountPath, kvVersion, 'data', path + key);
            try {
                const secretBody = await limit(async () => await __classPrivateFieldGet(this, _VaultProvider_http, "f").request({
                    url: secretPath,
                    method: 'GET',
                }));
                this.logger.debug(`Vault provider retrieved secrets from ${secretPath}`);
                return [
                    key,
                    kvVersion === '2' ? secretBody.data.data : secretBody.data,
                ];
            }
            catch (error) {
                if ((0, backend_network_1.isTransportFailure)(error))
                    throw error;
                const errorContext = (0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error);
                this.logger.debug('Vault provider failed to read KV secret', {
                    providerName: this.name,
                    operation: 'update',
                    mountPath,
                    kvVersion,
                    secretPath,
                    ...errorContext,
                });
                return null;
            }
        })))
            .map((i) => {
            if (i.status === 'rejected')
                throw i.reason;
            return i.value;
        })
            .filter((v) => v !== null));
        this.logger.debug(`Vault provider retrieved kv secrets from ${mountPath}${path}`);
        return data;
    }
    normalizeKvPath(path = '') {
        const segments = path
            .split('/')
            .map((segment) => segment.trim())
            .filter(Boolean);
        return segments.length === 0 ? '' : `${segments.join('/')}/`;
    }
    kvApiPath(mountPath, kvVersion, segment, path) {
        return kvVersion === '2' ? `${mountPath}${segment}/${path}` : `${mountPath}${path}`;
    }
    kvListRequest(listPath) {
        const preferGet = di_1.Container.get(external_secrets_config_1.ExternalSecretsConfig).preferGet;
        return {
            url: `${listPath}${preferGet ? '?list=true' : ''}`,
            method: (preferGet ? 'GET' : 'LIST'),
        };
    }
    manualKvMount() {
        const { kvMountPath, kvVersion, kvSecretPath } = this.settings;
        const path = this.normalizeKvPath(kvMountPath);
        if (path === '') {
            return null;
        }
        return { path, version: kvVersion ?? '2', subPath: this.normalizeKvPath(kvSecretPath) };
    }
    async discoverKvMounts() {
        const manualMount = this.manualKvMount();
        if (manualMount) {
            return [manualMount];
        }
        const mounts = await __classPrivateFieldGet(this, _VaultProvider_http, "f").request({
            url: 'sys/mounts',
            method: 'GET',
        });
        const kvMounts = Object.entries(mounts.data).filter(([, mount]) => mount.type === 'kv');
        return kvMounts
            .map(([basePath, mount]) => {
            const version = mount.options?.version;
            if (typeof version !== 'string') {
                this.logger.debug(`Skipping KV mount "${basePath}" — no version in mount options`);
                return null;
            }
            return { path: basePath, version, subPath: '' };
        })
            .filter((entry) => entry !== null);
    }
    async testSecretAccess() {
        const manualMount = this.manualKvMount();
        let listRequest;
        let forbiddenMessage;
        let failureMessage;
        if (manualMount) {
            const listPath = this.kvApiPath(manualMount.path, manualMount.version, 'metadata', manualMount.subPath);
            listRequest = this.kvListRequest(listPath);
            forbiddenMessage = `Permission denied accessing ${listPath}. Check your token policies.`;
            failureMessage = (status) => status === 404 && manualMount.subPath !== ''
                ? `No secrets found at ${listPath}. Check the KV Secret Path.`
                : `Could not access ${listPath} (status ${status}).`;
        }
        else {
            listRequest = { url: 'sys/mounts', method: 'GET' };
            forbiddenMessage =
                "Couldn't list mounts. Please give these credentials 'read' access to sys/mounts.";
            failureMessage = () => "Couldn't list mounts but it wasn't a permissions issue. Please consult your Vault admin.";
        }
        const resp = await this.requestFull(listRequest);
        if (resp.statusCode === 403) {
            return [false, forbiddenMessage];
        }
        const { body } = resp;
        const isEmptyMount = resp.statusCode === 404 &&
            typeof body === 'object' &&
            body !== null &&
            'errors' in body &&
            Array.isArray(body.errors) &&
            body.errors.length === 0;
        if (resp.statusCode === 200 || (manualMount?.subPath === '' && isEmptyMount)) {
            return [true];
        }
        return [false, failureMessage(resp.statusCode)];
    }
    async update() {
        try {
            const kvMounts = await this.discoverKvMounts();
            const limit = (0, p_limit_1.default)(KV_READ_CONCURRENCY);
            const secrets = Object.fromEntries((await Promise.allSettled(kvMounts.map(async (mount) => {
                const value = await this.getKVSecrets(mount, mount.subPath, limit);
                if (value === null) {
                    return null;
                }
                const nested = mount.subPath
                    .split('/')
                    .filter(Boolean)
                    .reduceRight((inner, folder) => ({ [folder]: inner }), value);
                return [mount.path.substring(0, mount.path.length - 1), nested];
            })))
                .map((result) => {
                if (result.status === 'rejected')
                    throw result.reason;
                return result.value;
            })
                .filter((entry) => entry !== null));
            this.cachedSecrets = secrets;
            this.logger.debug('Vault provider secrets updated');
        }
        catch (error) {
            this.logOperationFailure('Failed to update Vault provider secrets', {
                operation: 'update',
                error,
                context: (0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error),
            });
            throw error;
        }
    }
    async test() {
        try {
            const [token, tokenResp] = await this.getTokenInfo();
            if (token === null) {
                if (tokenResp.statusCode === 404) {
                    return [false, 'Could not find auth path. Try adding /v1/ to the end of your base URL.'];
                }
                return [false, 'Invalid credentials'];
            }
            return await this.testSecretAccess();
        }
        catch (error) {
            this.logOperationFailure('Vault provider test failed', {
                operation: 'test',
                error,
                context: {
                    ...(0, secrets_provider_errors_1.buildHttpProviderErrorContext)(error),
                    vaultApiPath: 'auth/token/lookup-self',
                },
            });
            if ((0, backend_network_1.isConnectionRefusedError)(error)) {
                return [
                    false,
                    'Connection refused. Please check the host and port of the server are correct.',
                ];
            }
            return [false];
        }
    }
    getSecret(name) {
        return this.cachedSecrets[name];
    }
    hasSecret(name) {
        return name in this.cachedSecrets;
    }
    getSecretNames() {
        const getKeys = ([k, v]) => {
            if (typeof v === 'object') {
                const keys = [];
                for (const key of Object.keys(v)) {
                    const value = v[key];
                    if (typeof value === 'object' && value !== null) {
                        keys.push(...getKeys([key, value]).map((ok) => `${k}.${ok}`));
                    }
                    else {
                        keys.push(`${k}.${key}`);
                    }
                }
                return keys;
            }
            return [k];
        };
        return Object.entries(this.cachedSecrets).flatMap(getKeys);
    }
    buildAuthHeaders() {
        const headers = {};
        if (this.settings.namespace) {
            headers['X-Vault-Namespace'] = this.settings.namespace;
        }
        if (__classPrivateFieldGet(this, _VaultProvider_currentToken, "f")) {
            headers['X-Vault-Token'] = __classPrivateFieldGet(this, _VaultProvider_currentToken, "f");
        }
        return headers;
    }
    async requestFull(options) {
        return await __classPrivateFieldGet(this, _VaultProvider_http, "f").request({
            ...options,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
        });
    }
    isVaultAuthFailure(error) {
        return (error instanceof Error &&
            (error.message === 'Failed to authenticate with Username and Password' ||
                error.message === 'Failed to authenticate with AppRole'));
    }
    logOperationFailure(message, params) {
        (0, secrets_provider_errors_1.logSecretsProviderOperationFailure)({
            logger: this.logger,
            message,
            providerName: this.name,
            providerDisplayName: this.displayName,
            operation: params.operation,
            error: params.error,
            context: params.context ?? {},
        });
    }
}
exports.VaultProvider = VaultProvider;
_VaultProvider_currentToken = new WeakMap(), _VaultProvider_http = new WeakMap();
//# sourceMappingURL=vault.js.map