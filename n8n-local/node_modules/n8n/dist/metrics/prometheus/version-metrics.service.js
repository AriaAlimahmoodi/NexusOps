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
exports.PrometheusVersionMetricsService = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
const parse_1 = __importDefault(require("semver/functions/parse"));
const constants_1 = require("../../constants");
let PrometheusVersionMetricsService = class PrometheusVersionMetricsService {
    constructor(config) {
        this.config = config;
    }
    get enabled() {
        return true;
    }
    init() {
        const n8nVersion = (0, parse_1.default)(constants_1.N8N_VERSION ?? '0.0.0');
        if (n8nVersion) {
            const versionGauge = new prom_client_1.default.Gauge({
                name: `${this.config.prefix}version_info`,
                help: 'n8n version info.',
                labelNames: ['version', 'major', 'minor', 'patch'],
            });
            const { version, major, minor, patch } = n8nVersion;
            versionGauge.set({ version: 'v' + version, major, minor, patch }, 1);
        }
    }
};
exports.PrometheusVersionMetricsService = PrometheusVersionMetricsService;
exports.PrometheusVersionMetricsService = PrometheusVersionMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig])
], PrometheusVersionMetricsService);
//# sourceMappingURL=version-metrics.service.js.map