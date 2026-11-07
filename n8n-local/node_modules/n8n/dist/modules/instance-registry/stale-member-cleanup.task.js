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
exports.StaleMemberCleanupTask = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const instance_registry_service_1 = require("./instance-registry.service");
const instance_registry_types_1 = require("./instance-registry.types");
let StaleMemberCleanupTask = class StaleMemberCleanupTask {
    constructor(logger, instanceRegistryService) {
        this.instanceRegistryService = instanceRegistryService;
        this.name = 'instance-registry-stale-member-cleanup';
        this.schedule = (0, decorators_1.intervalFromSeconds)(instance_registry_types_1.REGISTRY_CONSTANTS.RECONCILIATION_INTERVAL_SECONDS);
        this.target = (0, decorators_1.clusterTarget)({ scheduler: { retryOnFailure: true } });
        this.logger = logger.scoped('instance-registry');
    }
    async run() {
        const removed = await this.instanceRegistryService.cleanupStaleMembers();
        if (removed > 0) {
            this.logger.info('Cleaned up stale registry members', { removed });
        }
    }
};
exports.StaleMemberCleanupTask = StaleMemberCleanupTask;
exports.StaleMemberCleanupTask = StaleMemberCleanupTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, instance_registry_service_1.InstanceRegistryService])
], StaleMemberCleanupTask);
//# sourceMappingURL=stale-member-cleanup.task.js.map