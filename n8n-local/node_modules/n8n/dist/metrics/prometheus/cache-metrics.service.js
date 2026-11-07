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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusCacheMetricsService = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
const backend_services_1 = require("@n8n/backend-services");
let PrometheusCacheMetricsService = class PrometheusCacheMetricsService {
    constructor(cacheService, config) {
        this.cacheService = cacheService;
        this.config = config;
    }
    get enabled() {
        return this.config.includeCacheMetrics;
    }
    init() {
        this.initializeCounter('metrics.cache.hit', 'hits');
        this.initializeCounter('metrics.cache.miss', 'misses');
        this.initializeCounter('metrics.cache.update', 'updates');
    }
    initializeCounter(eventName, kind) {
        const counter = new prom_client_1.default.Counter({
            name: `${this.config.prefix}cache_${kind}_total`,
            help: `Total number of cache ${kind}.`,
        });
        counter.inc(0);
        this.cacheService.on(eventName, () => counter.inc(1));
    }
};
exports.PrometheusCacheMetricsService = PrometheusCacheMetricsService;
exports.PrometheusCacheMetricsService = PrometheusCacheMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.CacheService, config_1.PrometheusMetricsConfig])
], PrometheusCacheMetricsService);
//# sourceMappingURL=cache-metrics.service.js.map