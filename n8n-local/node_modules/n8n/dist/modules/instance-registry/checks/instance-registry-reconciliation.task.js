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
exports.InstanceRegistryReconciliationTask = void 0;
const decorators_1 = require("@n8n/decorators");
const check_service_1 = require("./check.service");
const instance_registry_types_1 = require("../instance-registry.types");
let InstanceRegistryReconciliationTask = class InstanceRegistryReconciliationTask {
    constructor(checkService) {
        this.checkService = checkService;
        this.name = 'instance-registry-reconciliation';
        this.schedule = (0, decorators_1.intervalFromSeconds)(instance_registry_types_1.REGISTRY_CONSTANTS.RECONCILIATION_INTERVAL_SECONDS);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: { retryOnFailure: false },
            leaderTimer: { runOnTakeover: true },
        });
    }
    async run(signal) {
        await this.checkService.reconcile(signal);
    }
};
exports.InstanceRegistryReconciliationTask = InstanceRegistryReconciliationTask;
exports.InstanceRegistryReconciliationTask = InstanceRegistryReconciliationTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [check_service_1.CheckService])
], InstanceRegistryReconciliationTask);
//# sourceMappingURL=instance-registry-reconciliation.task.js.map