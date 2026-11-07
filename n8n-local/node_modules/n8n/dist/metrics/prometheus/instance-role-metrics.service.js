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
exports.PrometheusInstanceRoleMetricsService = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const prom_client_1 = __importDefault(require("prom-client"));
let PrometheusInstanceRoleMetricsService = class PrometheusInstanceRoleMetricsService {
    constructor(config, instanceSettings) {
        this.config = config;
        this.instanceSettings = instanceSettings;
    }
    get enabled() {
        return this.instanceSettings.instanceType === 'main';
    }
    init() {
        this.gauge = new prom_client_1.default.Gauge({
            name: `${this.config.prefix}instance_role_leader`,
            help: 'Whether this main instance is the leader (1) or not (0).',
        });
        this.gauge.set(this.instanceSettings.isLeader ? 1 : 0);
    }
    updateOnLeaderTakeover() {
        this.gauge.set(1);
    }
    updateOnLeaderStepdown() {
        this.gauge.set(0);
    }
};
exports.PrometheusInstanceRoleMetricsService = PrometheusInstanceRoleMetricsService;
__decorate([
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PrometheusInstanceRoleMetricsService.prototype, "updateOnLeaderTakeover", null);
__decorate([
    (0, decorators_1.OnLeaderStepdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PrometheusInstanceRoleMetricsService.prototype, "updateOnLeaderStepdown", null);
exports.PrometheusInstanceRoleMetricsService = PrometheusInstanceRoleMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, n8n_core_1.InstanceSettings])
], PrometheusInstanceRoleMetricsService);
//# sourceMappingURL=instance-role-metrics.service.js.map