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
exports.PrometheusPssMetricsService = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const node_fs_1 = require("node:fs");
const prom_client_1 = __importDefault(require("prom-client"));
let PrometheusPssMetricsService = class PrometheusPssMetricsService {
    constructor(config) {
        this.config = config;
    }
    get enabled() {
        return this.config.includeDefaultMetrics && this.isAvailable();
    }
    init() {
        new prom_client_1.default.Gauge({
            name: `${this.config.prefix}process_pss_bytes`,
            help: 'Proportional Set Size of the process in bytes.',
            collect() {
                try {
                    const content = (0, node_fs_1.readFileSync)('/proc/self/smaps_rollup', 'utf8');
                    const match = content.match(/^Pss:\s+(\d+)\s+kB$/m);
                    if (match) {
                        this.set(parseInt(match[1], 10) * 1024);
                    }
                }
                catch {
                }
            },
        });
    }
    isAvailable() {
        try {
            (0, node_fs_1.readFileSync)('/proc/self/smaps_rollup', 'utf8');
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.PrometheusPssMetricsService = PrometheusPssMetricsService;
exports.PrometheusPssMetricsService = PrometheusPssMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig])
], PrometheusPssMetricsService);
//# sourceMappingURL=pss-metrics.service.js.map