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
exports.InstanceVersionHistoryService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const constants_1 = require("../../constants");
const instance_version_history_repository_1 = require("./database/repositories/instance-version-history.repository");
const instance_version_history_types_1 = require("./instance-version-history.types");
let InstanceVersionHistoryService = class InstanceVersionHistoryService {
    constructor(repository, logger, instanceSettings) {
        this.repository = repository;
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this._cache = null;
        this.logger = this.logger.scoped('instance-version-history');
    }
    async init(retries = 3) {
        if (retries === 0)
            return;
        if (!this.instanceSettings.isLeader)
            return;
        try {
            this._cache = null;
            await this.checkAndRecordCurrentVersion();
        }
        catch (error) {
            this.logger.warn('Failed to initialize version history', { error });
            setTimeout(async () => await this.init(retries - 1), 10_000);
        }
    }
    async getCache() {
        if (this._cache !== null)
            return this._cache;
        const entries = await this.repository.find({
            order: { createdAt: 'ASC' },
        });
        this._cache = entries.map((e) => ({
            major: e.major,
            minor: e.minor,
            patch: e.patch,
            createdAt: e.createdAt,
        }));
        return this._cache;
    }
    async checkAndRecordCurrentVersion() {
        const cache = await this.getCache();
        const current = (0, instance_version_history_types_1.parseVersion)(constants_1.N8N_VERSION);
        const newest = cache.at(-1);
        if (!newest || (0, instance_version_history_types_1.compareVersions)(newest, current) !== 0) {
            const entry = this.repository.create(current);
            const saved = await this.repository.save(entry);
            cache.push({
                major: saved.major,
                minor: saved.minor,
                patch: saved.patch,
                createdAt: saved.createdAt,
            });
            this.logger.info(`Recorded version change: ${newest ? (0, instance_version_history_types_1.formatVersion)(newest) : '(none)'} -> ${constants_1.N8N_VERSION}`);
        }
    }
    async getMinVersionSince(since) {
        const cache = await this.getCache();
        let min;
        for (const entry of cache) {
            if (entry.createdAt >= since) {
                if (!min || (0, instance_version_history_types_1.versionGte)(min, entry)) {
                    min = entry;
                }
            }
        }
        return min ? { major: min.major, minor: min.minor, patch: min.patch } : undefined;
    }
    async getDateSinceContinuouslyAtLeastVersion(target) {
        const cache = await this.getCache();
        let result;
        for (let i = cache.length - 1; i >= 0; i--) {
            if ((0, instance_version_history_types_1.versionGte)(cache[i], target)) {
                result = cache[i].createdAt;
            }
            else {
                break;
            }
        }
        return result;
    }
    async getCurrentVersionDate() {
        const cache = await this.getCache();
        const entry = cache.at(-1);
        if (!entry)
            return undefined;
        return { ...entry };
    }
    async getFirstAdoptionDate(target) {
        const cache = await this.getCache();
        for (const entry of cache) {
            if ((0, instance_version_history_types_1.versionGte)(entry, target)) {
                return entry.createdAt;
            }
        }
        return undefined;
    }
};
exports.InstanceVersionHistoryService = InstanceVersionHistoryService;
exports.InstanceVersionHistoryService = InstanceVersionHistoryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [instance_version_history_repository_1.InstanceVersionHistoryRepository, backend_common_1.Logger, n8n_core_1.InstanceSettings])
], InstanceVersionHistoryService);
//# sourceMappingURL=instance-version-history.service.js.map