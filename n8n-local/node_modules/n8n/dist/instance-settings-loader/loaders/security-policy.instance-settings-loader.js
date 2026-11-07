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
exports.SecurityPolicyInstanceSettingsLoader = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const mfa_service_1 = require("../../mfa/mfa.service");
const security_settings_service_1 = require("../../services/security-settings.service");
let SecurityPolicyInstanceSettingsLoader = class SecurityPolicyInstanceSettingsLoader {
    constructor(instanceSettingsLoaderConfig, securitySettingsService, mfaService, logger) {
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
        this.securitySettingsService = securitySettingsService;
        this.mfaService = mfaService;
        this.logger = logger;
        this.logger = this.logger.scoped('instance-settings-loader');
    }
    async run() {
        const { securityPolicyManagedByEnv, mfaEnforcedEnabled, personalSpacePublishingEnabled, personalSpaceSharingEnabled, } = this.instanceSettingsLoaderConfig;
        if (!securityPolicyManagedByEnv) {
            this.logger.debug('Security policy is not managed by environment variables, skipping');
            return 'skipped';
        }
        this.logger.info('N8N_SECURITY_POLICY_MANAGED_BY_ENV is enabled — applying security policy env vars');
        await this.mfaService.enforceMFA(mfaEnforcedEnabled);
        await this.securitySettingsService.setPersonalSpaceSetting(permissions_1.PERSONAL_SPACE_PUBLISHING_SETTING, personalSpacePublishingEnabled);
        await this.securitySettingsService.setPersonalSpaceSetting(permissions_1.PERSONAL_SPACE_SHARING_SETTING, personalSpaceSharingEnabled);
        return 'created';
    }
};
exports.SecurityPolicyInstanceSettingsLoader = SecurityPolicyInstanceSettingsLoader;
exports.SecurityPolicyInstanceSettingsLoader = SecurityPolicyInstanceSettingsLoader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.InstanceSettingsLoaderConfig, security_settings_service_1.SecuritySettingsService, mfa_service_1.MfaService, backend_common_1.Logger])
], SecurityPolicyInstanceSettingsLoader);
//# sourceMappingURL=security-policy.instance-settings-loader.js.map