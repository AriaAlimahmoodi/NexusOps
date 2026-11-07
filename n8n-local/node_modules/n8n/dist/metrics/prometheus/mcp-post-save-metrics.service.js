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
exports.PrometheusMcpPostSaveMetricsService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
let PrometheusMcpPostSaveMetricsService = class PrometheusMcpPostSaveMetricsService {
    constructor(config, eventService) {
        this.config = config;
        this.eventService = eventService;
    }
    get enabled() {
        return this.config.includeMcpPostSaveMetrics;
    }
    init() {
        const postSaveFailuresTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}mcp_post_save_failures_total`,
            help: 'MCP workflow-builder tool failures that occurred after a successful database write (hooks, telemetry, auto-assign). The client still receives success — these are observability-only.',
            labelNames: ['tool', 'error_type'],
        });
        this.eventService.on('mcp-post-save-failure', ({ tool, errorType }) => {
            postSaveFailuresTotal.inc({ tool, error_type: errorType }, 1);
        });
    }
};
exports.PrometheusMcpPostSaveMetricsService = PrometheusMcpPostSaveMetricsService;
exports.PrometheusMcpPostSaveMetricsService = PrometheusMcpPostSaveMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, backend_services_1.EventService])
], PrometheusMcpPostSaveMetricsService);
//# sourceMappingURL=mcp-post-save-metrics.service.js.map