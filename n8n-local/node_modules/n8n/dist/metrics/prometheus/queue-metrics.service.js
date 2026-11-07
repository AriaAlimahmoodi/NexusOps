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
exports.PrometheusQueueMetricsService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const prom_client_1 = __importDefault(require("prom-client"));
let PrometheusQueueMetricsService = class PrometheusQueueMetricsService {
    constructor(config, executionsConfig, instanceSettings, eventService) {
        this.config = config;
        this.executionsConfig = executionsConfig;
        this.instanceSettings = instanceSettings;
        this.eventService = eventService;
    }
    get enabled() {
        return (this.config.includeQueueMetrics &&
            this.executionsConfig.mode === 'queue' &&
            this.instanceSettings.instanceType === 'main');
    }
    init() {
        const prefix = this.config.prefix;
        const waitingGauge = new prom_client_1.default.Gauge({
            name: `${prefix}scaling_mode_queue_jobs_waiting`,
            help: 'Current number of enqueued jobs waiting for pickup in scaling mode.',
        });
        waitingGauge.set(0);
        const activeGauge = new prom_client_1.default.Gauge({
            name: `${prefix}scaling_mode_queue_jobs_active`,
            help: 'Current number of jobs being processed across all workers in scaling mode.',
        });
        activeGauge.set(0);
        const completedCounter = new prom_client_1.default.Counter({
            name: `${prefix}scaling_mode_queue_jobs_completed`,
            help: 'Total number of jobs completed across all workers in scaling mode since instance start.',
        });
        completedCounter.inc(0);
        const failedCounter = new prom_client_1.default.Counter({
            name: `${prefix}scaling_mode_queue_jobs_failed`,
            help: 'Total number of jobs failed across all workers in scaling mode since instance start.',
        });
        failedCounter.inc(0);
        this.eventService.on('job-counts-updated', (jobCounts) => {
            waitingGauge.set(jobCounts.waiting);
            activeGauge.set(jobCounts.active);
            completedCounter.inc(jobCounts.completed);
            failedCounter.inc(jobCounts.failed);
        });
        const completionMissedCounter = new prom_client_1.default.Counter({
            name: `${prefix}scaling_mode_queue_jobs_completion_missed`,
            help: 'Total number of jobs whose completion event this main missed and settled from the database instead, by execution status found there.',
            labelNames: ['status'],
        });
        this.eventService.on('job-completion-missed', ({ status }) => {
            completionMissedCounter.inc({ status }, 1);
        });
    }
};
exports.PrometheusQueueMetricsService = PrometheusQueueMetricsService;
exports.PrometheusQueueMetricsService = PrometheusQueueMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, config_1.ExecutionsConfig, n8n_core_1.InstanceSettings, backend_services_1.EventService])
], PrometheusQueueMetricsService);
//# sourceMappingURL=queue-metrics.service.js.map