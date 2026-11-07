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
exports.PrometheusDefaultMetricsService = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
let PrometheusDefaultMetricsService = class PrometheusDefaultMetricsService {
    constructor(config) {
        this.config = config;
    }
    init() {
        prom_client_1.default.collectDefaultMetrics({ prefix: this.config.prefix });
    }
    get enabled() {
        return this.config.includeDefaultMetrics;
    }
};
exports.PrometheusDefaultMetricsService = PrometheusDefaultMetricsService;
exports.PrometheusDefaultMetricsService = PrometheusDefaultMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig])
], PrometheusDefaultMetricsService);
//# sourceMappingURL=default-metrics.service.js.map