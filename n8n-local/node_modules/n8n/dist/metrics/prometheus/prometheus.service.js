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
exports.PrometheusMetricsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
const database_independent_routes_service_1 = require("../../services/database-independent-routes.service");
const active_workflow_metrics_service_1 = require("./active-workflow-metrics.service");
const cache_metrics_service_1 = require("./cache-metrics.service");
const constant_1 = require("./constant");
const db_pool_metrics_service_1 = require("./db-pool-metrics.service");
const default_metrics_service_1 = require("./default-metrics.service");
const dns_cache_metrics_service_1 = require("./dns-cache-metrics.service");
const encryption_metrics_service_1 = require("./encryption-metrics.service");
const event_bus_metrics_service_1 = require("./event-bus-metrics.service");
const execution_data_metrics_service_1 = require("./execution-data-metrics.service");
const instance_ai_metrics_service_1 = require("./instance-ai-metrics.service");
const instance_role_metrics_service_1 = require("./instance-role-metrics.service");
const mcp_post_save_metrics_service_1 = require("./mcp-post-save-metrics.service");
const poll_trigger_metrics_service_1 = require("./poll-trigger-metrics.service");
const pss_metrics_service_1 = require("./pss-metrics.service");
const queue_metrics_service_1 = require("./queue-metrics.service");
const route_metrics_service_1 = require("./route-metrics.service");
const scheduler_metrics_service_1 = require("./scheduler-metrics.service");
const ssrf_metrics_service_1 = require("./ssrf-metrics.service");
const system_task_metrics_service_1 = require("./system-task-metrics.service");
const token_exchange_metrics_service_1 = require("./token-exchange-metrics.service");
const version_metrics_service_1 = require("./version-metrics.service");
const webhook_and_form_metrics_service_1 = require("./webhook-and-form-metrics.service");
const workflow_execution_duration_metrics_service_1 = require("./workflow-execution-duration-metrics.service");
const workflow_info_metrics_service_1 = require("./workflow-info-metrics.service");
const workflow_publication_metrics_service_1 = require("./workflow-publication-metrics.service");
const workflow_statistics_metrics_service_1 = require("./workflow-statistics-metrics.service");
let PrometheusMetricsService = class PrometheusMetricsService {
    constructor(logger, cache, eventBus, queue, route, roleInstance, activeWorkflow, workflowExecutionDuration, workflowStatistics, executionData, pss, version, defaultMetrics, tokenExchange, ssrf, dnsCache, webhook, workflowInfo, instanceAi, mcpPostSave, dbPool, workflowPublication, scheduler, pollTrigger, encryption, systemTask, databaseIndependentRoutes) {
        this.databaseIndependentRoutes = databaseIndependentRoutes;
        this.initialized = false;
        this.logger = logger.scoped('metrics');
        this.collectors = [
            cache,
            eventBus,
            queue,
            route,
            roleInstance,
            activeWorkflow,
            workflowExecutionDuration,
            workflowStatistics,
            executionData,
            pss,
            version,
            defaultMetrics,
            tokenExchange,
            ssrf,
            dnsCache,
            webhook,
            workflowInfo,
            instanceAi,
            mcpPostSave,
            dbPool,
            workflowPublication,
            scheduler,
            pollTrigger,
            encryption,
            systemTask,
        ];
    }
    init(app) {
        if (!this.initialized) {
            this.initialized = true;
            this.logger.debug('Initialization of prometheus metrics...');
            this.initCollectors(app);
            this.mountMetricsEndpoint(app);
            this.logger.debug('Initialization of prometheus metrics: done.');
        }
        else {
            this.logger.warn('The prometheus initialization should not be called twice.');
        }
    }
    initCollectors(app) {
        this.collectors
            .filter((collector) => collector.enabled)
            .forEach((collector) => {
            this.logger.debug(`Initialization of prometheus metrics: init '${collector.constructor.name}'.`);
            collector.init(app);
        });
    }
    mountMetricsEndpoint(app) {
        this.logger.debug("Initialization of prometheus metrics: register endpoint 'metrics/'");
        app.get(constant_1.METRICS_PATH, async (_req, res) => {
            const metrics = await prom_client_1.default.register.metrics();
            res.setHeader('Content-Type', prom_client_1.default.register.contentType);
            res.send(metrics).end();
        });
        this.databaseIndependentRoutes.add(constant_1.METRICS_PATH);
    }
};
exports.PrometheusMetricsService = PrometheusMetricsService;
exports.PrometheusMetricsService = PrometheusMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, cache_metrics_service_1.PrometheusCacheMetricsService, event_bus_metrics_service_1.PrometheusEventBusMetricsService, queue_metrics_service_1.PrometheusQueueMetricsService, route_metrics_service_1.PrometheusRouteMetricsService, instance_role_metrics_service_1.PrometheusInstanceRoleMetricsService, active_workflow_metrics_service_1.PrometheusActiveWorkflowMetricsService, workflow_execution_duration_metrics_service_1.PrometheusWorkflowExecutionDurationMetricsService, workflow_statistics_metrics_service_1.PrometheusWorkflowStatisticsMetricsService, execution_data_metrics_service_1.PrometheusExecutionDataMetricsService, pss_metrics_service_1.PrometheusPssMetricsService, version_metrics_service_1.PrometheusVersionMetricsService, default_metrics_service_1.PrometheusDefaultMetricsService, token_exchange_metrics_service_1.PrometheusTokenExchangeMetricsService, ssrf_metrics_service_1.PrometheusSsrfMetricsService, dns_cache_metrics_service_1.PrometheusDnsCacheMetricsService, webhook_and_form_metrics_service_1.PrometheusWebhookAndFormMetricsService, workflow_info_metrics_service_1.PrometheusWorkflowInfoMetricsService, instance_ai_metrics_service_1.PrometheusInstanceAiMetricsService, mcp_post_save_metrics_service_1.PrometheusMcpPostSaveMetricsService, db_pool_metrics_service_1.PrometheusDbPoolMetricsService, workflow_publication_metrics_service_1.PrometheusWorkflowPublicationMetricsService, scheduler_metrics_service_1.PrometheusSchedulerMetricsService, poll_trigger_metrics_service_1.PrometheusPollTriggerMetricsService, encryption_metrics_service_1.PrometheusEncryptionMetricsService, system_task_metrics_service_1.PrometheusSystemTaskMetricsService, database_independent_routes_service_1.DatabaseIndependentRoutes])
], PrometheusMetricsService);
//# sourceMappingURL=prometheus.service.js.map