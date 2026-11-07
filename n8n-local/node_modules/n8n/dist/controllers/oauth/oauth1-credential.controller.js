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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuth1CredentialController = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const decorators_1 = require("@n8n/decorators");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const credentials_overwrites_1 = require("../../credentials-overwrites");
const oauth_service_1 = require("../../oauth/oauth.service");
let OAuth1CredentialController = class OAuth1CredentialController {
    constructor(oauthService, logger, eventService, credentialsOverwrites) {
        this.oauthService = oauthService;
        this.logger = logger;
        this.eventService = eventService;
        this.credentialsOverwrites = credentialsOverwrites;
    }
    async getAuthUri(req, res) {
        const credential = await this.oauthService.getCredentialForAuthFlow(req);
        const csrfData = await this.oauthService.buildCsrfStateData(credential, req);
        const uri = await this.oauthService.generateAOauth1AuthUri(credential, csrfData, req, res);
        this.logger.debug('OAuth1 authorization successful for new credential', {
            userId: req.user.id,
            credentialId: credential.id,
        });
        return uri;
    }
    async handleCallback(req, res) {
        try {
            const { oauth_verifier, oauth_token, state: encodedState } = req.query;
            if (!oauth_verifier || !oauth_token || !encodedState) {
                return this.oauthService.renderCallbackError(res, 'Insufficient parameters for OAuth1 callback.', `Received following query parameters: ${JSON.stringify(req.query)}`);
            }
            const [credential, decryptedDataOriginal, oauthCredentials, state, flowState] = await this.oauthService.resolveCredential(req);
            const oauthTokenData = await this.oauthService.getOAuth1AccessToken(oauthCredentials, {
                oauthToken: oauth_token,
                oauthVerifier: oauth_verifier,
                oauthTokenSecret: flowState.oauthTokenSecret ?? '',
            });
            if (!state.origin || state.origin === 'static-credential') {
                await this.oauthService.encryptAndSaveData(credential, { oauthTokenData });
                this.logger.debug('OAuth1 callback successful for new credential', {
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
                await this.oauthService.saveDynamicCredential(credential, oauthTokenData, state.authorizationHeader.split('Bearer ')[1], state.credentialResolverId, state.authMetadata ?? {});
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
            this.logger.error('OAuth1 callback failed', { error, cause: error.cause });
            return this.oauthService.renderCallbackError(res, error.message, this.oauthService.extractCallbackErrorReason(error));
        }
    }
};
exports.OAuth1CredentialController = OAuth1CredentialController;
__decorate([
    (0, decorators_1.Get)('/auth'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OAuth1CredentialController.prototype, "getAuthUri", null);
__decorate([
    (0, decorators_1.Get)('/callback', { usesTemplates: true, allowUnauthenticated: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OAuth1CredentialController.prototype, "handleCallback", null);
exports.OAuth1CredentialController = OAuth1CredentialController = __decorate([
    (0, decorators_1.RestController)('/oauth1-credential'),
    __metadata("design:paramtypes", [oauth_service_1.OauthService, backend_common_1.Logger, backend_services_1.EventService, credentials_overwrites_1.CredentialsOverwrites])
], OAuth1CredentialController);
//# sourceMappingURL=oauth1-credential.controller.js.map