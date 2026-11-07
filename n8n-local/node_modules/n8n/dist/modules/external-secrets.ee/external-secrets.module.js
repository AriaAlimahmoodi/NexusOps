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
exports.ExternalSecretsModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let ExternalSecretsModule = class ExternalSecretsModule {
    async init() {
        await import('./external-secrets.controller.ee.js');
        await import('./external-secrets-settings.controller.ee.js');
        await import('./secrets-providers-types.controller.ee.js');
        await import('./secrets-providers-connections.controller.ee.js');
        await import('./secrets-providers-completions.controller.ee.js');
        await import('./secrets-providers-project.controller.ee.js');
        const { ExternalSecretsManager } = await import('./external-secrets-manager.ee.js');
        const { ExternalSecretsProxy } = await import('n8n-core');
        const externalSecretsManager = di_1.Container.get(ExternalSecretsManager);
        const externalSecretsProxy = di_1.Container.get(ExternalSecretsProxy);
        await externalSecretsManager.init();
        externalSecretsProxy.setManager(externalSecretsManager);
    }
    async systemTasks() {
        const { ExternalSecretsRefreshTask } = await import('./external-secrets-refresh.task.js');
        return [ExternalSecretsRefreshTask];
    }
    async settings() {
        const { ExternalSecretsConfig } = await import('./external-secrets.config.js');
        const config = di_1.Container.get(ExternalSecretsConfig);
        const { ExternalSecretsSettingsService } = await import('./external-secrets-settings.service.ee.js');
        const settingsService = di_1.Container.get(ExternalSecretsSettingsService);
        return {
            multipleConnections: config.externalSecretsMultipleConnections,
            forProjects: config.externalSecretsForProjects,
            roleBasedAccess: config.externalSecretsRoleBasedAccess,
            systemRolesEnabled: config.externalSecretsRoleBasedAccess
                ? await settingsService.isSystemRolesEnabled()
                : false,
        };
    }
    async shutdown() {
        const { ExternalSecretsManager } = await import('./external-secrets-manager.ee.js');
        di_1.Container.get(ExternalSecretsManager).shutdown();
    }
};
exports.ExternalSecretsModule = ExternalSecretsModule;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExternalSecretsModule.prototype, "shutdown", null);
exports.ExternalSecretsModule = ExternalSecretsModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'external-secrets', licenseFlag: 'feat:externalSecrets' })
], ExternalSecretsModule);
//# sourceMappingURL=external-secrets.module.js.map