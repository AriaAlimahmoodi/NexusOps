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
exports.PoolConfigService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const queue_name_1 = require("./queue-name");
const worker_pools_service_ee_1 = require("./worker-pools.service.ee");
let PoolConfigService = class PoolConfigService {
    constructor(projectPoolSettingsRepository, cacheService, workerPoolsService, globalConfig, licenseState) {
        this.projectPoolSettingsRepository = projectPoolSettingsRepository;
        this.cacheService = cacheService;
        this.workerPoolsService = workerPoolsService;
        this.globalConfig = globalConfig;
        this.licenseState = licenseState;
    }
    async resolvePoolForExecution(data) {
        const systemDefault = { queueName: queue_name_1.DEFAULT_QUEUE_NAME, poolName: undefined };
        if (!this.globalConfig.queue.workerPool.enabled)
            return systemDefault;
        if (!this.licenseState.isWorkerPoolsLicensed())
            return systemDefault;
        if (!data.projectId)
            return systemDefault;
        const pool = await this.getProjectDefaultPool(data.projectId);
        if (!pool)
            return systemDefault;
        return { queueName: (0, queue_name_1.poolQueueName)(pool), poolName: pool };
    }
    async getProjectPoolSettings(projectId) {
        const [defaultPool, availablePools] = await Promise.all([
            this.getProjectDefaultPool(projectId),
            this.workerPoolsService.getAvailablePools(),
        ]);
        return { defaultPool: defaultPool ?? null, availablePools };
    }
    async setProjectPoolSettings(projectId, patch) {
        const defaultPool = patch.defaultPool ? patch.defaultPool : null;
        await this.projectPoolSettingsRepository.setDefaultPool(projectId, defaultPool);
        await this.cacheService.delete(this.cacheKey(projectId));
        const availablePools = await this.workerPoolsService.getAvailablePools();
        return { defaultPool, availablePools };
    }
    cacheKey(projectId) {
        return `projectPool:${projectId}`;
    }
    async getProjectDefaultPool(projectId) {
        const cacheKey = this.cacheKey(projectId);
        const cached = await this.cacheService.get(cacheKey);
        if (cached !== undefined)
            return cached || undefined;
        const pool = await this.projectPoolSettingsRepository.getDefaultPool(projectId);
        void this.cacheService.set(cacheKey, pool ?? '');
        return pool ?? undefined;
    }
};
exports.PoolConfigService = PoolConfigService;
exports.PoolConfigService = PoolConfigService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ProjectPoolSettingsRepository, backend_services_1.CacheService, worker_pools_service_ee_1.WorkerPoolsService, config_1.GlobalConfig, backend_common_1.LicenseState])
], PoolConfigService);
//# sourceMappingURL=pool-config.service.ee.js.map