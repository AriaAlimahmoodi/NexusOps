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
exports.ProvisioningInstanceSettingsLoader = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const zod_1 = require("zod");
const constants_1 = require("../../../modules/provisioning.ee/constants");
const instance_bootstrapping_error_1 = require("../../instance-bootstrapping.error");
const ENV_PROVISIONING_MODES = [
    'disabled',
    'instance_role',
    'instance_and_project_roles',
];
function resolveModeFlags(mode, useExpressionMapping) {
    if (mode === 'disabled') {
        return {
            scopesProvisionInstanceRole: false,
            scopesProvisionProjectRoles: false,
            scopesUseExpressionMapping: false,
        };
    }
    if (useExpressionMapping) {
        return {
            scopesProvisionInstanceRole: false,
            scopesProvisionProjectRoles: false,
            scopesUseExpressionMapping: true,
        };
    }
    return {
        scopesProvisionInstanceRole: true,
        scopesProvisionProjectRoles: mode === 'instance_and_project_roles',
        scopesUseExpressionMapping: false,
    };
}
const modeSchema = zod_1.z.object({
    ssoUserRoleProvisioning: zod_1.z.enum(ENV_PROVISIONING_MODES, {
        errorMap: () => ({
            message: `N8N_SSO_USER_ROLE_PROVISIONING must be one of: ${ENV_PROVISIONING_MODES.join(', ')}`,
        }),
    }),
});
let ProvisioningInstanceSettingsLoader = class ProvisioningInstanceSettingsLoader {
    constructor(config, globalConfig, settingsRepository, logger) {
        this.config = config;
        this.globalConfig = globalConfig;
        this.settingsRepository = settingsRepository;
        this.logger = logger;
        this.logger = this.logger.scoped('instance-settings-loader');
    }
    async apply() {
        const parsed = modeSchema.safeParse(this.config);
        if (!parsed.success) {
            throw new instance_bootstrapping_error_1.InstanceBootstrappingError(parsed.error.issues[0].message);
        }
        const mode = parsed.data.ssoUserRoleProvisioning;
        const { provisioning } = this.globalConfig.sso;
        if (provisioning.scopesUseExpressionMapping && mode === 'disabled') {
            this.logger.warn('N8N_SSO_SCOPES_USE_EXPRESSION_MAPPING=true has no effect while N8N_SSO_USER_ROLE_PROVISIONING is "disabled", which assigns roles manually. Set it to instance_role or instance_and_project_roles to map roles with rules.');
        }
        const value = {
            ...resolveModeFlags(mode, provisioning.scopesUseExpressionMapping),
            scopesName: provisioning.scopesName,
            scopesInstanceRoleClaimName: provisioning.scopesInstanceRoleClaimName,
            scopesProjectsRolesClaimName: provisioning.scopesProjectsRolesClaimName,
        };
        await this.settingsRepository.upsert({
            key: constants_1.PROVISIONING_PREFERENCES_DB_KEY,
            value: JSON.stringify(value),
            loadOnStartup: true,
        }, { conflictPaths: ['key'] });
    }
};
exports.ProvisioningInstanceSettingsLoader = ProvisioningInstanceSettingsLoader;
exports.ProvisioningInstanceSettingsLoader = ProvisioningInstanceSettingsLoader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.InstanceSettingsLoaderConfig, config_1.GlobalConfig, db_1.SettingsRepository, backend_common_1.Logger])
], ProvisioningInstanceSettingsLoader);
//# sourceMappingURL=provisioning.instance-settings-loader.js.map