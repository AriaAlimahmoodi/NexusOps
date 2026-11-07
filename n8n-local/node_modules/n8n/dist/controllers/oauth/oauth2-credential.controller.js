"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuth2CredentialController = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const client_oauth2_1 = require("@n8n/client-oauth2");
const decorators_1 = require("@n8n/decorators");
const omit_1 = __importDefault(require("lodash/omit"));
const set_1 = __importDefault(require("lodash/set"));
const split_1 = __importDefault(require("lodash/split"));
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_overwrites_1 = require("../../credentials-overwrites");
const external_hooks_1 = require("../../external-hooks");
const oauth_service_1 = require("../../oauth/oauth.service");
let OAuth2CredentialController = class OAuth2CredentialController {
    constructor(oauthService, logger, externalHooks, oauthJweServiceProxy, eventService, credentialsOverwrites) {
        this.oauthService = oauthService;
        this.logger = logger;
        this.externalHooks = externalHooks;
        this.oauthJweServiceProxy = oauthJweServiceProxy;
        this.eventService = eventService;
        this.credentialsOverwrites = credentialsOverwrites;
    }
    async getAuthUri(req, res) {
        const credential = await this.oauthService.getCredentialForAuthFlow(req);
        const csrfData = await this.oauthService.buildCsrfStateData(credential, req);
        return await this.oauthService.generateAOauth2AuthUri(credential, csrfData, req, res);
    }
    async handleCallback(req, res) {
        let credentialType;
        try {
            const { code, state: encodedState } = req.query;
            if (!code || !encodedState) {
                if (req.query.admin_consent) {
                    if (req.query.admin_consent === 'False' || req.query.error) {
                        this.logger.error('Administrator consent was refused', {
                            error: req.query.error,
                            errorDescription: req.query.error_description,
                        });
                        return this.oauthService.renderCallbackError(res, 'The administrator did not approve the requested permissions.');
                    }
                    return res.render('admin-consent-callback');
                }
                return this.oauthService.renderCallbackError(res, 'Insufficient parameters for OAuth2 callback.', `Received following query parameters: ${JSON.stringify(req.query)}`);
            }
            const [credential, decryptedDataOriginal, oauthCredentials, state, flowState] = await this.oauthService.resolveCredential(req);
            credentialType = credential.type;
            if (typeof state.resource === 'string') {
                oauthCredentials.resource = state.resource;
            }
            const oAuthOptions = this.convertCredentialToOptions(oauthCredentials);
            const isPkce = oauthCredentials.grantType === 'pkce' || oauthCredentials.usePkce === true;
            const isBodyAuth = oauthCredentials.authentication === 'body';
            const body = { ...(oAuthOptions.body ?? {}) };
            if (isPkce) {
                body.code_verifier = flowState.codeVerifier;
            }
            if (isBodyAuth) {
                body.client_id = oAuthOptions.clientId;
                if (oAuthOptions.clientSecret) {
                    body.client_secret = oAuthOptions.clientSecret;
                }
                delete oAuthOptions.clientSecret;
            }
            let options = {};
            if (isPkce || isBodyAuth) {
                options = { body };
            }
            await this.externalHooks.run('oauth2.callback', [oAuthOptions]);
            const oAuthObj = new client_oauth2_1.ClientOAuth2({
                ...oAuthOptions,
                ssrfBridge: this.oauthService.getSsrfBridge(),
            });
            const queryParameters = req.originalUrl.split('?').splice(1, 1).join('');
            const oauthToken = await oAuthObj.code.getToken(`${oAuthOptions.redirectUri}?${queryParameters}`, options);
            if (Object.keys(req.query).length > 2) {
                (0, set_1.default)(oauthToken.data, 'callbackQueryString', (0, omit_1.default)(req.query, 'state', 'code'));
            }
            const rawTokenResponse = oauthToken.data;
            const tokenResponse = oauthCredentials.jweEnabled === true
                ? await this.oauthJweServiceProxy.decryptOAuth2TokenData(rawTokenResponse)
                : rawTokenResponse;
            const { oauthTokenData: tokenData } = decryptedDataOriginal;
            const oauthTokenData = {
                ...(typeof tokenData === 'object' ? tokenData : {}),
                ...tokenResponse,
            };
            const expiresInSeconds = Number(tokenResponse.expires_in);
            if (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
                oauthTokenData.n8n_expires_at = String(Date.now() + expiresInSeconds * 1000);
            }
            if (typeof state.resource === 'string') {
                oauthTokenData.resource = state.resource;
            }
            if (!state.origin || state.origin === 'static-credential') {
                await this.oauthService.encryptAndSaveData(credential, { oauthTokenData });
                this.logger.debug('OAuth2 callback successful for credential', {
                    credentialId: credential.id,
                });
                return res.render('oauth-callback');
            }
            if (state.origin === 'dynamic-credential') {
                if (!state.credentialResolverId || typeof state.credentialResolverId !== 'string') {
                    return this.oauthService.renderCallbackError(res, 'Credential resolver ID is required');
                }
                if (!state.authorizationHeader ||
                    typeof state.authorizationHeader !== 'string' ||
                    !state.authorizationHeader.startsWith('Bearer ')) {
                    return this.oauthService.renderCallbackError(res, 'Authorization header is required');
                }
                await this.oauthService.saveDynamicCredential(credential, { oauthTokenData }, state.authorizationHeader.split('Bearer ')[1], state.credentialResolverId, state.authMetadata ?? {});
                if (typeof state.userId === 'string') {
                    this.eventService.emit('private-credential-user-connected', {
                        user: { id: state.userId },
                        credentialType: credential.type,
                        credentialId: credential.id,
                        supportsManagedAuth: this.credentialsOverwrites.supportsManagedAuth(credential.type),
                        usesManagedAuth: this.credentialsOverwrites.usesManagedAuth(credential.type, decryptedDataOriginal),
                    });
                }
                return res.render('oauth-callback');
            }
        }
        catch (e) {
            const error = (0, ensure_error_1.ensureError)(e);
            this.logger.error('OAuth2 callback failed', { error, cause: error.cause });
            return this.oauthService.renderCallbackError(res, this.oauthService.extractCallbackErrorMessage(error, credentialType), this.oauthService.extractCallbackErrorReason(error));
        }
    }
    convertCredentialToOptions(credential) {
        const options = {
            clientId: credential.clientId,
            ...(0, client_oauth2_1.resolveClientAuthOptions)(credential),
            accessTokenUri: credential.accessTokenUrl ?? '',
            authorizationUri: credential.authUrl ?? '',
            authentication: credential.authentication ?? 'header',
            redirectUri: `${this.oauthService.getBaseUrl(2)}/callback`,
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
};
exports.OAuth2CredentialController = OAuth2CredentialController;
__decorate([
    (0, decorators_1.Get)('/auth'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OAuth2CredentialController.prototype, "getAuthUri", null);
__decorate([
    (0, decorators_1.Get)('/callback', { usesTemplates: true, allowUnauthenticated: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OAuth2CredentialController.prototype, "handleCallback", null);
exports.OAuth2CredentialController = OAuth2CredentialController = __decorate([
    (0, decorators_1.RestController)('/oauth2-credential'),
    __metadata("design:paramtypes", [oauth_service_1.OauthService, backend_common_1.Logger, external_hooks_1.ExternalHooks, auth_1.OAuthJweServiceProxy, backend_services_1.EventService, credentials_overwrites_1.CredentialsOverwrites])
], OAuth2CredentialController);
//# sourceMappingURL=oauth2-credential.controller.js.map