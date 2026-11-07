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
exports.InstanceRegistryService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const node_crypto_1 = require("node:crypto");
const constants_1 = require("../../constants");
const queue_name_1 = require("../../scaling/queue-name");
let InstanceRegistryService = class InstanceRegistryService {
    constructor(instanceSettings, executionsConfig, scalingModeConfig, logger) {
        this.instanceSettings = instanceSettings;
        this.executionsConfig = executionsConfig;
        this.scalingModeConfig = scalingModeConfig;
        this.logger = logger;
        this.instanceKey = (0, node_crypto_1.randomUUID)();
        this.registeredAt = 0;
        this.logger = this.logger.scoped('instance-registry');
    }
    async init() {
        this.storage = await this.selectStorage();
        this.registeredAt = Date.now();
        const registration = this.buildRegistration();
        await this.storage.register(registration);
        this.logger.info('Instance registered', {
            instanceKey: this.instanceKey,
            backend: this.storage.kind,
            instanceType: this.instanceSettings.instanceType,
        });
    }
    async shutdown() {
        if (!this.storage)
            return;
        try {
            await this.storage.unregister(this.instanceKey);
        }
        catch (error) {
            this.logger.warn('Failed to unregister during shutdown', { error });
        }
        try {
            await this.storage.destroy();
        }
        catch (error) {
            this.logger.warn('Failed to destroy storage during shutdown', { error });
        }
        this.logger.debug('Instance unregistered');
    }
    async heartbeat() {
        await this.storage.heartbeat(this.buildRegistration());
    }
    async getAllInstances() {
        try {
            return await this.storage.getAllRegistrations();
        }
        catch (error) {
            this.logger.warn('Failed to get all registrations', { error });
            return [];
        }
    }
    getLocalInstance() {
        return this.buildRegistration();
    }
    async getLastKnownState() {
        try {
            return await this.storage.getLastKnownState();
        }
        catch (error) {
            this.logger.warn('Failed to get last known state', { error });
            return new Map();
        }
    }
    async readClusterState() {
        const instances = await this.storage.getAllRegistrations();
        const lastKnownState = await this.storage.getLastKnownState();
        return { instances, lastKnownState };
    }
    async saveLastKnownState(state) {
        await this.storage.saveLastKnownState(state);
    }
    async cleanupStaleMembers() {
        return await this.storage.cleanupStaleMembers();
    }
    get storageBackend() {
        return this.storage.kind;
    }
    buildRegistration() {
        const base = {
            schemaVersion: 1,
            instanceKey: this.instanceKey,
            hostId: this.instanceSettings.hostId,
            instanceType: this.instanceSettings.instanceType,
            instanceRole: this.instanceSettings.instanceRole,
            version: constants_1.N8N_VERSION,
            registeredAt: this.registeredAt,
            lastSeen: Date.now(),
        };
        if (this.instanceSettings.instanceType === 'worker') {
            return { ...base, poolName: (0, queue_name_1.resolveWorkerPoolName)(this.scalingModeConfig.workerPool) };
        }
        return base;
    }
    async selectStorage() {
        const useRedis = this.instanceSettings.isMultiMain || this.executionsConfig.mode === 'queue';
        if (useRedis) {
            const { RedisInstanceStorage } = await import('./storage/redis-instance-storage.js');
            const { Container } = await import('@n8n/di');
            return Container.get(RedisInstanceStorage);
        }
        const { MemoryInstanceStorage } = await import('./storage/memory-storage.js');
        return new MemoryInstanceStorage();
    }
};
exports.InstanceRegistryService = InstanceRegistryService;
exports.InstanceRegistryService = InstanceRegistryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings, config_1.ExecutionsConfig, config_1.ScalingModeConfig, backend_common_1.Logger])
], InstanceRegistryService);
//# sourceMappingURL=instance-registry.service.js.map