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
exports.SsoOidcPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const constants_2 = require("../../../modules/sso-oidc/constants");
const oidc_service_ee_1 = require("../../../modules/sso-oidc/oidc.service.ee");
const tags = ['SettingsSsoOidc'];
const toOidcConfigurationPublicDto = (config) => ({
    clientId: config.clientId,
    clientSecret: config.clientSecret ? constants_2.OIDC_CLIENT_SECRET_REDACTED_VALUE : config.clientSecret,
    discoveryEndpoint: config.discoveryEndpoint.toString(),
    loginEnabled: config.loginEnabled,
    prompt: config.prompt,
    authenticationContextClassReference: config.authenticationContextClassReference,
    additionalScopes: config.additionalScopes,
    emailVerifiedRequired: config.emailVerifiedRequired ?? false,
    rpInitiatedLogoutEnabled: config.rpInitiatedLogoutEnabled,
});
let SsoOidcPublicController = class SsoOidcPublicController {
    constructor(oidcService, instanceSettingsLoaderConfig) {
        this.oidcService = oidcService;
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
    }
    async getOidcConfiguration() {
        const config = await this.oidcService.loadConfig();
        return toOidcConfigurationPublicDto(config);
    }
    async setOidcConfiguration(_req, _res, body) {
        if (this.instanceSettingsLoaderConfig.ssoManagedByEnv) {
            throw new errors_1.ConflictError('SSO configuration is managed declaratively and cannot be modified through the API');
        }
        await this.oidcService.updateConfig(body);
        const config = await this.oidcService.loadConfig();
        return toOidcConfigurationPublicDto(config);
    }
};
exports.SsoOidcPublicController = SsoOidcPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('oidc:manage'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.OIDC),
    (0, decorators_1.ApiSummary)('Retrieve the OIDC SSO configuration'),
    (0, decorators_1.ApiDescription)('Retrieve the current OIDC SSO configuration, including every field exposed in the UI. The client secret is redacted on read and is never echoed back in plaintext. Requires the `oidc:manage` scope and the OIDC feature to be licensed.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.OidcConfigurationPublicDto),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SsoOidcPublicController.prototype, "getOidcConfiguration", null);
__decorate([
    (0, decorators_1.Put)('/'),
    (0, decorators_1.ApiKeyScope)('oidc:manage'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.OIDC),
    (0, decorators_1.ApiSummary)('Set the OIDC SSO configuration'),
    (0, decorators_1.ApiDescription)('Set the OIDC SSO configuration. The update takes effect exactly as it would from the UI, using the same validation. `clientId`, `clientSecret` and `discoveryEndpoint` are required; submit the redacted client secret sentinel to keep the stored secret unchanged. Requires the `oidc:manage` scope and the OIDC feature to be licensed. The client secret is redacted in the response. When the configuration is managed declaratively (via environment variables), the write is rejected with 409 and no changes are made.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.OidcConfigurationPublicDto),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateOidcConfigurationPublicDto]),
    __metadata("design:returntype", Promise)
], SsoOidcPublicController.prototype, "setOidcConfiguration", null);
exports.SsoOidcPublicController = SsoOidcPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/settings/sso/oidc'),
    __metadata("design:paramtypes", [oidc_service_ee_1.OidcService, config_1.InstanceSettingsLoaderConfig])
], SsoOidcPublicController);
//# sourceMappingURL=sso-oidc.public.controller.js.map