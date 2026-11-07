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
exports.PrometheusWorkflowStatisticsMetricsService = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
const cached_metric_query_1 = require("./cached-metric-query");
const database_metric_query_service_1 = require("./database-metric-query.service");
let PrometheusWorkflowStatisticsMetricsService = class PrometheusWorkflowStatisticsMetricsService {
    constructor(config, databaseQueries) {
        this.config = config;
        this.databaseQueries = databaseQueries;
    }
    get enabled() {
        return this.config.includeWorkflowStatistics;
    }
    init() {
        const cacheTtl = this.config.workflowStatisticsInterval * constants_1.Time.seconds.toMilliseconds;
        const query = this.databaseQueries.workflowStatistics(cacheTtl);
        const metricsConfig = [
            {
                name: 'production_executions',
                help: 'Total number of production workflow executions (success + error).',
                getValue: (metrics) => Number(metrics.productionExecutions) || 0,
            },
            {
                name: 'production_root_executions',
                help: 'Total number of production root workflow executions (excludes sub-workflows).',
                getValue: (metrics) => Number(metrics.productionRootExecutions) || 0,
            },
            {
                name: 'manual_executions',
                help: 'Total number of manual workflow executions (success + error).',
                getValue: (metrics) => Number(metrics.manualExecutions) || 0,
            },
            {
                name: 'enabled_users',
                help: 'Total number of enabled users.',
                getValue: (metrics) => Number(metrics.enabledUsers) || 0,
            },
            {
                name: 'users',
                help: 'Total number of users.',
                getValue: (metrics) => Number(metrics.totalUsers) || 0,
            },
            {
                name: 'workflows',
                help: 'Total number of workflows.',
                getValue: (metrics) => Number(metrics.totalWorkflows) || 0,
            },
            {
                name: 'credentials',
                help: 'Total number of credentials.',
                getValue: (metrics) => Number(metrics.totalCredentials) || 0,
            },
        ];
        metricsConfig.forEach((config) => {
            this.createWorkflowStatisticsGauge(config.name, config.help, config.getValue, query);
        });
    }
    createWorkflowStatisticsGauge(metricName, help, getMetricValue, query) {
        return new prom_client_1.default.Gauge({
            name: `${this.config.prefix}${metricName}`,
            help,
            async collect() {
                this.set((0, cached_metric_query_1.toGaugeValue)(await query.get(), getMetricValue));
            },
        });
    }
};
exports.PrometheusWorkflowStatisticsMetricsService = PrometheusWorkflowStatisticsMetricsService;
exports.PrometheusWorkflowStatisticsMetricsService = PrometheusWorkflowStatisticsMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, database_metric_query_service_1.DatabaseMetricQueryService])
], PrometheusWorkflowStatisticsMetricsService);
//# sourceMappingURL=workflow-statistics-metrics.service.js.map