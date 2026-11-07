"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OauthService = exports.InvalidOAuthUrlError = exports.InvalidTargetError = exports.OauthVersion = exports.skipAuthOnOAuthCallback = void 0;
exports.shouldSkipAuthOnOAuthCallback = shouldSkipAuthOnOAuthCallback;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const csrf_1 = __importDefault(require("csrf"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../constants");
const auth_service_1 = require("../auth/auth.service");
const credentials_helper_1 = require("../credentials-helper");
const errors_1 = require("@n8n/errors");
const account_identifier_1 = require("../oauth/account-identifier");
const validate_oauth_url_1 = require("../oauth/validate-oauth-url");
const WorkflowExecuteAdditionalData = __importStar(require("../workflow-execute-additional-data"));
const client_oauth2_1 = require("@n8n/client-oauth2");
const oauth2_dynamic_client_registration_schema_1 = require("../controllers/oauth/oauth2-dynamic-client-registration.schema");
const pkce_challenge_1 = __importDefault(require("pkce-challenge"));
const qs = __importStar(require("querystring"));
const split_1 = __importDefault(require("lodash/split"));
const external_hooks_1 = require("../external-hooks");
const crypto_1 = require("crypto");
const oauth_1_0a_1 = __importDefault(require("oauth-1.0a"));
const dcr_managed_fields_1 = require("./dcr-managed-fields");
const types_1 = require("./types");
Object.defineProperty(exports, "OauthVersion", { enumerable: true, get: function () { return types_1.OauthVersion; } });
const dynamic_credentials_proxy_1 = require("../credentials/dynamic-credentials-proxy");
const oauth_browser_binding_service_1 = require("../oauth/oauth-browser-binding.service");
const constants_2 = require("@n8n/constants");
const OAUTH_FLOW_CACHE_PREFIX = 'oauth:flow:';
const OAUTH_REQUEST_TIMEOUT_MS = 30 * constants_2.Time.seconds.toMilliseconds;
const OFFLINE_ACCESS_SCOPE = 'offline_access';
function shouldSkipAuthOnOAuthCallback() {
    const value = process.env.N8N_SKIP_AUTH_ON_OAUTH_CALLBACK?.toLowerCase() ?? 'false';
    return value === 'true';
}
exports.skipAuthOnOAuthCallback = shouldSkipAuthOnOAuthCallback();
function withOfflineAccess(resourceScopes, authServerScopes) {
    const offered = authServerScopes?.includes(OFFLINE_ACCESS_SCOPE) ?? false;
    return offered && !resourceScopes.includes(OFFLINE_ACCESS_SCOPE)
        ? [...resourceScopes, OFFLINE_ACCESS_SCOPE]
        : resourceScopes;
}
const csrfUserId = (csrfData) => typeof csrfData.userId === 'string' ? csrfData.userId : undefined;
class InvalidTargetError extends errors_1.BadRequestError {
    constructor(message) {
        super(message, undefined, 'invalid_target');
        this.name = 'InvalidTargetError';
    }
}
exports.InvalidTargetError = InvalidTargetError;
class InvalidOAuthUrlError extends errors_1.BadRequestError {
    constructor(message) {
        super(message);
        this.name = 'InvalidOAuthUrlError';
    }
}
exports.InvalidOAuthUrlError = InvalidOAuthUrlError;
let OauthService = class OauthService {
    constructor(logger, lockService, credentialsHelper, credentialsRepository, credentialsFinderService, urlService, globalConfig, externalHooks, cipher, dynamicCredentialsProxy, authService, oauthJweServiceProxy, browserBindingService, eventService, cacheService, outboundHttp, ssrfProtectionService, ssrfProtectionConfig) {
        this.logger = logger;
        this.lockService = lockService;
        this.credentialsHelper = credentialsHelper;
        this.credentialsRepository = credentialsRepository;
        this.credentialsFinderService = credentialsFinderService;
        this.urlService = urlService;
        this.globalConfig = globalConfig;
        this.externalHooks = externalHooks;
        this.cipher = cipher;
        this.dynamicCredentialsProxy = dynamicCredentialsProxy;
        this.authService = authService;
        this.oauthJweServiceProxy = oauthJweServiceProxy;
        this.browserBindingService = browserBindingService;
        this.eventService = eventService;
        this.cacheService = cacheService;
        this.ssrfProtectionService = ssrfProtectionService;
        this.ssrfProtectionConfig = ssrfProtectionConfig;
        this.oauth2Refreshes = new backend_common_1.SingleFlightLease();
        this.http = outboundHttp.requests({
            timeout: OAUTH_REQUEST_TIMEOUT_MS,
        });
    }
    getSsrfBridge() {
        return this.ssrfProtectionConfig.enabled ? this.ssrfProtectionService : undefined;
    }
    oauthFlowCacheKey(token) {
        return `${OAUTH_FLOW_CACHE_PREFIX}${token}`;
    }
    validateOAuthUrlOrThrow(url) {
        try {
            (0, validate_oauth_url_1.validateOAuthUrl)(url);
        }
        catch (e) {
            this.logger.error('Invalid OAuth URL', { url, error: e });
            throw e;
        }
    }
    validateAuthServerUrlOrThrow(url) {
        try {
            this.validateOAuthUrlOrThrow(url);
        }
        catch (error) {
            if (error instanceof errors_1.BadRequestError) {
                throw new InvalidOAuthUrlError(error.message);
            }
            throw error;
        }
    }
    normalizeResourceUrl(url) {
        return url.trim().replace(/\/+$/, '');
    }
    parseUrlOriginOrThrow(url, message) {
        try {
            return new URL(url).origin;
        }
        catch (error) {
            this.logger.debug('Invalid OAuth URL format', { url, error });
            throw new InvalidTargetError(message);
        }
    }
    validateResourceUrlOrThrow(resourceUrl) {
        const normalizedResourceUrl = this.normalizeResourceUrl(resourceUrl);
        try {
            this.validateOAuthUrlOrThrow(normalizedResourceUrl);
            new URL(normalizedResourceUrl);
        }
        catch (error) {
            this.logger.debug('Invalid OAuth resource URL', { resourceUrl, error });
            throw new InvalidTargetError('Invalid resource URL format.');
        }
        return normalizedResourceUrl;
    }
    resolveResourceUrl(suppliedResourceUrl, discoveredResource, serverUrl) {
        if (!suppliedResourceUrl)
            return discoveredResource;
        if (discoveredResource && suppliedResourceUrl !== discoveredResource) {
            this.logger.debug('OAuth resource URL does not match discovered resource', {
                suppliedResourceUrl,
                discoveredResource,
            });
            throw new InvalidTargetError("The provided resource URL does not match the server's advertised resource.");
        }
        if (!discoveredResource) {
            const resourceOrigin = this.parseUrlOriginOrThrow(suppliedResourceUrl, 'Invalid resource URL format.');
            const serverOrigin = this.parseUrlOriginOrThrow(serverUrl, 'Invalid OAuth server URL format.');
            if (resourceOrigin !== serverOrigin) {
                this.logger.debug('OAuth resource URL origin does not match server URL origin', {
                    resourceOrigin,
                    serverOrigin,
                });
                throw new InvalidTargetError('Resource URL origin must match the server URL origin.');
            }
        }
        return suppliedResourceUrl;
    }
    getBaseUrl(oauthVersion) {
        const restUrl = `${this.urlService.getInstanceBaseUrl()}/${this.globalConfig.endpoints.rest}`;
        return `${restUrl}/oauth${oauthVersion}-credential`;
    }
    async getCredentialForAuthFlow(req) {
        const { id: credentialId } = req.query;
        if (!credentialId) {
            throw new errors_1.BadRequestError('Required credential ID is missing');
        }
        const existingCredential = await this.credentialsFinderService.findById(credentialId, {
            includeInstanceCredentials: true,
        });
        const requiredScope = existingCredential?.isResolvable
            ? 'credential:connect'
            : 'credential:update';
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, req.user, [requiredScope], { includeInstanceCredentials: true });
        if (!credential) {
            this.logger.error('OAuth credential authorization failed because the current user does not have the correct permissions', { userId: req.user.id, credentialId });
            throw new errors_1.NotFoundError(constants_1.RESPONSE_ERROR_MESSAGES.NO_CREDENTIAL);
        }
        return credential;
    }
    async buildCsrfStateData(credential, req) {
        if (credential.isResolvable) {
            const resolverId = this.dynamicCredentialsProxy.getSystemResolverId();
            if (resolverId !== null) {
                const cookieToken = this.authService.getCookieToken(req);
                if (cookieToken) {
                    return {
                        cid: credential.id,
                        origin: 'dynamic-credential',
                        userId: req.user.id,
                        credentialResolverId: resolverId,
                        authorizationHeader: `Bearer ${cookieToken}`,
                        authMetadata: { source: 'manual-execution' },
                    };
                }
            }
        }
        return {
            cid: credential.id,
            origin: 'static-credential',
            userId: req.user.id,
        };
    }
    async getAdditionalData(userId) {
        return await WorkflowExecuteAdditionalData.getBase({ userId });
    }
    async getDecryptedDataForAuthUri(credential, additionalData) {
        return await this.getDecryptedData(credential, additionalData, false);
    }
    async getDecryptedDataForCallback(credential, additionalData) {
        return await this.getDecryptedData(credential, additionalData, true);
    }
    async getDecryptedData(credential, additionalData, raw) {
        return await this.credentialsHelper.getDecrypted(additionalData, credential, credential.type, 'internal', undefined, raw);
    }
    async applyDefaultsAndOverwrites(credential, decryptedData, additionalData) {
        return (await this.credentialsHelper.applyDefaultsAndOverwrites(additionalData, decryptedData, credential.type, 'internal', undefined, undefined));
    }
    async encryptAndSaveData(credential, toUpdate, toDelete = []) {
        const identifier = (0, account_identifier_1.extractAccountIdentifierFromData)(toUpdate);
        if (identifier) {
            toUpdate.accountIdentifier = identifier;
        }
        const credentials = new n8n_core_1.Credentials(credential, credential.type, credential.data);
        await credentials.updateData(toUpdate, toDelete);
        const update = {
            data: credentials.getDataToSave().data,
            ...(toUpdate.oauthTokenData !== undefined && { pendingAuthorizationExpiresAt: null }),
            updatedAt: new Date(),
        };
        await this.credentialsRepository.update(credential.id, update);
    }
    async getCredentialWithoutUser(credentialId, options = {}) {
        return await this.credentialsRepository.findOneBy({
            id: credentialId,
            ...(options.onlyProjectCredentials ? { usageScope: 'project' } : {}),
        });
    }
    async createCsrfState() {
        const token = new csrf_1.default();
        const csrfSecret = token.secretSync();
        const stateToken = token.create(csrfSecret);
        const state = {
            token: stateToken,
            createdAt: Date.now(),
        };
        const base64State = Buffer.from(JSON.stringify(state)).toString('base64');
        return [csrfSecret, base64State, stateToken];
    }
    async storeOauthFlowState(stateToken, flowState) {
        await this.cacheService.set(this.oauthFlowCacheKey(stateToken), flowState, types_1.MAX_CSRF_AGE);
    }
    async peekOauthFlowState(stateToken) {
        return await this.cacheService.get(this.oauthFlowCacheKey(stateToken));
    }
    async consumeOauthFlowState(stateToken) {
        const key = this.oauthFlowCacheKey(stateToken);
        const value = await this.cacheService.get(key);
        if (value === undefined)
            return undefined;
        await this.cacheService.delete(key);
        return value;
    }
    async decodeCsrfState(encodedState, req) {
        const errorMessage = 'Invalid state format';
        const decodedState = Buffer.from(encodedState, 'base64').toString();
        const decoded = (0, n8n_workflow_1.jsonParse)(decodedState, {
            errorMessage,
        });
        const flowState = typeof decoded.token === 'string' ? await this.peekOauthFlowState(decoded.token) : undefined;
        const decryptedState = flowState?.stateData ??
            (typeof decoded.data === 'string'
                ? (0, n8n_workflow_1.jsonParse)(await this.cipher.decryptV2(decoded.data), {
                    errorMessage,
                })
                : undefined);
        if (!decryptedState) {
            throw new n8n_workflow_1.UnexpectedError('The OAuth callback state is invalid!');
        }
        if (typeof decryptedState.cid !== 'string' || typeof decoded.token !== 'string') {
            throw new n8n_workflow_1.UnexpectedError(errorMessage);
        }
        if (typeof decryptedState.bindingHash === 'string' && decryptedState.bindingHash.length > 0) {
            const result = this.browserBindingService.verifyBinding(req, decryptedState.bindingHash);
            if (!result.ok) {
                this.eventService.emit('oauth-callback-binding-rejected', {
                    reason: result.reason,
                    credentialId: decryptedState.cid,
                    origin: decryptedState.origin,
                });
                throw new errors_1.AuthError('This OAuth flow was started in a different browser. Please retry from your original window.');
            }
        }
        if (decryptedState.origin === 'dynamic-credential') {
            if (decryptedState.userId !== undefined && decryptedState.userId !== req.user?.id) {
                throw new errors_1.AuthError('Unauthorized');
            }
            return [
                { ...decoded, ...decryptedState },
                await this.getCredentialWithoutUser(decryptedState.cid, { onlyProjectCredentials: true }),
            ];
        }
        if (exports.skipAuthOnOAuthCallback) {
            return [
                { ...decoded, ...decryptedState },
                await this.getCredentialWithoutUser(decryptedState.cid),
            ];
        }
        if (req.user?.id === undefined || decryptedState.userId !== req.user.id) {
            throw new errors_1.AuthError('Unauthorized');
        }
        const credential = await this.credentialsFinderService.findCredentialForUser(decryptedState.cid, req.user, ['credential:update'], { includeInstanceCredentials: true });
        return [{ ...decoded, ...decryptedState }, credential];
    }
    verifyCsrfState(flowState, state) {
        if (!flowState)
            return false;
        const token = new csrf_1.default();
        return (typeof flowState.csrfSecret === 'string' && token.verify(flowState.csrfSecret, state.token));
    }
    async resolveCredential(req) {
        const { state: encodedState } = req.query;
        const [state, credential] = await this.decodeCsrfState(encodedState, req);
        if (!credential) {
            throw new errors_1.NotFoundError(constants_1.RESPONSE_ERROR_MESSAGES.NO_CREDENTIAL);
        }
        const additionalData = await this.getAdditionalData(csrfUserId(state));
        const decryptedDataOriginal = await this.getDecryptedDataForCallback(credential, additionalData);
        const oauthCredentials = await this.applyDefaultsAndOverwrites(credential, decryptedDataOriginal, additionalData);
        const flowState = await this.consumeOauthFlowState(state.token);
        if (!flowState || !this.verifyCsrfState(flowState, state)) {
            throw new n8n_workflow_1.UnexpectedError('The OAuth callback state is invalid!');
        }
        return [credential, decryptedDataOriginal, oauthCredentials, state, flowState];
    }
    renderCallbackError(res, message, reason) {
        res.render('oauth-error-callback', { error: { message, reason } });
    }
    extractCallbackErrorMessage(error, credentialType) {
        const hasServerText = error instanceof client_oauth2_1.AuthError && error.fromErrorObject;
        if (hasServerText && !(credentialType && this.hasFixedTokenEndpoint(credentialType))) {
            return 'The OAuth2 server rejected the token request';
        }
        return error.message;
    }
    extractCallbackErrorReason(error) {
        if (error instanceof client_oauth2_1.AuthError) {
            const errorCode = error.body?.error;
            return typeof errorCode === 'string' && errorCode.length > 0 ? errorCode : undefined;
        }
        const causes = [];
        let cause = error.cause;
        while (cause instanceof Error) {
            causes.push(cause.message);
            cause = cause.cause;
        }
        return causes.length ? causes.join(': ') : undefined;
    }
    async getOAuthCredentials(credential, userId) {
        const additionalData = await this.getAdditionalData(userId);
        const decryptedDataOriginal = await this.getDecryptedDataForAuthUri(credential, additionalData);
        const userCanEditScope = constants_1.GENERIC_OAUTH2_CREDENTIALS_WITH_EDITABLE_SCOPE.includes(credential.type) ||
            this.hasEditableScopeProperty(credential.type);
        if (decryptedDataOriginal?.scope &&
            credential.type.includes('OAuth2') &&
            (credential.isManaged || !userCanEditScope)) {
            delete decryptedDataOriginal.scope;
        }
        const oauthCredentials = await this.applyDefaultsAndOverwrites(credential, decryptedDataOriginal, additionalData);
        return oauthCredentials;
    }
    credentialIsAccessibleToProject(credential, projectId) {
        return credential.isGlobal || (credential.shared ?? []).some((s) => s.projectId === projectId);
    }
    resolveOAuth2Resource(oauthCredentials, oauthTokenData) {
        return oauthTokenData.resource ?? oauthCredentials.resource ?? oauthCredentials.resourceUrl;
    }
    createOAuth2ClientForRefresh(oauthCredentials, resource) {
        if (!oauthCredentials.clientId || !oauthCredentials.accessTokenUrl) {
            throw new n8n_workflow_1.UserError('This credential is missing its OAuth client details. Reconnect it to continue.');
        }
        const scopes = oauthCredentials.scope
            ?.split(' ')
            .map((s) => s.trim())
            .filter(Boolean);
        return new client_oauth2_1.ClientOAuth2({
            clientId: oauthCredentials.clientId,
            ...(0, client_oauth2_1.resolveClientAuthOptions)(oauthCredentials),
            accessTokenUri: oauthCredentials.accessTokenUrl,
            scopes: scopes?.length ? scopes : undefined,
            ...(resource ? { resource } : {}),
            ignoreSSLIssues: oauthCredentials.ignoreSSLIssues,
            authentication: oauthCredentials.authentication ?? 'header',
            ssrfBridge: this.getSsrfBridge(),
        });
    }
    mergeRefreshedOAuthTokenData(oauthTokenData, refreshedData, resource) {
        const merged = {
            ...oauthTokenData,
            ...refreshedData,
            ...(!refreshedData.resource && resource ? { resource } : {}),
        };
        const expiresInSeconds = Number(merged.expires_in);
        return Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
            ? {
                ...merged,
                n8n_expires_at: String(Date.now() + expiresInSeconds * 1000),
            }
            : merged;
    }
    getOAuth2AccessToken(tokenData) {
        if (!(0, is_record_1.isRecord)(tokenData))
            return undefined;
        const accessToken = tokenData.access_token ?? tokenData.accessToken;
        return typeof accessToken === 'string' && accessToken.length > 0 ? accessToken : undefined;
    }
    getOAuth2TokenRevision(tokenData) {
        const accessToken = this.getOAuth2AccessToken(tokenData);
        const expiresAt = (0, is_record_1.isRecord)(tokenData) ? Number(tokenData.n8n_expires_at) : Number.NaN;
        return {
            ...(accessToken ? { accessToken } : {}),
            ...(Number.isFinite(expiresAt) ? { expiresAt } : {}),
        };
    }
    oauth2TokenRevisionChanged(initial, current) {
        const currentRevision = this.getOAuth2TokenRevision(current);
        return (initial.accessToken !== currentRevision.accessToken ||
            initial.expiresAt !== currentRevision.expiresAt);
    }
    buildOAuth2RefreshResult(tokenData, accessToken = this.getOAuth2AccessToken(tokenData)) {
        if (!accessToken)
            return null;
        const expiresAt = Number(tokenData.n8n_expires_at);
        const expiresInSeconds = Number(tokenData.expires_in);
        return {
            headers: { Authorization: `Bearer ${accessToken}` },
            ...(Number.isFinite(expiresAt) ? { expiresAt } : {}),
            ...(Number.isFinite(expiresInSeconds) && expiresInSeconds > 0 ? { expiresInSeconds } : {}),
        };
    }
    isRevokedOAuth2GrantError(error) {
        if (!(error instanceof client_oauth2_1.AuthError))
            return false;
        return error.body?.error === 'invalid_grant';
    }
    async refreshOAuth2CredentialById(credentialId, projectId, knownTokenRevision) {
        const credential = await this.credentialsRepository.findOne({
            where: { id: credentialId, usageScope: 'project' },
            relations: { shared: true },
        });
        if (!credential)
            return null;
        if (!this.credentialIsAccessibleToProject(credential, projectId))
            return null;
        const oauthCredentials = await this.getOAuthCredentials(credential);
        const oauthTokenData = oauthCredentials.oauthTokenData;
        if (!oauthTokenData)
            return null;
        const tokenRevision = knownTokenRevision ?? this.getOAuth2TokenRevision(oauthTokenData);
        const runRefresh = async () => {
            const currentCredential = await this.credentialsRepository.findOne({
                where: { id: credentialId, usageScope: 'project' },
                relations: { shared: true },
            });
            if (!currentCredential)
                return null;
            if (!this.credentialIsAccessibleToProject(currentCredential, projectId))
                return null;
            const currentOAuthCredentials = await this.getOAuthCredentials(currentCredential);
            const currentTokenData = currentOAuthCredentials.oauthTokenData;
            if (!currentTokenData)
                return null;
            if (this.oauth2TokenRevisionChanged(tokenRevision, currentTokenData)) {
                return this.buildOAuth2RefreshResult(currentTokenData);
            }
            const resource = this.resolveOAuth2Resource(currentOAuthCredentials, currentTokenData);
            const oAuthClient = this.createOAuth2ClientForRefresh(currentOAuthCredentials, resource);
            const token = oAuthClient.createToken({
                ...currentTokenData,
                ...(currentTokenData.access_token ? { access_token: currentTokenData.access_token } : {}),
                ...(currentTokenData.refresh_token
                    ? { refresh_token: currentTokenData.refresh_token }
                    : {}),
            }, currentTokenData.token_type);
            let refreshed;
            try {
                refreshed =
                    currentOAuthCredentials.grantType === 'clientCredentials'
                        ? await token.client.credentials.getToken()
                        : await token.refresh();
            }
            catch (error) {
                if (this.isRevokedOAuth2GrantError(error)) {
                    throw new n8n_workflow_1.UserError('This credential needs to be reconnected.', { cause: error });
                }
                this.logger.warn('Failed to refresh OAuth2 token for credential', {
                    credentialId,
                    error: error instanceof Error ? error.message : String(error),
                });
                return null;
            }
            const refreshedTokenData = this.mergeRefreshedOAuthTokenData(currentTokenData, refreshed.data, resource);
            try {
                await this.encryptAndSaveData(currentCredential, { oauthTokenData: refreshedTokenData });
            }
            catch (error) {
                this.logger.warn('Refreshed OAuth2 token but failed to persist new token data', {
                    credentialId,
                    error: error instanceof Error ? error.message : String(error),
                });
                throw new n8n_workflow_1.OperationalError('Could not save the refreshed OAuth2 token.', { cause: error });
            }
            return this.buildOAuth2RefreshResult(refreshedTokenData, refreshed.accessToken);
        };
        return await this.oauth2Refreshes.run(credentialId, runRefresh, {
            lockService: this.lockService,
            namespace: backend_common_1.LockNamespace.CREDENTIALS,
            waitTimeoutMs: 10_000,
            leaseTtlMs: 30_000,
            onLeaseTimeout: (error) => {
                this.logger.warn('Refreshing the OAuth2 credential without cross-process coordination', {
                    credentialId,
                    error: error.message,
                });
            },
        });
    }
    hasFixedTokenEndpoint(credentialType) {
        try {
            const tokenUrl = this.credentialsHelper
                .getCredentialsProperties(credentialType)
                .find((property) => property.name === 'accessTokenUrl');
            return (tokenUrl?.type === 'hidden' &&
                typeof tokenUrl.default === 'string' &&
                !tokenUrl.default.startsWith('='));
        }
        catch {
            return false;
        }
    }
    hasEditableScopeProperty(credentialType) {
        try {
            const properties = this.credentialsHelper.getCredentialsProperties(credentialType);
            const scopeProperty = properties.find((property) => property.name === 'scope');
            return scopeProperty !== undefined && scopeProperty.type !== 'hidden';
        }
        catch {
            return false;
        }
    }
    async discoverAndResolveResource(oauthCredentials, csrfData, authorizationServerUrl) {
        let discoveredResource;
        let discoveredScopes;
        let suppliedResourceUrl;
        if (oauthCredentials.resourceUrl) {
            suppliedResourceUrl = this.validateResourceUrlOrThrow(oauthCredentials.resourceUrl);
        }
        try {
            const protectedResourceMetadata = await this.discoverProtectedResourceMetadata(oauthCredentials.serverUrl);
            if (oauthCredentials.useDynamicClientRegistration) {
                const discoveredAuthorizationServerUrl = protectedResourceMetadata.authorization_servers[0]?.trim();
                if (!discoveredAuthorizationServerUrl) {
                    throw new InvalidOAuthUrlError('OAuth url is not a valid URL.');
                }
                authorizationServerUrl = discoveredAuthorizationServerUrl;
                this.validateAuthServerUrlOrThrow(authorizationServerUrl);
            }
            discoveredResource = protectedResourceMetadata.resource;
            discoveredScopes = protectedResourceMetadata.scopes_supported;
            this.logger.debug('Protected resource discovery succeeded', {
                resourceUrl: oauthCredentials.serverUrl,
                ...(oauthCredentials.useDynamicClientRegistration ? { authorizationServerUrl } : {}),
                discoveredResource,
                discoveredScopes,
            });
        }
        catch (error) {
            if (error instanceof InvalidOAuthUrlError) {
                throw error;
            }
            this.logger.debug(oauthCredentials.useDynamicClientRegistration
                ? 'Protected resource discovery failed, assuming serverUrl is authorization server'
                : 'Protected resource discovery failed', {
                serverUrl: oauthCredentials.serverUrl,
                error: error.message,
            });
            if (oauthCredentials.useDynamicClientRegistration) {
                authorizationServerUrl = oauthCredentials.serverUrl;
            }
        }
        const resolvedResource = this.resolveResourceUrl(suppliedResourceUrl, discoveredResource, oauthCredentials.serverUrl);
        if (resolvedResource) {
            oauthCredentials.resource = resolvedResource;
            csrfData.resource = resolvedResource;
        }
        return { authorizationServerUrl, discoveredResource, discoveredScopes };
    }
    applyBrowserBindingIfEnabled(csrfData, req, res) {
        if (!req || !res)
            return;
        if (!this.browserBindingService.isEnabled())
            return;
        const nonce = this.browserBindingService.ensureBindingCookie(req, res);
        csrfData.bindingHash = this.browserBindingService.computeHash(nonce);
    }
    async generateAOauth2AuthUri(credential, csrfData, req, res) {
        this.applyBrowserBindingIfEnabled(csrfData, req, res);
        const oauthCredentials = await this.getOAuthCredentials(credential, csrfUserId(csrfData));
        const toUpdate = {};
        const toDelete = [];
        let authorizationServerUrl = oauthCredentials.serverUrl;
        let discoveredScopes;
        if (oauthCredentials.serverUrl) {
            this.validateOAuthUrlOrThrow(oauthCredentials.serverUrl);
            const { authorizationServerUrl: resolvedAuthUrl, discoveredScopes: resolvedScopes } = await this.discoverAndResolveResource(oauthCredentials, csrfData, authorizationServerUrl);
            authorizationServerUrl = resolvedAuthUrl;
            discoveredScopes = resolvedScopes;
        }
        else if (oauthCredentials.resourceUrl) {
            const resolvedResource = this.validateResourceUrlOrThrow(oauthCredentials.resourceUrl);
            oauthCredentials.resource = resolvedResource;
            csrfData.resource = resolvedResource;
        }
        if (oauthCredentials.useDynamicClientRegistration && oauthCredentials.serverUrl) {
            await this.performDynamicClientRegistration(oauthCredentials, authorizationServerUrl, toUpdate, toDelete, discoveredScopes);
        }
        this.validateOAuthUrlOrThrow(oauthCredentials.authUrl ?? '');
        this.validateOAuthUrlOrThrow(oauthCredentials.accessTokenUrl ?? '');
        const [csrfSecret, state, stateToken] = await this.createCsrfState();
        const oAuthOptions = {
            ...this.convertCredentialToOptions(oauthCredentials),
            state,
        };
        if (oauthCredentials.authQueryParameters) {
            oAuthOptions.query = qs.parse(oauthCredentials.authQueryParameters);
        }
        await this.externalHooks.run('oauth2.authenticate', [oAuthOptions]);
        const flowState = { csrfSecret, stateData: csrfData };
        if (this.shouldUsePkce(oauthCredentials)) {
            const { code_verifier, code_challenge } = await (0, pkce_challenge_1.default)();
            oAuthOptions.query = {
                ...oAuthOptions.query,
                code_challenge,
                code_challenge_method: 'S256',
            };
            flowState.codeVerifier = code_verifier;
        }
        await this.storeOauthFlowState(stateToken, flowState);
        if (Object.keys(toUpdate).length > 0 || toDelete.length > 0) {
            await this.encryptAndSaveData(credential, toUpdate, toDelete);
        }
        const oAuthObj = new client_oauth2_1.ClientOAuth2(oAuthOptions);
        const returnUri = oAuthObj.code.getUri();
        this.logger.debug('OAuth2 authorization url created for credential', {
            csrfData,
            credentialId: credential.id,
        });
        return returnUri.toString();
    }
    async performDynamicClientRegistration(oauthCredentials, authorizationServerUrl, toUpdate, toDelete, discoveredResourceScopes) {
        const dcrAuthorizationServerUrl = authorizationServerUrl ?? oauthCredentials.serverUrl;
        const issuerUrl = new URL(dcrAuthorizationServerUrl);
        const pathComponent = issuerUrl.pathname.replace(/\/$/, '');
        const pathIsWellKnown = pathComponent.startsWith('/.well-known');
        const discoveryUrls = pathComponent && !pathIsWellKnown
            ? [
                `${issuerUrl.origin}/.well-known/oauth-authorization-server${pathComponent}`,
                `${issuerUrl.origin}/.well-known/openid-configuration${pathComponent}`,
                `${dcrAuthorizationServerUrl}/.well-known/openid-configuration`,
                `${issuerUrl.origin}/.well-known/oauth-authorization-server`,
            ]
            : [
                `${issuerUrl.origin}/.well-known/oauth-authorization-server`,
                `${issuerUrl.origin}/.well-known/openid-configuration`,
            ];
        let data;
        let lastError;
        for (const url of discoveryUrls) {
            try {
                this.validateOAuthUrlOrThrow(url);
                data = await this.fetchDiscoveryDocument(url);
                break;
            }
            catch (error) {
                lastError = error;
            }
        }
        if (!data) {
            throw new errors_1.BadRequestError(`Failed to discover OAuth2 authorization server metadata. Tried: ${discoveryUrls.join(', ')}. Last error: ${lastError?.message}`);
        }
        const metadataValidation = oauth2_dynamic_client_registration_schema_1.oAuthAuthorizationServerMetadataSchema.safeParse(data);
        if (!metadataValidation.success) {
            throw new errors_1.BadRequestError(`Invalid OAuth2 server metadata: ${metadataValidation.error.issues.map((e) => e.message).join(', ')}`);
        }
        const { authorization_endpoint, token_endpoint, registration_endpoint, scopes_supported } = metadataValidation.data;
        const effectiveScopes = discoveredResourceScopes?.length
            ? withOfflineAccess(discoveredResourceScopes, scopes_supported)
            : scopes_supported;
        const scope = effectiveScopes?.length ? effectiveScopes.join(' ') : undefined;
        if (scope) {
            oauthCredentials.scope = scope;
            toUpdate.scope = scope;
        }
        const { grantType, authentication, usePkce } = this.selectGrantTypeAndAuthenticationMethod(metadataValidation.data.grant_types_supported ?? ['authorization_code', 'implicit'], metadataValidation.data.token_endpoint_auth_methods_supported ?? [], metadataValidation.data.code_challenge_methods_supported ?? []);
        const { grant_types, token_endpoint_auth_method } = this.mapGrantTypeAndAuthenticationMethod(grantType, authentication);
        const registerPayload = {
            redirect_uris: [`${this.getBaseUrl(2)}/callback`],
            token_endpoint_auth_method,
            grant_types,
            response_types: ['code'],
            client_name: 'n8n',
            client_uri: 'https://n8n.io/',
            scope,
            ...(oauthCredentials.jweEnabled === true
                ? await this.oauthJweServiceProxy.getDcrJweFields(oauthCredentials.inlineJwks === true)
                : {}),
        };
        await this.externalHooks.run('oauth2.dynamicClientRegistration', [registerPayload]);
        const registerResult = await this.http.request({
            url: registration_endpoint,
            method: 'POST',
            body: registerPayload,
            json: true,
        });
        const registrationValidation = oauth2_dynamic_client_registration_schema_1.dynamicClientRegistrationResponseSchema.safeParse(registerResult);
        if (!registrationValidation.success) {
            throw new errors_1.BadRequestError(`Invalid client registration response: ${registrationValidation.error.issues.map((e) => e.message).join(', ')}`);
        }
        const { client_id, client_secret } = registrationValidation.data;
        this.applyDcrManagedFields(oauthCredentials, toUpdate, toDelete, {
            authUrl: authorization_endpoint,
            accessTokenUrl: token_endpoint,
            grantType,
            authentication,
            usePkce,
            clientId: client_id,
            clientSecret: authentication ? client_secret : undefined,
        });
    }
    applyDcrManagedFields(oauthCredentials, toUpdate, toDelete, negotiated) {
        for (const field of dcr_managed_fields_1.DCR_MANAGED_CREDENTIAL_FIELDS) {
            const value = negotiated[field];
            if (value === undefined) {
                Reflect.deleteProperty(oauthCredentials, field);
                toDelete.push(field);
                continue;
            }
            Object.assign(oauthCredentials, { [field]: value });
            toUpdate[field] = value;
        }
    }
    async generateAOauth1AuthUri(credential, csrfData, req, res) {
        this.applyBrowserBindingIfEnabled(csrfData, req, res);
        const oauthCredentials = await this.getOAuthCredentials(credential, csrfUserId(csrfData));
        this.validateOAuthUrlOrThrow(oauthCredentials.authUrl ?? '');
        this.validateOAuthUrlOrThrow(oauthCredentials.requestTokenUrl ?? '');
        this.validateOAuthUrlOrThrow(oauthCredentials.accessTokenUrl ?? '');
        const [csrfSecret, state, stateToken] = await this.createCsrfState();
        const signatureMethod = oauthCredentials.signatureMethod;
        const oAuthOptions = {
            consumer: {
                key: oauthCredentials.consumerKey,
                secret: oauthCredentials.consumerSecret,
            },
            signature_method: signatureMethod,
            hash_function(base, key) {
                const algorithm = types_1.algorithmMap[signatureMethod] ?? 'sha1';
                return (0, crypto_1.createHmac)(algorithm, key).update(base).digest('base64');
            },
        };
        const oauthRequestData = {
            oauth_callback: `${this.getBaseUrl(1)}/callback?state=${state}`,
        };
        await this.externalHooks.run('oauth1.authenticate', [oAuthOptions, oauthRequestData]);
        const oauth = new oauth_1_0a_1.default(oAuthOptions);
        const options = {
            method: 'POST',
            url: oauthCredentials.requestTokenUrl,
            data: oauthRequestData,
        };
        const data = oauth.toHeader(oauth.authorize(options));
        const response = await this.http.request({
            url: options.url,
            method: 'POST',
            headers: { ...data },
            encoding: 'text',
        });
        if (typeof response !== 'string') {
            throw new errors_1.BadRequestError('Expected string response from OAuth1 request token endpoint, but received invalid response type');
        }
        const paramsParser = new URLSearchParams(response);
        const responseJson = Object.fromEntries(paramsParser.entries());
        if (!responseJson.oauth_token) {
            throw new errors_1.BadRequestError('OAuth1 request token response is missing required oauth_token parameter');
        }
        const returnUriUrl = new URL(oauthCredentials.authUrl);
        returnUriUrl.searchParams.set('oauth_token', responseJson.oauth_token);
        const returnUri = returnUriUrl.toString();
        await this.storeOauthFlowState(stateToken, {
            csrfSecret,
            stateData: csrfData,
            oauthTokenSecret: responseJson.oauth_token_secret ?? '',
        });
        this.logger.debug('OAuth1 authorization url created for credential', {
            csrfData,
            credentialId: credential.id,
        });
        return returnUri;
    }
    async getOAuth1AccessToken(oauthCredentials, params) {
        const { signatureMethod } = oauthCredentials;
        const oauth = new oauth_1_0a_1.default({
            consumer: {
                key: oauthCredentials.consumerKey,
                secret: oauthCredentials.consumerSecret,
            },
            signature_method: signatureMethod,
            hash_function(base, key) {
                const algorithm = types_1.algorithmMap[signatureMethod] ?? 'sha1';
                return (0, crypto_1.createHmac)(algorithm, key).update(base).digest('base64');
            },
        });
        const requestData = {
            method: 'POST',
            url: oauthCredentials.accessTokenUrl,
            data: { oauth_verifier: params.oauthVerifier },
        };
        const token = { key: params.oauthToken, secret: params.oauthTokenSecret };
        const headers = oauth.toHeader(oauth.authorize(requestData, token));
        const response = await this.http.request({
            url: oauthCredentials.accessTokenUrl,
            method: 'POST',
            body: new URLSearchParams({ oauth_verifier: params.oauthVerifier }).toString(),
            headers: {
                ...headers,
                'content-type': 'application/x-www-form-urlencoded',
            },
            encoding: 'text',
        });
        if (typeof response !== 'string') {
            throw new errors_1.BadRequestError('Expected string response from OAuth1 access token endpoint, but received invalid response type');
        }
        return Object.fromEntries(new URLSearchParams(response).entries());
    }
    convertCredentialToOptions(credential) {
        const options = {
            clientId: credential.clientId,
            clientSecret: credential.clientSecret ?? '',
            accessTokenUri: credential.accessTokenUrl ?? '',
            authorizationUri: credential.authUrl ?? '',
            authentication: credential.authentication ?? 'header',
            redirectUri: `${this.getBaseUrl(2)}/callback`,
            scopes: (0, split_1.default)(credential.scope ?? 'openid', ','),
            scopesSeparator: credential.scope?.includes(',') ? ',' : ' ',
            resource: credential.resource,
            ignoreSSLIssues: credential.ignoreSSLIssues ?? false,
        };
        if (credential.additionalBodyProperties &&
            typeof credential.additionalBodyProperties === 'string') {
            const parsedBody = (0, n8n_workflow_1.jsonParse)(credential.additionalBodyProperties);
            if (parsedBody) {
                options.body = parsedBody;
            }
        }
        return options;
    }
    shouldUsePkce(credential) {
        return (credential.grantType === 'pkce' ||
            (credential.grantType === 'authorizationCode' && credential.usePkce === true));
    }
    async fetchDiscoveryDocument(url) {
        const response = await this.http.request({
            url,
            method: 'GET',
            json: true,
            returnFullResponse: true,
        });
        if (response.statusCode !== 200) {
            throw new n8n_workflow_1.OperationalError(`Request failed with status code ${response.statusCode}`);
        }
        return response.body;
    }
    async discoverProtectedResourceMetadata(resourceUrl) {
        this.validateOAuthUrlOrThrow(resourceUrl);
        const url = new URL(resourceUrl);
        const pathComponent = url.pathname.replace(/\/$/, '');
        const discoveryUrls = pathComponent
            ? [
                `${url.origin}/.well-known/oauth-protected-resource${pathComponent}`,
                `${url.origin}/.well-known/oauth-protected-resource`,
            ]
            : [
                `${url.origin}/.well-known/oauth-protected-resource`,
            ];
        for (const discoveryUrl of discoveryUrls) {
            try {
                this.validateOAuthUrlOrThrow(discoveryUrl);
                const data = await this.fetchDiscoveryDocument(discoveryUrl);
                if (data && typeof data === 'object') {
                    const record = data;
                    const authorizationServers = record.authorization_servers;
                    if (Array.isArray(authorizationServers) && authorizationServers.length > 0) {
                        const rawResource = record.resource;
                        const resource = typeof rawResource === 'string'
                            ? this.validateResourceUrlOrThrow(rawResource)
                            : undefined;
                        const rawScopes = record.scopes_supported;
                        const scopes_supported = Array.isArray(rawScopes)
                            ? rawScopes.filter((s) => typeof s === 'string')
                            : undefined;
                        return {
                            authorization_servers: authorizationServers,
                            ...(resource ? { resource } : {}),
                            ...(scopes_supported?.length ? { scopes_supported } : {}),
                        };
                    }
                }
            }
            catch (error) {
            }
        }
        throw new errors_1.BadRequestError(`Failed to discover protected resource metadata. Tried: ${discoveryUrls.join(', ')}`);
    }
    selectGrantTypeAndAuthenticationMethod(grantTypes, tokenEndpointAuthMethods, codeChallengeMethods) {
        const supportsPkce = codeChallengeMethods.includes('S256');
        if (grantTypes.includes('authorization_code')) {
            if (supportsPkce &&
                (tokenEndpointAuthMethods.length === 0 || tokenEndpointAuthMethods.includes('none'))) {
                return { grantType: 'pkce', usePkce: true };
            }
            const authentication = this.selectClientSecretAuthenticationMethod(tokenEndpointAuthMethods);
            if (authentication) {
                return {
                    grantType: 'authorizationCode',
                    authentication,
                    usePkce: supportsPkce,
                };
            }
            if (supportsPkce) {
                return { grantType: 'pkce', usePkce: true };
            }
            if (tokenEndpointAuthMethods.length === 0) {
                return { grantType: 'authorizationCode', authentication: 'header', usePkce: false };
            }
        }
        if (grantTypes.includes('client_credentials')) {
            const authentication = this.selectClientSecretAuthenticationMethod(tokenEndpointAuthMethods);
            if (authentication) {
                return { grantType: 'clientCredentials', authentication, usePkce: false };
            }
            if (tokenEndpointAuthMethods.length === 0) {
                return { grantType: 'clientCredentials', authentication: 'header', usePkce: false };
            }
        }
        throw new errors_1.BadRequestError('No supported grant type and authentication method found');
    }
    selectClientSecretAuthenticationMethod(tokenEndpointAuthMethods) {
        for (const authMethod of tokenEndpointAuthMethods) {
            if (authMethod === 'client_secret_basic')
                return 'header';
            if (authMethod === 'client_secret_post')
                return 'body';
        }
        return undefined;
    }
    mapGrantTypeAndAuthenticationMethod(grantType, authentication) {
        if (grantType === 'pkce') {
            return {
                grant_types: ['authorization_code', 'refresh_token'],
                token_endpoint_auth_method: 'none',
            };
        }
        const tokenEndpointAuthMethod = authentication === 'header' ? 'client_secret_basic' : 'client_secret_post';
        if (grantType === 'authorizationCode') {
            return {
                grant_types: ['authorization_code', 'refresh_token'],
                token_endpoint_auth_method: tokenEndpointAuthMethod,
            };
        }
        return {
            grant_types: ['client_credentials'],
            token_endpoint_auth_method: tokenEndpointAuthMethod,
        };
    }
    async saveDynamicCredential(credential, oauthTokenData, authHeader, credentialResolverId, authMetadata = {}) {
        const credentials = new n8n_core_1.Credentials(credential, credential.type, credential.data);
        await credentials.updateData(oauthTokenData);
        const credentialStoreMetadata = {
            id: credential.id,
            name: credential.name,
            type: credential.type,
            isResolvable: credential.isResolvable,
            resolverId: credentialResolverId,
        };
        await this.dynamicCredentialsProxy.storeIfNeeded(credentialStoreMetadata, oauthTokenData, { version: 1, identity: authHeader, metadata: authMetadata }, await credentials.getData(), { credentialResolverId });
    }
};
exports.OauthService = OauthService;
exports.OauthService = OauthService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_common_1.LockService, credentials_helper_1.CredentialsHelper, db_1.CredentialsRepository, backend_services_1.CredentialsFinderService, backend_services_1.UrlService, config_1.GlobalConfig, external_hooks_1.ExternalHooks, n8n_core_1.Cipher, dynamic_credentials_proxy_1.DynamicCredentialsProxy, auth_service_1.AuthService, auth_1.OAuthJweServiceProxy, oauth_browser_binding_service_1.OAuthBrowserBindingService, backend_services_1.EventService, backend_services_1.CacheService, backend_network_1.OutboundHttp, backend_network_1.SsrfProtectionService, config_1.SsrfProtectionConfig])
], OauthService);
//# sourceMappingURL=oauth.service.js.map