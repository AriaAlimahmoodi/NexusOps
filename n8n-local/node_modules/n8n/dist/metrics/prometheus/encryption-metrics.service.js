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
exports.PrometheusEncryptionMetricsService = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const prom_client_1 = __importDefault(require("prom-client"));
const constant_1 = require("./constant");
let PrometheusEncryptionMetricsService = class PrometheusEncryptionMetricsService {
    constructor(cipher, config) {
        this.cipher = cipher;
        this.config = config;
    }
    get enabled() {
        return this.config.includeEncryptionMetrics;
    }
    init() {
        const decryptHistogram = new prom_client_1.default.Histogram({
            name: `${this.config.prefix}encryption_decrypt_duration_seconds`,
            help: 'Duration of a full decryptV2 operation (key lookup and decryption) in seconds.',
            labelNames: ['algorithm'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        const keyLookupHistogram = new prom_client_1.default.Histogram({
            name: `${this.config.prefix}encryption_key_lookup_duration_seconds`,
            help: 'Duration of encryption key lookups in seconds.',
            labelNames: ['source'],
            buckets: constant_1.DURATION_BUCKETS_SECONDS,
        });
        this.cipher.events.on('decrypt', ({ algorithm, durationMs }) => {
            decryptHistogram.observe({ algorithm }, durationMs / 1000);
        });
        this.cipher.events.on('key-lookup', ({ source, durationMs }) => {
            keyLookupHistogram.observe({ source }, durationMs / 1000);
        });
    }
};
exports.PrometheusEncryptionMetricsService = PrometheusEncryptionMetricsService;
exports.PrometheusEncryptionMetricsService = PrometheusEncryptionMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.Cipher, config_1.PrometheusMetricsConfig])
], PrometheusEncryptionMetricsService);
//# sourceMappingURL=encryption-metrics.service.js.map