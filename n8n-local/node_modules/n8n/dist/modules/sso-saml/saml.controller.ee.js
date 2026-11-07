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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamlController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const n8n_workflow_1 = require("n8n-workflow");
const querystring_1 = __importDefault(require("querystring"));
const url_1 = __importDefault(require("url"));
const auth_service_1 = require("../../auth/auth.service");
const errors_1 = require("@n8n/errors");
const constants_1 = require("../../modules/provisioning.ee/constants");
const sso_access_denied_error_1 = require("../../modules/provisioning.ee/errors/sso-access-denied.error");
const response_helper_1 = require("../../response-helper");
const sso_helpers_1 = require("../../sso.ee/sso-helpers");
const validate_redirect_url_1 = require("../../utils/validate-redirect-url");
const saml_email_not_verified_error_1 = require("./errors/saml-email-not-verified.error");
const saml_enabled_middleware_1 = require("./middleware/saml-enabled-middleware");
const saml_helpers_1 = require("./saml-helpers");
const saml_service_ee_1 = require("./saml.service.ee");
const service_provider_ee_1 = require("./service-provider.ee");
const init_sso_post_1 = require("./views/init-sso-post");
let SamlController = class SamlController {
    constructor(authService, samlService, urlService, eventService, instanceSettingsLoaderConfig) {
        this.authService = authService;
        this.samlService = samlService;
        this.urlService = urlService;
        this.eventService = eventService;
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
    }
    async getServiceProviderMetadata(_, res) {
        return res
            .header('Content-Type', 'text/xml')
            .send(this.samlService.getServiceProviderInstance().getMetadata());
    }
    async configGet() {
        const prefs = this.samlService.samlPreferences;
        return {
            ...prefs,
            signingPrivateKey: prefs.signingPrivateKey ? n8n_workflow_1.CREDENTIAL_BLANKING_VALUE : undefined,
            entityID: (0, service_provider_ee_1.getServiceProviderEntityId)(),
            returnUrl: (0, service_provider_ee_1.getServiceProviderReturnUrl)(),
        };
    }
    async configPost(_req, _res, payload) {
        if (this.instanceSettingsLoaderConfig.ssoManagedByEnv) {
            throw new errors_1.ForbiddenError('SSO configuration is managed via environment variables and cannot be modified through the API');
        }
        const result = await this.samlService.setSamlPreferences(payload);
        if (!result)
            return;
        return {
            ...result,
            signingPrivateKey: result.signingPrivateKey ? n8n_workflow_1.CREDENTIAL_BLANKING_VALUE : undefined,
        };
    }
    async toggleEnabledPost(_req, res, { loginEnabled }) {
        if (this.instanceSettingsLoaderConfig.ssoManagedByEnv) {
            throw new errors_1.ForbiddenError('SSO configuration is managed via environment variables and cannot be modified through the API');
        }
        await this.samlService.setSamlPreferences({ loginEnabled });
        return res.sendStatus(200);
    }
    async acsGet(req, res) {
        return await this.acsHandler(req, res, 'redirect');
    }
    async acsPost(req, res, payload) {
        return await this.acsHandler(req, res, 'post', payload);
    }
    async acsHandler(req, res, binding, payload = {}) {
        try {
            let metadataOverride;
            if ((0, saml_helpers_1.isConnectionTestRequest)(payload)) {
                const testId = (0, saml_helpers_1.extractTestIdFromRelayState)(payload.RelayState);
                if (testId) {
                    metadataOverride = await this.samlService.consumePendingTestConfig(testId);
                }
            }
            const loginResult = await this.samlService.handleSamlLogin(req, binding, metadataOverride);
            if ((0, saml_helpers_1.isConnectionTestRequest)(payload)) {
                const rawAttributesJson = JSON.stringify(loginResult.rawAttributes ?? {}, null, 2);
                if (loginResult.authenticatedUser) {
                    return res.render('saml-connection-test-success', {
                        ...loginResult.attributes,
                        rawAttributesJson,
                    });
                }
                else {
                    return res.render('saml-connection-test-failed', {
                        message: '',
                        attributes: loginResult.attributes,
                        rawAttributesJson,
                    });
                }
            }
            if (loginResult.authenticatedUser) {
                this.eventService.emit('user-logged-in', {
                    user: loginResult.authenticatedUser,
                    authenticationMethod: 'saml',
                });
                if ((0, sso_helpers_1.isSamlLicensedAndEnabled)()) {
                    this.authService.issueCookie(res, loginResult.authenticatedUser, true, req.browserId);
                    if (loginResult.onboardingRequired) {
                        return res.redirect(this.urlService.getInstanceBaseUrl() + '/saml/onboarding');
                    }
                    else {
                        const safeRedirectUrl = payload.RelayState
                            ? (0, validate_redirect_url_1.validateRedirectUrl)(payload.RelayState)
                            : '/';
                        return res.redirect(this.urlService.getInstanceBaseUrl() + safeRedirectUrl);
                    }
                }
                else {
                    return res.status(202).send(loginResult.attributes);
                }
            }
            this.eventService.emit('user-login-failed', {
                userEmail: loginResult.attributes.email ?? 'unknown',
                authenticationMethod: 'saml',
            });
            return (0, response_helper_1.sendErrorResponse)(res, new errors_1.AuthError('SAML Authentication failed'));
        }
        catch (error) {
            if ((0, saml_helpers_1.isConnectionTestRequest)(payload)) {
                return res.render('saml-connection-test-failed', { message: error.message });
            }
            this.eventService.emit('user-login-failed', {
                userEmail: error instanceof saml_email_not_verified_error_1.SamlEmailNotVerifiedError ? error.email : 'unknown',
                authenticationMethod: 'saml',
                reason: error.message,
            });
            if (error instanceof sso_access_denied_error_1.SsoAccessDeniedError) {
                return res.redirect(this.urlService.getInstanceBaseUrl() + constants_1.SSO_ACCESS_DENIED_REDIRECT_PATH);
            }
            return (0, response_helper_1.sendErrorResponse)(res, new errors_1.AuthError('SAML Authentication failed: ' + error.message));
        }
    }
    async initSsoGet(req, res) {
        let redirectUrl = req.query.redirect ?? '';
        try {
            const refererUrl = req.headers.referer;
            if (refererUrl) {
                const parsedUrl = url_1.default.parse(refererUrl);
                if (parsedUrl?.query) {
                    const parsedQueryParams = querystring_1.default.parse(parsedUrl.query);
                    if (parsedQueryParams.redirect && typeof parsedQueryParams.redirect === 'string') {
                        redirectUrl = querystring_1.default.unescape(parsedQueryParams.redirect);
                    }
                }
            }
        }
        catch {
        }
        return await this.handleInitSSO(res, (0, validate_redirect_url_1.validateRedirectUrl)(redirectUrl));
    }
    async configTestPost(_req, res, payload) {
        let metadata = payload.metadata;
        if (!metadata && payload.metadataUrl) {
            metadata =
                (await this.samlService.fetchMetadataFromUrl(payload.metadataUrl, payload.ignoreSSL)) ??
                    undefined;
        }
        let relayState = (0, service_provider_ee_1.getServiceProviderConfigTestReturnUrl)();
        if (metadata) {
            const testId = await this.samlService.storePendingTestConfig(metadata);
            const relayStateUrl = new URL(relayState);
            relayStateUrl.searchParams.set('t', testId);
            relayState = relayStateUrl.toString();
        }
        const result = await this.samlService.getLoginRequestUrl(relayState, payload.loginBinding, metadata);
        if (result?.binding === 'redirect') {
            return result.context.context;
        }
        else if (result?.binding === 'post') {
            return res.send((0, init_sso_post_1.getInitSSOFormView)(result.context, res.locals.cspNonce));
        }
        else {
            throw new errors_1.AuthError('SAML redirect failed, please check your SAML configuration.');
        }
    }
    async handleInitSSO(res, relayState) {
        const result = await this.samlService.getLoginRequestUrl(relayState);
        if (result?.binding === 'redirect') {
            return result.context.context;
        }
        else if (result?.binding === 'post') {
            return res.send((0, init_sso_post_1.getInitSSOFormView)(result.context, res.locals.cspNonce));
        }
        else {
            throw new errors_1.AuthError('SAML redirect failed, please check your SAML configuration.');
        }
    }
};
exports.SamlController = SamlController;
__decorate([
    (0, decorators_1.Get)('/metadata', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "getServiceProviderMetadata", null);
__decorate([
    (0, decorators_1.Get)('/config', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware] }),
    (0, decorators_1.GlobalScope)('saml:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "configGet", null);
__decorate([
    (0, decorators_1.Post)('/config', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware] }),
    (0, decorators_1.GlobalScope)('saml:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.SamlPreferences]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "configPost", null);
__decorate([
    (0, decorators_1.Post)('/config/toggle', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware] }),
    (0, decorators_1.GlobalScope)('saml:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.SamlToggleDto]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "toggleEnabledPost", null);
__decorate([
    (0, decorators_1.Get)('/acs', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware], skipAuth: true, usesTemplates: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "acsGet", null);
__decorate([
    (0, decorators_1.Post)('/acs', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware], skipAuth: true, usesTemplates: true }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.SamlAcsDto]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "acsPost", null);
__decorate([
    (0, decorators_1.Get)('/initsso', { middlewares: [saml_enabled_middleware_1.samlLicensedAndEnabledMiddleware], skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "initSsoGet", null);
__decorate([
    (0, decorators_1.Post)('/config/test', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware] }),
    (0, decorators_1.GlobalScope)('saml:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.SamlPreferences]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "configTestPost", null);
exports.SamlController = SamlController = __decorate([
    (0, decorators_1.RestController)('/sso/saml'),
    __metadata("design:paramtypes", [auth_service_1.AuthService, saml_service_ee_1.SamlService, backend_services_1.UrlService, backend_services_1.EventService, config_1.InstanceSettingsLoaderConfig])
], SamlController);
//# sourceMappingURL=saml.controller.ee.js.map