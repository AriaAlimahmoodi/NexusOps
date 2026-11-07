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
exports.PrometheusDnsCacheMetricsService = void 0;
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
let PrometheusDnsCacheMetricsService = class PrometheusDnsCacheMetricsService {
    constructor(dnsCache, config, ssrfConfig) {
        this.dnsCache = dnsCache;
        this.config = config;
        this.ssrfConfig = ssrfConfig;
    }
    get enabled() {
        return this.config.includeDnsCacheMetrics && this.ssrfConfig.enabled;
    }
    init() {
        this.initializeCounter('hit', 'hits');
        this.initializeCounter('miss', 'misses');
        this.initializeCounter('eviction', 'evictions');
        const dnsCache = this.dnsCache;
        new prom_client_1.default.Gauge({
            name: `${this.config.prefix}ssrf_dns_cache_size`,
            help: 'Current number of entries in the DNS cache.',
            collect() {
                this.set(dnsCache.size);
            },
        });
    }
    initializeCounter(eventName, kind) {
        const counter = new prom_client_1.default.Counter({
            name: `${this.config.prefix}ssrf_dns_cache_${kind}_total`,
            help: `Total number of DNS cache ${kind}.`,
        });
        counter.inc(0);
        this.dnsCache.events.on(eventName, () => counter.inc(1));
    }
};
exports.PrometheusDnsCacheMetricsService = PrometheusDnsCacheMetricsService;
exports.PrometheusDnsCacheMetricsService = PrometheusDnsCacheMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_network_1.InMemoryDnsCache, config_1.PrometheusMetricsConfig, config_1.SsrfProtectionConfig])
], PrometheusDnsCacheMetricsService);
//# sourceMappingURL=dns-cache-metrics.service.js.map