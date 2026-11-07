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
exports.PrometheusInstanceAiMetricsService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
const instance_ai_run_probe_1 = require("../../modules/instance-ai/instance-ai-run-probe");
const constant_1 = require("./constant");
let PrometheusInstanceAiMetricsService = class PrometheusInstanceAiMetricsService {
    constructor(config, eventService, runProbe) {
        this.config = config;
        this.eventService = eventService;
        this.runProbe = runProbe;
    }
    get enabled() {
        return true;
    }
    init() {
        const runsTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_runs_total`,
            help: 'Total number of Instance AI runs.',
            labelNames: ['status', 'model'],
        });
        const runDurationHistogram = new prom_client_1.default.Histogram({
            name: `${this.config.prefix}instance_ai_run_duration_seconds`,
            help: 'Instance AI run duration in seconds.',
            labelNames: ['status'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        const toolCallsTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_tool_calls_total`,
            help: 'Total number of tool calls made during Instance AI runs.',
        });
        toolCallsTotal.inc(0);
        const toolErrorsTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_tool_errors_total`,
            help: 'Total number of failed tool calls during Instance AI runs.',
        });
        toolErrorsTotal.inc(0);
        const tokensTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_tokens_total`,
            help: 'Total number of tokens used by Instance AI runs.',
            labelNames: ['type'],
        });
        tokensTotal.inc({ type: 'input' }, 0);
        tokensTotal.inc({ type: 'output' }, 0);
        const costTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_cost_usd_total`,
            help: 'Total estimated cost in USD of Instance AI runs (models.dev pricing).',
        });
        costTotal.inc(0);
        const runsRefusedTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_runs_refused_total`,
            help: 'Instance AI runs refused by a concurrency cap, by reason.',
            labelNames: ['reason'],
        });
        runsRefusedTotal.inc({ reason: 'user_run_limit' }, 0);
        runsRefusedTotal.inc({ reason: 'instance_run_limit' }, 0);
        this.eventService.on('instance-ai-run-refused', ({ reason }) => {
            runsRefusedTotal.inc({ reason });
        });
        const runProbe = this.runProbe;
        new prom_client_1.default.Gauge({
            name: `${this.config.prefix}instance_ai_active_runs`,
            help: 'Number of Instance AI runs currently executing.',
            collect() {
                this.set(runProbe.activeRunCount());
            },
        });
        const durableLogRowsTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_durable_log_rows_total`,
            help: 'Durable Instance AI event rows appended (structural facts + coalesced blocks).',
        });
        durableLogRowsTotal.inc(0);
        const durableLogBytesTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_durable_log_bytes_total`,
            help: 'Serialized payload bytes appended to the durable Instance AI event log.',
        });
        durableLogBytesTotal.inc(0);
        const durableLogQueueLatency = new prom_client_1.default.Histogram({
            name: `${this.config.prefix}instance_ai_durable_log_queue_latency_seconds`,
            help: 'Time from event publish to durable batch persistence, per event.',
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
        });
        const durableLogAppendConflictsTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_durable_log_append_conflicts_total`,
            help: 'Retried (threadId, seq) append collisions between concurrent writers.',
        });
        durableLogAppendConflictsTotal.inc(0);
        const durableLogAppendFailuresTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_durable_log_append_failures_total`,
            help: 'Durable-log batches dropped after exhausting append retries.',
        });
        durableLogAppendFailuresTotal.inc(0);
        const durableLogReplaysTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_durable_log_replays_total`,
            help: 'SSE reconnects that served a replay from the durable event log.',
        });
        durableLogReplaysTotal.inc(0);
        const durableLogReplayCursorAge = new prom_client_1.default.Histogram({
            name: `${this.config.prefix}instance_ai_durable_log_replay_cursor_age_events`,
            help: 'How many events behind the log head a reconnecting cursor was.',
            buckets: [1, 5, 25, 100, 500],
        });
        const historyFoldDuration = new prom_client_1.default.Histogram({
            name: `${this.config.prefix}instance_ai_history_fold_duration_seconds`,
            help: 'Latency of deriving history agent trees by folding the durable log.',
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
        });
        const runsSweptTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}instance_ai_runs_swept_total`,
            help: 'Crashed Instance AI runs resolved by the interrupted-run sweep.',
            labelNames: ['outcome'],
        });
        runsSweptTotal.inc({ outcome: 'interrupted' }, 0);
        runsSweptTotal.inc({ outcome: 'crash-resumed' }, 0);
        this.eventService.on('instance-ai-durable-log-drained', ({ rows, bytes }) => {
            durableLogRowsTotal.inc(rows);
            durableLogBytesTotal.inc(bytes);
        });
        this.eventService.on('instance-ai-durable-log-queue-latency', ({ ms }) => {
            durableLogQueueLatency.observe(ms / 1000);
        });
        this.eventService.on('instance-ai-durable-log-append-conflict', () => {
            durableLogAppendConflictsTotal.inc(1);
        });
        this.eventService.on('instance-ai-durable-log-append-failure', () => {
            durableLogAppendFailuresTotal.inc(1);
        });
        this.eventService.on('instance-ai-durable-log-replayed', ({ cursorAgeEvents }) => {
            durableLogReplaysTotal.inc(1);
            durableLogReplayCursorAge.observe(cursorAgeEvents);
        });
        this.eventService.on('instance-ai-history-folded', ({ latencyMs }) => {
            historyFoldDuration.observe(latencyMs / 1000);
        });
        this.eventService.on('instance-ai-run-swept', ({ outcome }) => {
            runsSweptTotal.inc({ outcome }, 1);
        });
        this.eventService.on('instance-ai-run-finished', ({ status, durationMs, model, toolCalls, toolErrors, usage }) => {
            if (status !== 'suspended') {
                runsTotal.inc({ status, model }, 1);
                if (durationMs !== undefined) {
                    runDurationHistogram.observe({ status }, durationMs / 1000);
                }
            }
            if (toolCalls > 0)
                toolCallsTotal.inc(toolCalls);
            if (toolErrors > 0)
                toolErrorsTotal.inc(toolErrors);
            if (usage) {
                if (usage.promptTokens > 0)
                    tokensTotal.inc({ type: 'input' }, usage.promptTokens);
                if (usage.completionTokens > 0) {
                    tokensTotal.inc({ type: 'output' }, usage.completionTokens);
                }
                if (usage.costUsd > 0)
                    costTotal.inc(usage.costUsd);
            }
        });
    }
};
exports.PrometheusInstanceAiMetricsService = PrometheusInstanceAiMetricsService;
exports.PrometheusInstanceAiMetricsService = PrometheusInstanceAiMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, backend_services_1.EventService, instance_ai_run_probe_1.InstanceAiRunProbe])
], PrometheusInstanceAiMetricsService);
//# sourceMappingURL=instance-ai-metrics.service.js.map