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
exports.PrometheusSsrfMetricsService = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
const constant_1 = require("./constant");
const backend_network_1 = require("@n8n/backend-network");
let PrometheusSsrfMetricsService = class PrometheusSsrfMetricsService {
    constructor(ssrfProtectionService, config, ssrfConfig) {
        this.ssrfProtectionService = ssrfProtectionService;
        this.config = config;
        this.ssrfConfig = ssrfConfig;
    }
    get enabled() {
        return this.config.includeSsrfMetrics && this.ssrfConfig.enabled;
    }
    init() {
        const checksCounter = new prom_client_1.default.Counter({
            name: `${this.config.prefix}ssrf_checks_total`,
            help: 'Total number of SSRF checks by result and phase.',
            labelNames: ['result', 'phase'],
        });
        const blockedCounter = new prom_client_1.default.Counter({
            name: `${this.config.prefix}ssrf_blocked_checks_total`,
            help: 'Total number of blocked SSRF checks by phase and reason.',
            labelNames: ['phase', 'reason'],
        });
        const durationHistogram = new prom_client_1.default.Histogram({
            name: `${this.config.prefix}ssrf_check_duration_seconds`,
            help: 'Duration of SSRF checks in seconds.',
            labelNames: ['result', 'phase'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        this.ssrfProtectionService.events.on('ssrf.blocked', ({ phase, reason, durationMs }) => {
            checksCounter.inc({ result: 'blocked', phase });
            blockedCounter.inc({ phase, reason });
            durationHistogram.observe({ result: 'blocked', phase }, durationMs / 1000);
        });
        this.ssrfProtectionService.events.on('ssrf.allowed', ({ phase, durationMs }) => {
            checksCounter.inc({ result: 'allowed', phase });
            durationHistogram.observe({ result: 'allowed', phase }, durationMs / 1000);
        });
    }
};
exports.PrometheusSsrfMetricsService = PrometheusSsrfMetricsService;
exports.PrometheusSsrfMetricsService = PrometheusSsrfMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_network_1.SsrfProtectionService, config_1.PrometheusMetricsConfig, config_1.SsrfProtectionConfig])
], PrometheusSsrfMetricsService);
//# sourceMappingURL=ssrf-metrics.service.js.map