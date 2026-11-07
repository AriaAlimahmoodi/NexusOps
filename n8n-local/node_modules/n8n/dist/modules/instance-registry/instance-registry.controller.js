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
exports.InstanceRegistryController = void 0;
const decorators_1 = require("@n8n/decorators");
const check_service_1 = require("./checks/check.service");
const instance_registry_service_1 = require("./instance-registry.service");
let InstanceRegistryController = class InstanceRegistryController {
    constructor(instanceRegistryService, checkService) {
        this.instanceRegistryService = instanceRegistryService;
        this.checkService = checkService;
    }
    async getClusterInfo() {
        const [instances, { results }] = await Promise.all([
            this.instanceRegistryService.getAllInstances(),
            this.checkService.runChecks(),
        ]);
        const now = Date.now();
        const checks = results.reduce((acc, cur) => {
            const { checkName, result, failed } = cur;
            if (!acc[checkName]) {
                acc[checkName] = {
                    status: 'succeeded',
                    check: cur.checkName,
                    executedAt: now,
                    warnings: [],
                };
            }
            const entry = acc[checkName];
            const newWarnings = result?.warnings?.map((w) => ({
                check: checkName,
                ...w,
            })) ?? [];
            if (newWarnings.length > 0) {
                entry.status = 'failed';
                entry.warnings.push(...newWarnings);
            }
            if (failed) {
                entry.status = 'failed';
                entry.warnings.push({
                    check: cur.checkName,
                    code: 'cluster.check-execution-failed',
                    message: 'Failed to execute cluster check, please check error logs for details',
                    severity: 'warning',
                });
            }
            return acc;
        }, {});
        return {
            instances,
            checks,
        };
    }
};
exports.InstanceRegistryController = InstanceRegistryController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.GlobalScope)('orchestration:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstanceRegistryController.prototype, "getClusterInfo", null);
exports.InstanceRegistryController = InstanceRegistryController = __decorate([
    (0, decorators_1.RestController)('/instance-registry'),
    __metadata("design:paramtypes", [instance_registry_service_1.InstanceRegistryService, check_service_1.CheckService])
], InstanceRegistryController);
//# sourceMappingURL=instance-registry.controller.js.map