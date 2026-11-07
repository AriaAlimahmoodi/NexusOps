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
exports.InstanceRegistryModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let InstanceRegistryModule = class InstanceRegistryModule {
    async init() {
        await import('./instance-registry.controller.js');
        const { InstanceRegistryService } = await import('./instance-registry.service.js');
        const instanceRegistryService = di_1.Container.get(InstanceRegistryService);
        await instanceRegistryService.init();
        const { InstanceRegistryProxyService } = await import('@n8n/backend-services');
        di_1.Container.get(InstanceRegistryProxyService).registerProvider(instanceRegistryService);
        await import('./checks/index.js');
        const { CheckService } = await import('./checks/check.service.js');
        di_1.Container.get(CheckService).init();
    }
    async systemTasks() {
        const { InstanceRegistryReconciliationTask } = await import('./checks/instance-registry-reconciliation.task.js');
        const { InstanceRegistryService } = await import('./instance-registry.service.js');
        if (di_1.Container.get(InstanceRegistryService).storageBackend !== 'redis') {
            return [InstanceRegistryReconciliationTask];
        }
        const { InstanceRegistryHeartbeatTask } = await import('./instance-registry-heartbeat.task.js');
        const { StaleMemberCleanupTask } = await import('./stale-member-cleanup.task.js');
        return [
            InstanceRegistryHeartbeatTask,
            StaleMemberCleanupTask,
            InstanceRegistryReconciliationTask,
        ];
    }
    async shutdown() {
        const { InstanceRegistryService } = await import('./instance-registry.service.js');
        await di_1.Container.get(InstanceRegistryService).shutdown();
    }
};
exports.InstanceRegistryModule = InstanceRegistryModule;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstanceRegistryModule.prototype, "shutdown", null);
exports.InstanceRegistryModule = InstanceRegistryModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'instance-registry' })
], InstanceRegistryModule);
//# sourceMappingURL=instance-registry.module.js.map