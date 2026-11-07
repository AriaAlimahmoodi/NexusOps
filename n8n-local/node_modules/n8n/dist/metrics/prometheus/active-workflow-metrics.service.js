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
exports.PrometheusActiveWorkflowMetricsService = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
const cached_metric_query_1 = require("./cached-metric-query");
const database_metric_query_service_1 = require("./database-metric-query.service");
let PrometheusActiveWorkflowMetricsService = class PrometheusActiveWorkflowMetricsService {
    constructor(config, databaseQueries) {
        this.config = config;
        this.databaseQueries = databaseQueries;
    }
    get enabled() {
        return true;
    }
    init() {
        const cacheTtl = this.config.activeWorkflowCountInterval * constants_1.Time.seconds.toMilliseconds;
        const query = this.databaseQueries.activeWorkflowCount(cacheTtl);
        new prom_client_1.default.Gauge({
            name: `${this.config.prefix}active_workflow_count`,
            help: 'Total number of active workflows.',
            async collect() {
                this.set((0, cached_metric_query_1.toGaugeValue)(await query.get(), (count) => count));
            },
        });
    }
};
exports.PrometheusActiveWorkflowMetricsService = PrometheusActiveWorkflowMetricsService;
exports.PrometheusActiveWorkflowMetricsService = PrometheusActiveWorkflowMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, database_metric_query_service_1.DatabaseMetricQueryService])
], PrometheusActiveWorkflowMetricsService);
//# sourceMappingURL=active-workflow-metrics.service.js.map