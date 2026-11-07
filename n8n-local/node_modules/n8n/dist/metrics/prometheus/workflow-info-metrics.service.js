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
exports.PrometheusWorkflowInfoMetricsService = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const prom_client_1 = __importDefault(require("prom-client"));
const database_metric_query_service_1 = require("./database-metric-query.service");
let PrometheusWorkflowInfoMetricsService = class PrometheusWorkflowInfoMetricsService {
    constructor(config, databaseQueries, instanceSettings) {
        this.config = config;
        this.databaseQueries = databaseQueries;
        this.instanceSettings = instanceSettings;
    }
    get enabled() {
        return this.config.includeWorkflowInfoMetrics;
    }
    init() {
        this.initGauge({
            name: 'workflow_info',
            help: 'Map of workflow ID to name. Reported by the leader main only.',
            activeOnly: false,
        });
        this.initGauge({
            name: 'active_workflow_info',
            help: 'Map of active workflow ID to name. Reported by the leader main only.',
            activeOnly: true,
        });
    }
    initGauge({ name, help, activeOnly }) {
        const { instanceSettings } = this;
        const cacheTtl = this.config.workflowInfoMetricInterval * constants_1.Time.seconds.toMilliseconds;
        const query = this.databaseQueries.workflowInfo(cacheTtl, activeOnly);
        new prom_client_1.default.Gauge({
            name: `${this.config.prefix}${name}`,
            help,
            labelNames: ['workflow_id', 'workflow_name'],
            async collect() {
                if (!instanceSettings.isLeader) {
                    this.reset();
                    return;
                }
                const workflows = await query.get();
                if (workflows !== undefined) {
                    this.reset();
                    for (const { id, name: workflowName } of workflows) {
                        this.labels({ workflow_id: id, workflow_name: workflowName }).set(1);
                    }
                }
            },
        });
    }
};
exports.PrometheusWorkflowInfoMetricsService = PrometheusWorkflowInfoMetricsService;
exports.PrometheusWorkflowInfoMetricsService = PrometheusWorkflowInfoMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, database_metric_query_service_1.DatabaseMetricQueryService, n8n_core_1.InstanceSettings])
], PrometheusWorkflowInfoMetricsService);
//# sourceMappingURL=workflow-info-metrics.service.js.map