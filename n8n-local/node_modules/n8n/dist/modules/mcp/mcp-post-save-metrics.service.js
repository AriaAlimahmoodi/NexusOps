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
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpPostSaveMetricsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
let McpPostSaveMetricsService = class McpPostSaveMetricsService {
    constructor(config, eventService, logger) {
        this.config = config;
        this.eventService = eventService;
        this.logger = logger;
    }
    incrementPostSaveFailure(tool, error) {
        try {
            if (!this.config.enable)
                return;
            const errorType = error instanceof Error ? error.constructor.name : 'Unknown';
            this.eventService.emit('mcp-post-save-failure', { tool, errorType });
        }
        catch (error) {
            this.logger.debug('Failed to record post-save failure metric', { error });
        }
    }
};
exports.McpPostSaveMetricsService = McpPostSaveMetricsService;
exports.McpPostSaveMetricsService = McpPostSaveMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, backend_services_1.EventService, backend_common_1.Logger])
], McpPostSaveMetricsService);
//# sourceMappingURL=mcp-post-save-metrics.service.js.map