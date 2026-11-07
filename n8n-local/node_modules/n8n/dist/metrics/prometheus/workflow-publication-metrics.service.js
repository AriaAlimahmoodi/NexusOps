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
exports.PrometheusWorkflowPublicationMetricsService = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const prom_client_1 = __importDefault(require("prom-client"));
const backend_services_1 = require("@n8n/backend-services");
const cached_metric_query_1 = require("./cached-metric-query");
const constant_1 = require("./constant");
const database_metric_query_service_1 = require("./database-metric-query.service");
const ALL_STATUSES = Object.values(db_1.WorkflowPublicationOutboxStatus);
const ACTIVE_STATUSES = [
    db_1.WorkflowPublicationOutboxStatus.Pending,
    db_1.WorkflowPublicationOutboxStatus.InProgress,
];
let PrometheusWorkflowPublicationMetricsService = class PrometheusWorkflowPublicationMetricsService {
    constructor(config, workflowsConfig, instanceSettings, eventService, databaseQueries) {
        this.config = config;
        this.workflowsConfig = workflowsConfig;
        this.instanceSettings = instanceSettings;
        this.eventService = eventService;
        this.databaseQueries = databaseQueries;
    }
    get enabled() {
        return (this.config.includeWorkflowPublicationMetrics &&
            this.workflowsConfig.useWorkflowPublicationService &&
            this.instanceSettings.instanceType === 'main');
    }
    init() {
        this.initOutboxGauges();
        this.initRecordOutcomeMetrics();
        this.initTriggerMetrics();
        this.initCleanupMetrics();
        this.initReconciliationMetrics();
        this.initGhostSweepMetrics();
    }
    initOutboxGauges() {
        const prefix = this.config.prefix;
        const cacheTtl = this.config.workflowPublicationMetricInterval * constants_1.Time.seconds.toMilliseconds;
        const query = this.databaseQueries.workflowPublication(cacheTtl);
        new prom_client_1.default.Gauge({
            name: `${prefix}workflow_publication_outbox_records`,
            help: 'Number of workflow publication outbox records by status.',
            labelNames: ['status'],
            async collect() {
                const byStatus = await query.get();
                for (const status of ALL_STATUSES) {
                    this.set({ status }, (0, cached_metric_query_1.toGaugeValue)(byStatus, (stats) => stats[status]?.count ?? 0));
                }
            },
        });
        new prom_client_1.default.Gauge({
            name: `${prefix}workflow_publication_outbox_oldest_active_record_age_seconds`,
            help: 'Age in seconds of the oldest active (pending/in_progress) workflow publication outbox record by status.',
            labelNames: ['status'],
            async collect() {
                const byStatus = await query.get();
                const now = Date.now();
                for (const status of ACTIVE_STATUSES) {
                    this.set({ status }, (0, cached_metric_query_1.toGaugeValue)(byStatus, (stats) => {
                        const oldestMs = stats[status]?.oldestMs;
                        return oldestMs !== undefined ? (now - oldestMs) * constants_1.Time.milliseconds.toSeconds : 0;
                    }));
                }
            },
        });
    }
    initRecordOutcomeMetrics() {
        const prefix = this.config.prefix;
        const outcomes = new prom_client_1.default.Counter({
            name: `${prefix}workflow_publication_outbox_record_outcomes_total`,
            help: 'Total number of workflow publication outbox records processed by result and reason.',
            labelNames: ['result', 'reason'],
        });
        const duration = new prom_client_1.default.Histogram({
            name: `${prefix}workflow_publication_outbox_record_duration_seconds`,
            help: 'Duration in seconds of processing a workflow publication outbox record by result and reason.',
            labelNames: ['result', 'reason'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        this.eventService.on('workflow-publication-outbox-record-processed', ({ result, reason, durationMs }) => {
            outcomes.inc({ result, reason }, 1);
            duration.observe({ result, reason }, durationMs * constants_1.Time.milliseconds.toSeconds);
        });
    }
    initTriggerMetrics() {
        const prefix = this.config.prefix;
        const operationDuration = new prom_client_1.default.Histogram({
            name: `${prefix}workflow_publication_trigger_operation_duration_seconds`,
            help: 'Duration in seconds of a workflow publication trigger operation by operation and result.',
            labelNames: ['operation', 'result'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        const nodeOperations = new prom_client_1.default.Counter({
            name: `${prefix}workflow_publication_trigger_node_operations_total`,
            help: 'Total number of trigger nodes (de)activated during workflow publication by operation and result.',
            labelNames: ['operation', 'result'],
        });
        this.eventService.on('workflow-publication-trigger-operation', ({ operation, result, durationMs }) => {
            operationDuration.observe({ operation, result }, durationMs * constants_1.Time.milliseconds.toSeconds);
        });
        this.eventService.on('workflow-publication-trigger-node-operations', ({ operation, result, count }) => {
            nodeOperations.inc({ operation, result }, count);
        });
    }
    initCleanupMetrics() {
        const prefix = this.config.prefix;
        const deleted = new prom_client_1.default.Counter({
            name: `${prefix}workflow_publication_outbox_cleanup_deleted_records_total`,
            help: 'Total number of terminal workflow publication outbox records deleted by cleanup.',
        });
        const duration = new prom_client_1.default.Histogram({
            name: `${prefix}workflow_publication_outbox_cleanup_duration_seconds`,
            help: 'Duration in seconds of a workflow publication outbox cleanup run by result.',
            labelNames: ['result'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        this.eventService.on('workflow-publication-outbox-cleanup', ({ result, deletedCount, durationMs }) => {
            deleted.inc(deletedCount);
            duration.observe({ result }, durationMs * constants_1.Time.milliseconds.toSeconds);
        });
    }
    initReconciliationMetrics() {
        const prefix = this.config.prefix;
        const deficient = new prom_client_1.default.Counter({
            name: `${prefix}workflow_publication_reconciliation_deficient_workflows_total`,
            help: 'Total number of workflows re-enqueued by trigger reconciliation because their in-memory triggers were missing.',
        });
        const surplus = new prom_client_1.default.Counter({
            name: `${prefix}workflow_publication_reconciliation_surplus_workflows_total`,
            help: 'Total number of registered workflows torn down by trigger reconciliation because they were no longer published.',
        });
        const versionSkew = new prom_client_1.default.Counter({
            name: `${prefix}workflow_publication_reconciliation_version_skew_workflows_total`,
            help: 'Total number of workflows re-enqueued by reconciliation because their published version diverged from the active version.',
        });
        const statusDrift = new prom_client_1.default.Counter({
            name: `${prefix}workflow_publication_reconciliation_status_drift_workflows_total`,
            help: 'Total number of workflows re-enqueued by reconciliation because a trigger-status row was recorded for a version other than the active one.',
        });
        const unreported = new prom_client_1.default.Counter({
            name: `${prefix}workflow_publication_reconciliation_unreported_workflows_total`,
            help: 'Total number of published workflows re-enqueued by reconciliation because no publication had reported trigger statuses for them.',
        });
        const duration = new prom_client_1.default.Histogram({
            name: `${prefix}workflow_publication_reconciliation_duration_seconds`,
            help: 'Duration in seconds of a trigger reconciliation pass by result.',
            labelNames: ['result'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        this.eventService.on('workflow-publication-reconciliation', ({ result, deficientCount, surplusCount, versionSkewCount, statusDriftCount, unreportedCount, durationMs, }) => {
            deficient.inc(deficientCount);
            surplus.inc(surplusCount);
            versionSkew.inc(versionSkewCount);
            statusDrift.inc(statusDriftCount);
            unreported.inc(unreportedCount);
            duration.observe({ result }, durationMs * constants_1.Time.milliseconds.toSeconds);
        });
    }
    initGhostSweepMetrics() {
        const prefix = this.config.prefix;
        const removed = new prom_client_1.default.Counter({
            name: `${prefix}workflow_publication_reconciliation_ghost_trigger_workflows_total`,
            help: 'Total number of workflows whose ghost triggers were torn down because they were registered on a non-leader instance.',
        });
        this.eventService.on('workflow-publication-ghost-trigger-sweep', ({ removedCount }) => {
            removed.inc(removedCount);
        });
    }
};
exports.PrometheusWorkflowPublicationMetricsService = PrometheusWorkflowPublicationMetricsService;
exports.PrometheusWorkflowPublicationMetricsService = PrometheusWorkflowPublicationMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, config_1.WorkflowsConfig, n8n_core_1.InstanceSettings, backend_services_1.EventService, database_metric_query_service_1.DatabaseMetricQueryService])
], PrometheusWorkflowPublicationMetricsService);
//# sourceMappingURL=workflow-publication-metrics.service.js.map