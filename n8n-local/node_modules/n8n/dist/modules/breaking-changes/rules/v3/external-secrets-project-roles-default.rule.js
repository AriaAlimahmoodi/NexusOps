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
exports.ExternalSecretsProjectRolesDefaultRule = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const permissions_1 = require("@n8n/permissions");
const detection_report_1 = require("../../detection-report");
let ExternalSecretsProjectRolesDefaultRule = class ExternalSecretsProjectRolesDefaultRule {
    constructor(licenseState, settingsRepository) {
        this.licenseState = licenseState;
        this.settingsRepository = settingsRepository;
        this.id = 'external-secrets-project-roles-default-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'External secrets access for project roles is on by default',
            description: 'In v3, project editors and admins get external-secrets scopes in their projects by default, and the Settings → External Secrets toggle is removed. Instances that keep this toggle off today widen these role permissions after the update.',
            category: "environment",
            impact: 'behaviorChanges',
            documentationUrl: 'https://docs.n8n.io/external-secrets/#access-for-project-roles',
        };
    }
    async detect() {
        if (!this.licenseState.isExternalSecretsLicensed()) {
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        }
        if (await this.isSystemRolesEnabled()) {
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        }
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Project editors and admins gain external-secrets access',
                    description: 'The external secrets feature is licensed and the Settings → External Secrets toggle is off. After the update, project editors and admins get external-secrets scopes in their projects by default, and the toggle is removed. These roles can read and use external secrets that they cannot access today.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Review project editors and admins who gain access',
                    description: 'Check which project editors and admins get external-secrets access under the new default. No action is needed to keep the new default. To limit access, review project memberships before the update.',
                },
            ],
        };
    }
    async isSystemRolesEnabled() {
        const rows = await this.settingsRepository.findByKeys([
            permissions_1.EXTERNAL_SECRETS_SYSTEM_ROLES_ENABLED_SETTING.key,
        ]);
        const value = rows.find((r) => r.key === permissions_1.EXTERNAL_SECRETS_SYSTEM_ROLES_ENABLED_SETTING.key)?.value;
        return value === 'true';
    }
};
exports.ExternalSecretsProjectRolesDefaultRule = ExternalSecretsProjectRolesDefaultRule;
exports.ExternalSecretsProjectRolesDefaultRule = ExternalSecretsProjectRolesDefaultRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' }),
    __metadata("design:paramtypes", [backend_common_1.LicenseState, db_1.SettingsRepository])
], ExternalSecretsProjectRolesDefaultRule);
//# sourceMappingURL=external-secrets-project-roles-default.rule.js.map