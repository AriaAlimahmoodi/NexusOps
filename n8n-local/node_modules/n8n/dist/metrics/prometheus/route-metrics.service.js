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
exports.PrometheusRouteMetricsService = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const express_prom_bundle_1 = __importDefault(require("express-prom-bundle"));
const luxon_1 = require("luxon");
const n8n_workflow_1 = require("n8n-workflow");
const prom_client_1 = __importDefault(require("prom-client"));
let PrometheusRouteMetricsService = class PrometheusRouteMetricsService {
    constructor(config, endpointsConfig) {
        this.config = config;
        this.endpointsConfig = endpointsConfig;
    }
    get enabled() {
        return this.config.includeApiEndpoints;
    }
    init(app) {
        (0, n8n_workflow_1.assert)(app, "PrometheusRouteMetricsService is initialized through the app middleware. 'app' must be defined.");
        const gauge = new prom_client_1.default.Gauge({
            name: `${this.config.prefix}last_activity`,
            help: 'last instance activity (backend request) in Unix time (seconds).',
        });
        gauge.set(luxon_1.DateTime.now().toUnixInteger());
        this.registerMiddleware(app, gauge);
    }
    registerMiddleware(app, gauge) {
        const metricsMiddleware = (0, express_prom_bundle_1.default)({
            autoregister: false,
            includeUp: false,
            includePath: this.config.includeApiPathLabel,
            includeMethod: this.config.includeApiMethodLabel,
            includeStatusCode: this.config.includeApiStatusCodeLabel,
            httpDurationMetricName: `${this.config.prefix}http_request_duration_seconds`,
        });
        app.use([
            '/api/',
            `/${this.endpointsConfig.rest}/`,
            `/${this.endpointsConfig.webhook}/`,
            `/${this.endpointsConfig.webhookWaiting}/`,
            `/${this.endpointsConfig.webhookTest}/`,
            `/${this.endpointsConfig.form}/`,
            `/${this.endpointsConfig.formWaiting}/`,
            `/${this.endpointsConfig.formTest}/`,
        ], async (req, res, next) => {
            gauge.set(luxon_1.DateTime.now().toUnixInteger());
            await metricsMiddleware(req, res, next);
        });
    }
};
exports.PrometheusRouteMetricsService = PrometheusRouteMetricsService;
exports.PrometheusRouteMetricsService = PrometheusRouteMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, config_1.EndpointsConfig])
], PrometheusRouteMetricsService);
//# sourceMappingURL=route-metrics.service.js.map