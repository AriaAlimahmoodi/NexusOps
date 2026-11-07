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
exports.CachedMetricQueryFactory = exports.CachedMetricQuery = void 0;
exports.toGaugeValue = toGaugeValue;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
function toGaugeValue(value, select) {
    return value === undefined ? NaN : select(value);
}
class CachedMetricQuery {
    constructor({ cacheService, cacheKey, ttlMs, query, isDatabaseConnected, }) {
        this.inFlight = null;
        this.cacheService = cacheService;
        this.cacheKey = cacheKey;
        this.ttlMs = ttlMs;
        this.query = query;
        this.isDatabaseConnected = isDatabaseConnected;
    }
    async get() {
        try {
            if (!this.isDatabaseConnected()) {
                return await this.readCache();
            }
            this.inFlight ??= this.load().finally(() => {
                this.inFlight = null;
            });
            return await this.inFlight;
        }
        catch (error) {
            if (!this.isDatabaseConnected()) {
                return undefined;
            }
            throw error;
        }
    }
    async load() {
        const cached = await this.readCache();
        if (cached !== undefined)
            return cached;
        if (!this.isDatabaseConnected()) {
            return undefined;
        }
        const value = await this.query();
        await this.cacheService.set(this.cacheKey, value, this.ttlMs);
        return value;
    }
    async readCache() {
        return await this.cacheService.get(this.cacheKey);
    }
}
exports.CachedMetricQuery = CachedMetricQuery;
let CachedMetricQueryFactory = class CachedMetricQueryFactory {
    constructor(cacheService, dbConnection) {
        this.cacheService = cacheService;
        this.dbConnection = dbConnection;
    }
    create(opts) {
        return new CachedMetricQuery({
            ...opts,
            cacheService: this.cacheService,
            isDatabaseConnected: () => this.dbConnection.connectionState.connected,
        });
    }
};
exports.CachedMetricQueryFactory = CachedMetricQueryFactory;
exports.CachedMetricQueryFactory = CachedMetricQueryFactory = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.CacheService, db_1.DbConnection])
], CachedMetricQueryFactory);
//# sourceMappingURL=cached-metric-query.js.map