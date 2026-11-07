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
exports.PrometheusExecutionDataMetricsService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const prom_client_1 = __importDefault(require("prom-client"));
const constant_1 = require("./constant");
let PrometheusExecutionDataMetricsService = class PrometheusExecutionDataMetricsService {
    constructor(config, eventService, storageConfig) {
        this.config = config;
        this.eventService = eventService;
        this.storageConfig = storageConfig;
    }
    get enabled() {
        return this.config.includeExecutionDataMetrics;
    }
    init() {
        const readsTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}execution_data_reads_total`,
            help: 'Total number of execution data reads.',
            labelNames: ['mode', 'result'],
        });
        const writesTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}execution_data_writes_total`,
            help: 'Total number of execution data writes.',
            labelNames: ['mode', 'result'],
        });
        const unreadableBundlesTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}execution_data_unreadable_bundles_total`,
            help: 'Total number of execution data bundles that were missing or corrupt on read.',
            labelNames: ['mode'],
        });
        for (const mode of ['db', 'fs', 's3', 'az']) {
            for (const result of ['success', 'failure']) {
                readsTotal.inc({ mode, result }, 0);
                writesTotal.inc({ mode, result }, 0);
            }
            unreadableBundlesTotal.inc({ mode }, 0);
        }
        const readDurationHistogram = new prom_client_1.default.Histogram({
            name: `${this.config.prefix}execution_data_read_duration_seconds`,
            help: 'Execution data read duration in seconds (fetch + deserialize).',
            labelNames: ['mode'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        const writeDurationHistogram = new prom_client_1.default.Histogram({
            name: `${this.config.prefix}execution_data_write_duration_seconds`,
            help: 'Execution data write duration in seconds.',
            labelNames: ['mode'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        const writeSizeHistogram = new prom_client_1.default.Histogram({
            name: `${this.config.prefix}execution_data_write_size_bytes`,
            help: 'Logical byte size of the JSON execution data bundle written (excludes binary data).',
            labelNames: ['mode'],
            buckets: constant_1.SIZE_BUCKETS_BYTES,
        });
        const writeBytesLabelNames = ['mode'];
        if (this.config.includeWorkflowIdLabel) {
            writeBytesLabelNames.push('workflow_id');
        }
        const writeBytesTotal = new prom_client_1.default.Counter({
            name: `${this.config.prefix}execution_data_write_bytes_total`,
            help: 'Total execution data bytes written, by storage mode.',
            labelNames: writeBytesLabelNames,
        });
        const storageModeGauge = new prom_client_1.default.Gauge({
            name: `${this.config.prefix}execution_data_storage_mode`,
            help: 'Configured execution data storage mode (1 for the active mode, 0 otherwise).',
            labelNames: ['mode'],
        });
        storageModeGauge.set({ mode: 'db' }, 0);
        storageModeGauge.set({ mode: 'fs' }, 0);
        storageModeGauge.set({ mode: 's3' }, 0);
        storageModeGauge.set({ mode: 'az' }, 0);
        storageModeGauge.set({ mode: this.storageConfig.modeTag }, 1);
        this.eventService.on('execution-data-read', ({ mode, durationMs, success, unreadableBundles }) => {
            readsTotal.inc({ mode, result: success ? 'success' : 'failure' }, 1);
            if (success) {
                readDurationHistogram.observe({ mode }, durationMs / 1000);
            }
            if (unreadableBundles > 0) {
                unreadableBundlesTotal.inc({ mode }, unreadableBundles);
            }
        });
        this.eventService.on('execution-data-write', ({ mode, workflowId, durationMs, success, jsonSizeBytes }) => {
            writesTotal.inc({ mode, result: success ? 'success' : 'failure' }, 1);
            if (success) {
                writeDurationHistogram.observe({ mode }, durationMs / 1000);
                writeSizeHistogram.observe({ mode }, jsonSizeBytes);
                const labels = { mode };
                if (this.config.includeWorkflowIdLabel) {
                    labels.workflow_id = workflowId;
                }
                writeBytesTotal.inc(labels, jsonSizeBytes);
            }
        });
    }
};
exports.PrometheusExecutionDataMetricsService = PrometheusExecutionDataMetricsService;
exports.PrometheusExecutionDataMetricsService = PrometheusExecutionDataMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, backend_services_1.EventService, n8n_core_1.StorageConfig])
], PrometheusExecutionDataMetricsService);
//# sourceMappingURL=execution-data-metrics.service.js.map