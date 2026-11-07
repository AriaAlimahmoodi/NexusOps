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
exports.PrometheusWorkflowExecutionDurationMetricsService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
const constant_1 = require("./constant");
let PrometheusWorkflowExecutionDurationMetricsService = class PrometheusWorkflowExecutionDurationMetricsService {
    constructor(config, eventService) {
        this.config = config;
        this.eventService = eventService;
    }
    get enabled() {
        return this.config.includeWorkflowExecutionDuration;
    }
    init() {
        const labelNames = ['status', 'mode'];
        if (this.config.includeWorkflowIdLabel) {
            labelNames.push('workflow_id');
        }
        const durationHistogram = new prom_client_1.default.Histogram({
            name: `${this.config.prefix}workflow_execution_duration_seconds`,
            help: 'Workflow execution duration in seconds.',
            labelNames,
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        this.eventService.on('workflow-post-execute', ({ runData, workflow }) => {
            if (runData?.stoppedAt) {
                const durationSeconds = (runData.stoppedAt.getTime() - runData.startedAt.getTime()) / 1000;
                const labels = {
                    status: runData.status === 'success' ? 'success' : 'failed',
                    mode: runData.mode,
                };
                if (this.config.includeWorkflowIdLabel) {
                    labels.workflow_id = String(workflow.id ?? 'unknown');
                }
                durationHistogram.observe(labels, durationSeconds);
            }
        });
    }
};
exports.PrometheusWorkflowExecutionDurationMetricsService = PrometheusWorkflowExecutionDurationMetricsService;
exports.PrometheusWorkflowExecutionDurationMetricsService = PrometheusWorkflowExecutionDurationMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, backend_services_1.EventService])
], PrometheusWorkflowExecutionDurationMetricsService);
//# sourceMappingURL=workflow-execution-duration-metrics.service.js.map