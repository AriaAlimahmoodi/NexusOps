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
exports.PrometheusWebhookAndFormMetricsService = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
let PrometheusWebhookAndFormMetricsService = class PrometheusWebhookAndFormMetricsService {
    constructor(config) {
        this.config = config;
    }
    get enabled() {
        return this.config.includeWebhookMetrics || this.config.includeFormMetrics;
    }
    init() {
        const buckets = [0.003, 0.03, 0.1, 0.3, 1.5, 10];
        if (this.config.includeWebhookMetrics) {
            this.webhookHistogram = new prom_client_1.default.Histogram({
                name: `${this.config.prefix}webhook_request_duration_seconds`,
                help: 'Duration of webhook requests served by n8n, in seconds.',
                labelNames: ['method', 'status_code', 'webhook_path', 'workflow_id'],
                buckets,
            });
        }
        if (this.config.includeFormMetrics) {
            this.formHistogram = new prom_client_1.default.Histogram({
                name: `${this.config.prefix}form_submission_duration_seconds`,
                help: 'Duration of form submissions (POST) served by n8n, in seconds.',
                labelNames: ['status_code', 'form_path', 'workflow_id'],
                buckets,
            });
        }
    }
    observeWebhookRequest(observation) {
        if (!this.config.includeWebhookMetrics) {
            return;
        }
        this.webhookHistogram?.observe({
            method: observation.method,
            status_code: observation.statusCode,
            webhook_path: observation.webhookPath,
            workflow_id: observation.workflowId,
        }, observation.durationSeconds);
    }
    observeFormSubmission(observation) {
        if (!this.config.includeFormMetrics) {
            return;
        }
        this.formHistogram?.observe({
            status_code: observation.statusCode,
            form_path: observation.formPath,
            workflow_id: observation.workflowId,
        }, observation.durationSeconds);
    }
};
exports.PrometheusWebhookAndFormMetricsService = PrometheusWebhookAndFormMetricsService;
exports.PrometheusWebhookAndFormMetricsService = PrometheusWebhookAndFormMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig])
], PrometheusWebhookAndFormMetricsService);
//# sourceMappingURL=webhook-and-form-metrics.service.js.map