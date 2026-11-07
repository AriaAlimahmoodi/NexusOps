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
exports.InstanceRegistryHeartbeatTask = void 0;
const decorators_1 = require("@n8n/decorators");
const instance_registry_service_1 = require("./instance-registry.service");
const instance_registry_types_1 = require("./instance-registry.types");
let InstanceRegistryHeartbeatTask = class InstanceRegistryHeartbeatTask {
    constructor(instanceRegistryService) {
        this.instanceRegistryService = instanceRegistryService;
        this.name = 'instance-registry-heartbeat';
        this.schedule = (0, decorators_1.intervalFromMilliseconds)(instance_registry_types_1.REGISTRY_CONSTANTS.HEARTBEAT_INTERVAL_MS);
        this.target = (0, decorators_1.instanceTarget)(['main', 'worker', 'webhook']);
    }
    async run() {
        await this.instanceRegistryService.heartbeat();
    }
};
exports.InstanceRegistryHeartbeatTask = InstanceRegistryHeartbeatTask;
exports.InstanceRegistryHeartbeatTask = InstanceRegistryHeartbeatTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [instance_registry_service_1.InstanceRegistryService])
], InstanceRegistryHeartbeatTask);
//# sourceMappingURL=instance-registry-heartbeat.task.js.map