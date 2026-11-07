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
exports.PrometheusDbPoolMetricsService = void 0;
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const prom_client_1 = __importDefault(require("prom-client"));
let PrometheusDbPoolMetricsService = class PrometheusDbPoolMetricsService {
    constructor(promConfig, dbConfig, dbConnection, dbConnectionMetrics) {
        this.promConfig = promConfig;
        this.dbConfig = dbConfig;
        this.dbConnection = dbConnection;
        this.dbConnectionMetrics = dbConnectionMetrics;
    }
    get enabled() {
        return this.promConfig.includeDbPoolMetrics;
    }
    init() {
        const { prefix } = this.promConfig;
        const readStats = () => this.dbConnection.getPoolStats();
        const makeGauge = (name, help, value) => new prom_client_1.default.Gauge({
            name: `${prefix}db_pool_${name}`,
            help,
            collect() {
                const stats = readStats();
                if (stats)
                    this.set(value(stats));
            },
        });
        makeGauge('connections_active', 'Number of in-use connections in the database connection pool.', (s) => s.active);
        makeGauge('connections_idle', 'Number of not-in-use connections in the database connection pool.', (s) => s.idle);
        makeGauge('requests_pending', 'Number of requests waiting for an available database connection.', (s) => s.waiting);
        const maxGauge = new prom_client_1.default.Gauge({
            name: `${prefix}db_pool_connections_max`,
            help: 'Max size of the database connection pool.',
        });
        maxGauge.set(this.maxPoolSize());
        const { connectionState } = this.dbConnection;
        new prom_client_1.default.Gauge({
            name: `${prefix}db_pool_connected`,
            help: 'Whether n8n considers the database connected (1) or disconnected (0).',
            collect() {
                this.set(Number(connectionState.connected));
            },
        });
        const disconnections = new prom_client_1.default.Counter({
            name: `${prefix}db_pool_disconnections_total`,
            help: 'Number of transitions from a connected to a disconnected database.',
        });
        this.dbConnectionMetrics.disconnectionObserver = () => disconnections.inc();
        const recoveryAttempts = new prom_client_1.default.Counter({
            name: `${prefix}db_pool_recovery_attempts_total`,
            help: 'Number of completed database recovery attempts by result (Postgres only).',
            labelNames: ['result'],
        });
        recoveryAttempts.inc({ result: 'success' }, 0);
        recoveryAttempts.inc({ result: 'failure' }, 0);
        this.dbConnectionMetrics.recoveryAttemptObserver = (result) => recoveryAttempts.inc({ result });
        const acquireHistogram = new prom_client_1.default.Histogram({
            name: `${prefix}db_pool_acquire_seconds`,
            help: 'Time spent acquiring a connection from the database pool (Postgres only).',
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
        });
        this.dbConnectionMetrics.acquireDurationObserver = (seconds) => acquireHistogram.observe(seconds);
    }
    maxPoolSize() {
        if (this.dbConfig.type === 'postgresdb')
            return this.dbConfig.postgresdb.poolSize;
        return this.dbConfig.sqlite.poolSize + 1;
    }
};
exports.PrometheusDbPoolMetricsService = PrometheusDbPoolMetricsService;
exports.PrometheusDbPoolMetricsService = PrometheusDbPoolMetricsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.PrometheusMetricsConfig, config_1.DatabaseConfig, db_1.DbConnection, db_1.DbConnectionMetrics])
], PrometheusDbPoolMetricsService);
//# sourceMappingURL=db-pool-metrics.service.js.map