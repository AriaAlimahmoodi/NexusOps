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
exports.PrometheusPollTriggerMetricsService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const prom_client_1 = __importDefault(require("prom-client"));
const constant_1 = require("./constant");
let PrometheusPollTriggerMetricsService = class PrometheusPollTriggerMetricsService {
    constructor(config, instanceSettings, eventService, triggersAndPollers) {
        this.config = config;
        this.instanceSettings = instanceSettings;
        this.eventService = eventService;
        this.triggersAndPollers = triggersAndPollers;
    }
    get enabled() {
        return this.config.includePollTriggerMetrics && this.instanceSettings.instanceType === 'main';
    }
    init() {
        const prefix = this.config.prefix;
        const tickDuration = new prom_client_1.default.Histogram({
            name: `${prefix}poll_trigger_duration_seconds`,
            help: "Duration in seconds of a poll trigger's poll() call, by node type and status.",
            labelNames: ['node_type', 'status'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        const tickErrors = new prom_client_1.default.Counter({
            name: `${prefix}poll_trigger_errors_total`,
            help: 'Total number of poll trigger ticks that threw, by node type and error kind (auth, rate_limited, thrown).',
            labelNames: ['node_type', 'kind'],
        });
        const overlappingTicks = new prom_client_1.default.Counter({
            name: `${prefix}poll_trigger_overlapping_ticks_total`,
            help: 'Total number of poll ticks that started while another tick for the same node was still in flight in this process.',
            labelNames: ['node_type'],
        });
        const timeouts = new prom_client_1.default.Counter({
            name: `${prefix}poll_trigger_timeouts_total`,
            help: 'Total number of polls the durable scheduler abandoned after they exceeded N8N_SCHEDULER_POLL_TIMEOUT, by node type.',
            labelNames: ['node_type'],
        });
        const cursorCommits = new prom_client_1.default.Counter({
            name: `${prefix}poll_trigger_cursor_commits_total`,
            help: 'Total number of poll cursor commits by operation and result (success, fence_rejected, failure).',
            labelNames: ['operation', 'result'],
        });
        const cursorCommitDuration = new prom_client_1.default.Histogram({
            name: `${prefix}poll_trigger_cursor_commit_duration_seconds`,
            help: 'Duration in seconds of poll cursor commits, by operation and result.',
            labelNames: ['operation', 'result'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        this.triggersAndPollers.events.on('poll-tick-completed', (tick) => {
            tickDuration.observe({ node_type: tick.nodeType, status: tick.status }, tick.durationMs / 1000);
            if (tick.status === 'error') {
                tickErrors.inc({ node_type: tick.nodeType, kind: tick.errorKind });
            }
            if (tick.overlapped) {
                overlappingTicks.inc({ node_type: tick.nodeType });
            }
        });
        this.eventService.on('poll-cursor-commit-settled', ({ operation, result, durationMs }) => {
            cursorCommits.inc({ operation, result });
            cursorCommitDuration.observe({ operation, result }, durationMs / 1000);
        });
        this.eventService.on('poll-tick-timed-out', ({ nodeType }) => {
            timeouts.inc({ node_type: nodeType });
        });
    }
};
exports.PrometheusPollTriggerMetricsService = PrometheusPollTriggerMetricsService;
exports.PrometheusPollTriggerMetricsService = PrometheusPollTriggerMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, n8n_core_1.InstanceSettings, backend_services_1.EventService, n8n_core_1.TriggersAndPollers])
], PrometheusPollTriggerMetricsService);
//# sourceMappingURL=poll-trigger-metrics.service.js.map