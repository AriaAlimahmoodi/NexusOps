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
exports.SecurityPolicyPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const security_settings_service_1 = require("../../../services/security-settings.service");
const tags = ['SecurityPolicy'];
const toSecurityPolicyPublicDto = (settings) => ({
    personalSpacePublishing: settings.personalSpacePublishing,
    personalSpaceSharing: settings.personalSpaceSharing,
    publishedPersonalWorkflowsCount: settings.publishedPersonalWorkflowsCount,
    sharedPersonalWorkflowsCount: settings.sharedPersonalWorkflowsCount,
    sharedPersonalCredentialsCount: settings.sharedPersonalCredentialsCount,
    redactionEnforcement: { floor: settings.redactionEnforcement.floor },
});
let SecurityPolicyPublicController = class SecurityPolicyPublicController {
    constructor(securitySettingsService, instanceSettingsLoaderConfig) {
        this.securitySettingsService = securitySettingsService;
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
    }
    async getSecurityPolicy() {
        const settings = await this.securitySettingsService.getSecuritySettings();
        return toSecurityPolicyPublicDto(settings);
    }
    async updateSecurityPolicy(req, _res, body) {
        if (this.instanceSettingsLoaderConfig.securityPolicyManagedByEnv) {
            throw new errors_1.ConflictError('These settings are managed via environment variables and cannot be modified through the API');
        }
        const { personalSpacePublishing, personalSpaceSharing, redactionEnforcement } = body;
        await this.securitySettingsService.updateSecuritySettings({ personalSpacePublishing, personalSpaceSharing, redactionEnforcement }, req.user);
        const settings = await this.securitySettingsService.getSecuritySettings();
        return toSecurityPolicyPublicDto(settings);
    }
};
exports.SecurityPolicyPublicController = SecurityPolicyPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('securitySettings:manage'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.PERSONAL_SPACE_POLICY),
    (0, decorators_1.ApiSummary)('Retrieve the security policy'),
    (0, decorators_1.ApiDescription)('Retrieve the instance security policy: personal-space publishing and sharing, the execution-data redaction enforcement floor, and the read-only usage counts shown in the UI. Requires the `securitySettings:manage` scope and the Personal Space Policy feature to be licensed.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.SecurityPolicyPublicDto),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityPolicyPublicController.prototype, "getSecurityPolicy", null);
__decorate([
    (0, decorators_1.Put)('/'),
    (0, decorators_1.ApiKeyScope)('securitySettings:manage'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.PERSONAL_SPACE_POLICY),
    (0, decorators_1.ApiSummary)('Set the security policy'),
    (0, decorators_1.ApiDescription)('Replace the instance security policy with the provided full object. Every writable field must be sent. Read-only usage counts from GET are ignored if included, so a GET response can be sent back as a PUT body. The update takes effect exactly as it would from the UI, using the same validation. Requires the `securitySettings:manage` scope and the Personal Space Policy feature to be licensed. When the group is managed via environment variables, the write is rejected with 409 and no changes are made; a read still returns the current values.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.SecurityPolicyPublicDto),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateSecurityPolicyDto]),
    __metadata("design:returntype", Promise)
], SecurityPolicyPublicController.prototype, "updateSecurityPolicy", null);
exports.SecurityPolicyPublicController = SecurityPolicyPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/settings/security-policy'),
    __metadata("design:paramtypes", [security_settings_service_1.SecuritySettingsService, config_1.InstanceSettingsLoaderConfig])
], SecurityPolicyPublicController);
//# sourceMappingURL=security-policy.public.controller.js.map