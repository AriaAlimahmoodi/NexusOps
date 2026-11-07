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
exports.SamlSsoPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const saml_service_ee_1 = require("../../../modules/sso-saml/saml.service.ee");
const sso_saml_mapper_1 = require("./sso-saml.mapper");
const tags = ['SettingsSsoSaml'];
let SamlSsoPublicController = class SamlSsoPublicController {
    constructor(samlService, instanceSettingsLoaderConfig) {
        this.samlService = samlService;
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
    }
    getSamlConfiguration() {
        return (0, sso_saml_mapper_1.toSamlConfigurationResponse)(this.samlService.samlPreferences);
    }
    async updateSamlConfiguration(_req, _res, body) {
        if (this.instanceSettingsLoaderConfig.ssoManagedByEnv) {
            throw new errors_1.ConflictError('SSO configuration is managed declaratively and cannot be modified through the API');
        }
        await this.samlService.setSamlPreferences((0, sso_saml_mapper_1.toSamlPreferencesUpdate)(body));
        return (0, sso_saml_mapper_1.toSamlConfigurationResponse)(this.samlService.samlPreferences);
    }
};
exports.SamlSsoPublicController = SamlSsoPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('saml:manage'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.SAML),
    (0, decorators_1.ApiSummary)('Retrieve the SAML SSO configuration'),
    (0, decorators_1.ApiDescription)('Retrieve the current SAML SSO configuration, including every field exposed in the UI plus the service provider entity ID and ACS return URL. Signing private keys, signing certificates, and identity provider metadata are redacted on read. Requires the `saml:manage` scope and the SAML feature to be licensed.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.SamlConfigurationPublicDto),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", api_types_1.SamlConfigurationPublicDto)
], SamlSsoPublicController.prototype, "getSamlConfiguration", null);
__decorate([
    (0, decorators_1.Put)('/'),
    (0, decorators_1.ApiKeyScope)('saml:manage'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.SAML),
    (0, decorators_1.ApiSummary)('Set the SAML SSO configuration'),
    (0, decorators_1.ApiDescription)('Replace the SAML SSO configuration with the provided full object. Every writable field must be sent; use empty strings or empty arrays when a value is unset. Read-only `entityID` / `returnUrl` from GET are ignored if included, so a GET response can be sent back as a PUT body. Redacted secret placeholders keep the stored values unchanged. The update takes effect exactly as it would from the UI, using the same validation. Requires the `saml:manage` scope and the SAML feature to be licensed. When the configuration is managed via environment variables, the write is rejected with 409 and no changes are made.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.SamlConfigurationPublicDto),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateSamlConfigurationPublicDto]),
    __metadata("design:returntype", Promise)
], SamlSsoPublicController.prototype, "updateSamlConfiguration", null);
exports.SamlSsoPublicController = SamlSsoPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/settings/sso/saml'),
    __metadata("design:paramtypes", [saml_service_ee_1.SamlService, config_1.InstanceSettingsLoaderConfig])
], SamlSsoPublicController);
//# sourceMappingURL=sso-saml.public.controller.js.map