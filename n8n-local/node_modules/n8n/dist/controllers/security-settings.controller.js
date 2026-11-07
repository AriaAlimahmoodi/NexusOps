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
exports.SecuritySettingsController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const security_settings_service_1 = require("../services/security-settings.service");
const workflow_review_policy_service_1 = require("../services/workflow-review-policy.service");
let SecuritySettingsController = class SecuritySettingsController {
    constructor(securitySettingsService, workflowReviewPolicyService, licenseState, instanceSettingsLoaderConfig) {
        this.securitySettingsService = securitySettingsService;
        this.workflowReviewPolicyService = workflowReviewPolicyService;
        this.licenseState = licenseState;
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
    }
    async getSecuritySettings(_req, _res) {
        const [settings, workflowReviews] = await Promise.all([
            this.securitySettingsService.getSecuritySettings(),
            this.getWorkflowReviewsIfAvailable(),
        ]);
        return {
            ...settings,
            managedByEnv: this.instanceSettingsLoaderConfig.securityPolicyManagedByEnv,
            ...(workflowReviews !== undefined ? { workflowReviews } : {}),
        };
    }
    async updateSecuritySettings(req, _res, dto) {
        if (this.instanceSettingsLoaderConfig.securityPolicyManagedByEnv) {
            throw new errors_1.ForbiddenError('Security settings are managed via environment variables and cannot be modified through the API');
        }
        if (dto.workflowReviews !== undefined) {
            this.assertWorkflowReviewsAvailable();
        }
        const updatedSettings = await this.securitySettingsService.updateSecuritySettings({
            personalSpacePublishing: dto.personalSpacePublishing,
            personalSpaceSharing: dto.personalSpaceSharing,
            redactionEnforcement: dto.redactionEnforcement,
        }, req.user);
        if (dto.workflowReviews?.enabled !== undefined) {
            const before = (await this.workflowReviewPolicyService.get()).enabled;
            const after = dto.workflowReviews.enabled;
            updatedSettings.workflowReviews = { enabled: after };
            if (before !== after) {
                const workflowReviews = await this.workflowReviewPolicyService.set(after);
                updatedSettings.workflowReviews = workflowReviews;
                this.securitySettingsService.emitInstancePolicyUpdated(req.user, {
                    settingName: 'workflow_reviews',
                    value: workflowReviews.enabled,
                });
            }
        }
        return updatedSettings;
    }
    isWorkflowReviewsAvailable() {
        return this.licenseState.isWorkflowReviewsLicensed();
    }
    async getWorkflowReviewsIfAvailable() {
        if (!this.isWorkflowReviewsAvailable())
            return undefined;
        return await this.workflowReviewPolicyService.get();
    }
    assertWorkflowReviewsAvailable() {
        if (!this.isWorkflowReviewsAvailable()) {
            throw new errors_1.ForbiddenError('Workflow reviews settings are not enabled in this instance');
        }
    }
};
exports.SecuritySettingsController = SecuritySettingsController;
__decorate([
    (0, decorators_1.Licensed)('feat:personalSpacePolicy'),
    (0, decorators_1.GlobalScope)('securitySettings:manage'),
    (0, decorators_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecuritySettingsController.prototype, "getSecuritySettings", null);
__decorate([
    (0, decorators_1.Licensed)('feat:personalSpacePolicy'),
    (0, decorators_1.GlobalScope)('securitySettings:manage'),
    (0, decorators_1.Post)('/'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateSecuritySettingsDto]),
    __metadata("design:returntype", Promise)
], SecuritySettingsController.prototype, "updateSecuritySettings", null);
exports.SecuritySettingsController = SecuritySettingsController = __decorate([
    (0, decorators_1.RestController)('/settings/security'),
    __metadata("design:paramtypes", [security_settings_service_1.SecuritySettingsService, workflow_review_policy_service_1.WorkflowReviewPolicyService, backend_common_1.LicenseState, config_1.InstanceSettingsLoaderConfig])
], SecuritySettingsController);
//# sourceMappingURL=security-settings.controller.js.map