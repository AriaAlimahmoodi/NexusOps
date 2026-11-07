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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const auth_service_1 = require("../../auth/auth.service");
const constants_2 = require("../../constants");
const errors_1 = require("@n8n/errors");
const constants_3 = require("../../modules/provisioning.ee/constants");
const sso_access_denied_error_1 = require("../../modules/provisioning.ee/errors/sso-access-denied.error");
const sso_helpers_1 = require("../../sso.ee/sso-helpers");
const validate_redirect_url_1 = require("../../utils/validate-redirect-url");
const constants_4 = require("./constants");
const oidc_service_ee_1 = require("./oidc.service.ee");
const oidc_test_result_1 = require("./views/oidc-test-result");
let OidcController = class OidcController {
    constructor(oidcService, authService, eventService, urlService, globalConfig, logger, instanceSettingsLoaderConfig) {
        this.oidcService = oidcService;
        this.authService = authService;
        this.eventService = eventService;
        this.urlService = urlService;
        this.globalConfig = globalConfig;
        this.logger = logger;
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
    }
    async retrieveConfiguration(_req) {
        const config = await this.oidcService.loadConfig();
        if (config.clientSecret) {
            config.clientSecret = constants_4.OIDC_CLIENT_SECRET_REDACTED_VALUE;
        }
        return config;
    }
    async saveConfiguration(_req, _res, payload) {
        if (this.instanceSettingsLoaderConfig.ssoManagedByEnv) {
            throw new errors_1.ForbiddenError('OIDC configuration is managed via environment variables and cannot be modified through the API');
        }
        await this.oidcService.updateConfig(payload);
        const config = this.oidcService.getRedactedConfig();
        return config;
    }
    async testConnection(_req, res) {
        const authorization = await this.oidcService.generateTestLoginUrl();
        const { samesite, secure } = this.globalConfig.auth.cookie;
        res.cookie(constants_2.OIDC_STATE_COOKIE_NAME, authorization.state, {
            maxAge: 15 * constants_1.Time.minutes.toMilliseconds,
            httpOnly: true,
            sameSite: samesite,
            secure,
        });
        res.cookie(constants_2.OIDC_NONCE_COOKIE_NAME, authorization.nonce, {
            maxAge: 15 * constants_1.Time.minutes.toMilliseconds,
            httpOnly: true,
            sameSite: samesite,
            secure,
        });
        return { url: authorization.url.toString() };
    }
    async redirectToAuthProvider(req, res) {
        const redirectUrl = (0, validate_redirect_url_1.validateRedirectUrl)(req.query.redirect ?? '');
        const authorization = await this.oidcService.generateLoginUrl(redirectUrl);
        const { samesite, secure } = this.globalConfig.auth.cookie;
        res.cookie(constants_2.OIDC_STATE_COOKIE_NAME, authorization.state, {
            maxAge: 15 * constants_1.Time.minutes.toMilliseconds,
            httpOnly: true,
            sameSite: samesite,
            secure,
        });
        res.cookie(constants_2.OIDC_NONCE_COOKIE_NAME, authorization.nonce, {
            maxAge: 15 * constants_1.Time.minutes.toMilliseconds,
            httpOnly: true,
            sameSite: samesite,
            secure,
        });
        res.redirect(authorization.url.toString());
    }
    async callbackHandler(req, res) {
        const fullUrl = `${this.urlService.getInstanceBaseUrl()}${req.originalUrl}`;
        const callbackUrl = new URL(fullUrl);
        try {
            const state = req.cookies[constants_2.OIDC_STATE_COOKIE_NAME];
            if (typeof state !== 'string') {
                this.logger.error('State is missing');
                throw new errors_1.BadRequestError('Invalid state');
            }
            const nonce = req.cookies[constants_2.OIDC_NONCE_COOKIE_NAME];
            if (typeof nonce !== 'string') {
                this.logger.error('Nonce is missing');
                throw new errors_1.BadRequestError('Invalid nonce');
            }
            const stateInfo = this.oidcService.verifyState(state);
            res.clearCookie(constants_2.OIDC_STATE_COOKIE_NAME);
            res.clearCookie(constants_2.OIDC_NONCE_COOKIE_NAME);
            if (stateInfo.testMode) {
                try {
                    const result = await this.oidcService.processTestCallback(callbackUrl, state, nonce);
                    return res.send((0, oidc_test_result_1.renderOidcTestSuccess)(result, res.locals.cspNonce));
                }
                catch (error) {
                    return res.send((0, oidc_test_result_1.renderOidcTestFailure)(error, res.locals.cspNonce));
                }
            }
            const { user, idToken } = await this.oidcService.loginUser(callbackUrl, state, nonce);
            this.oidcService.assertOidcLoginEnabled();
            this.authService.issueCookie(res, user, true, req.browserId);
            if (idToken) {
                try {
                    const encryptedIdToken = await this.oidcService.encryptIdToken(idToken);
                    if (Buffer.byteLength(encryptedIdToken, 'utf8') <= constants_4.OIDC_ID_TOKEN_COOKIE_MAX_BYTES) {
                        const { samesite, secure } = this.globalConfig.auth.cookie;
                        res.cookie(constants_4.OIDC_ID_TOKEN_COOKIE_NAME, encryptedIdToken, {
                            maxAge: this.authService.jwtExpiration * constants_1.Time.seconds.toMilliseconds,
                            httpOnly: true,
                            sameSite: samesite,
                            secure,
                        });
                    }
                    else {
                        this.logger.warn('The OIDC ID token is too large to be stored in a cookie. Signing out will terminate the n8n session but not the OIDC provider session. Consider reducing the claims included in the ID token.');
                    }
                }
                catch (error) {
                    this.logger.warn('Failed to store the OIDC ID token; sign-out will be local only', {
                        error,
                    });
                }
            }
            this.eventService.emit('user-logged-in', {
                user,
                authenticationMethod: 'oidc',
            });
            return res.redirect((0, validate_redirect_url_1.validateRedirectUrl)(stateInfo.redirectUrl ?? ''));
        }
        catch (error) {
            if (error instanceof sso_access_denied_error_1.SsoAccessDeniedError) {
                this.eventService.emit('user-login-failed', {
                    userEmail: 'unknown',
                    authenticationMethod: 'oidc',
                });
                return res.redirect(this.urlService.getInstanceBaseUrl() + constants_3.SSO_ACCESS_DENIED_REDIRECT_PATH);
            }
            this.logger.error('OIDC callback failed', { error });
            this.eventService.emit('user-login-failed', {
                userEmail: 'unknown',
                authenticationMethod: 'oidc',
                reason: callbackUrl.searchParams.get('error')?.slice(0, 100) ?? 'oidc_callback_failed',
            });
            return res.redirect(this.urlService.getInstanceBaseUrl() + constants_3.SSO_LOGIN_FAILED_REDIRECT_PATH);
        }
    }
    async logout(req, res) {
        await this.authService.invalidateToken(req);
        this.authService.clearCookie(res);
        const encryptedIdToken = req.cookies[constants_4.OIDC_ID_TOKEN_COOKIE_NAME];
        res.clearCookie(constants_4.OIDC_ID_TOKEN_COOKIE_NAME);
        if (typeof encryptedIdToken !== 'string' ||
            encryptedIdToken === '' ||
            !(0, sso_helpers_1.isOidcCurrentAuthenticationMethod)()) {
            return { redirectUrl: null };
        }
        const idToken = await this.oidcService.decryptIdToken(encryptedIdToken);
        if (!idToken) {
            return { redirectUrl: null };
        }
        try {
            const endSessionUrl = await this.oidcService.generateEndSessionUrl(idToken);
            return { redirectUrl: endSessionUrl?.toString() ?? null };
        }
        catch (error) {
            this.logger.warn('Failed to build the OIDC RP-initiated logout URL', { error });
            return { redirectUrl: null };
        }
    }
};
exports.OidcController = OidcController;
__decorate([
    (0, decorators_1.Get)('/config'),
    (0, decorators_1.Licensed)('feat:oidc'),
    (0, decorators_1.GlobalScope)('oidc:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "retrieveConfiguration", null);
__decorate([
    (0, decorators_1.Post)('/config'),
    (0, decorators_1.Licensed)('feat:oidc'),
    (0, decorators_1.GlobalScope)('oidc:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.OidcConfigDto]),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "saveConfiguration", null);
__decorate([
    (0, decorators_1.Post)('/config/test'),
    (0, decorators_1.Licensed)('feat:oidc'),
    (0, decorators_1.GlobalScope)('oidc:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "testConnection", null);
__decorate([
    (0, decorators_1.Get)('/login', { skipAuth: true }),
    (0, decorators_1.Licensed)('feat:oidc'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "redirectToAuthProvider", null);
__decorate([
    (0, decorators_1.Get)('/callback', { skipAuth: true, usesTemplates: true }),
    (0, decorators_1.Licensed)('feat:oidc'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "callbackHandler", null);
__decorate([
    (0, decorators_1.Post)('/logout'),
    (0, decorators_1.Licensed)('feat:oidc'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OidcController.prototype, "logout", null);
exports.OidcController = OidcController = __decorate([
    (0, decorators_1.RestController)('/sso/oidc'),
    __metadata("design:paramtypes", [oidc_service_ee_1.OidcService, auth_service_1.AuthService, backend_services_1.EventService, backend_services_1.UrlService, config_1.GlobalConfig, backend_common_1.Logger, config_1.InstanceSettingsLoaderConfig])
], OidcController);
//# sourceMappingURL=oidc.controller.ee.js.map