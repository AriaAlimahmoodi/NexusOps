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
exports.ExternalSecretsSettingsService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const backend_services_1 = require("@n8n/backend-services");
let ExternalSecretsSettingsService = class ExternalSecretsSettingsService {
    constructor(settingsRepository, roleService) {
        this.settingsRepository = settingsRepository;
        this.roleService = roleService;
    }
    async setSystemRolesEnabled(enabled) {
        await this.settingsRepository.upsert({
            key: permissions_1.EXTERNAL_SECRETS_SYSTEM_ROLES_ENABLED_SETTING.key,
            value: enabled.toString(),
            loadOnStartup: true,
        }, ['key']);
        const { roleScopeMap } = permissions_1.EXTERNAL_SECRETS_SYSTEM_ROLES_ENABLED_SETTING;
        for (const [roleSlug, scopes] of Object.entries(roleScopeMap)) {
            if (enabled) {
                await this.roleService.addScopesToRole(roleSlug, scopes);
            }
            else {
                await this.roleService.removeScopesFromRole(roleSlug, scopes);
            }
        }
    }
    async isSystemRolesEnabled() {
        const rows = await this.settingsRepository.findByKeys([
            permissions_1.EXTERNAL_SECRETS_SYSTEM_ROLES_ENABLED_SETTING.key,
        ]);
        const value = rows.find((r) => r.key === permissions_1.EXTERNAL_SECRETS_SYSTEM_ROLES_ENABLED_SETTING.key)?.value;
        return value === 'true';
    }
};
exports.ExternalSecretsSettingsService = ExternalSecretsSettingsService;
exports.ExternalSecretsSettingsService = ExternalSecretsSettingsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, backend_services_1.RoleService])
], ExternalSecretsSettingsService);
//# sourceMappingURL=external-secrets-settings.service.ee.js.map