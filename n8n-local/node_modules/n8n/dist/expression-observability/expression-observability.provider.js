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
exports.ExpressionObservabilityProvider = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const expression_runtime_1 = require("@n8n/expression-runtime");
const api_1 = require("@opentelemetry/api");
const n8n_workflow_1 = require("n8n-workflow");
const prom_client_1 = __importDefault(require("prom-client"));
const expression_observability_constants_1 = require("./expression-observability.constants");
const expression_observability_formatters_1 = require("./expression-observability.formatters");
const otel_service_1 = require("../modules/otel/otel.service");
let ExpressionObservabilityProvider = class ExpressionObservabilityProvider {
    constructor(config, logger, globalConfig, otelService) {
        this.config = config;
        this.logger = logger;
        this.otelService = otelService;
        this.metricDefs = new Map(Object.values(expression_runtime_1.EXPRESSION_METRICS).map((def) => [def.name, def]));
        this.scopedLogger = this.logger.scoped('expression-engine');
        if (!this.config.observabilityEnabled ||
            (this.config.engine !== 'vm' && this.config.engine !== 'quickjs')) {
            this.metrics = expression_runtime_1.NoOpProvider.metrics;
            this.traces = expression_runtime_1.NoOpProvider.traces;
            this.logs = expression_runtime_1.NoOpProvider.logs;
            return;
        }
        this.prefix = globalConfig.endpoints.metrics.prefix;
        for (const metric of this.metricDefs.values()) {
            this.getOrRegisterMetric(metric);
        }
        this.metrics = {
            counter: (name, value, tags) => this.counter(name, value, tags),
            gauge: (name, value, tags) => this.gauge(name, value, tags),
            histogram: (name, value, tags) => this.histogram(name, value, tags),
        };
        this.traces = {
            startSpan: (name, attributes) => this.startSpan(name, attributes),
        };
        this.logs = {
            error: (message, error, context) => this.scopedLogger.error(message, { error, ...context }),
            warn: (message, context) => this.scopedLogger.warn(message, context),
            info: (message, context) => this.scopedLogger.info(message, context),
            debug: (message, context) => this.scopedLogger.debug(message, context),
        };
    }
    getOrRegisterMetric(def) {
        const promName = (0, expression_observability_formatters_1.toPromName)(def.name, def.kind, this.prefix);
        const existing = prom_client_1.default.register.getSingleMetric(promName);
        if (existing)
            return existing;
        switch (def.kind) {
            case 'counter':
                return new prom_client_1.default.Counter({
                    name: promName,
                    help: def.help,
                    labelNames: def.labels,
                });
            case 'gauge':
                return new prom_client_1.default.Gauge({
                    name: promName,
                    help: def.help,
                    labelNames: def.labels,
                });
            case 'histogram':
                return new prom_client_1.default.Histogram({
                    name: promName,
                    help: def.help,
                    labelNames: def.labels,
                    buckets: expression_observability_constants_1.DURATION_BUCKETS_SECONDS,
                });
            default: {
                const _exhaustive = def.kind;
                throw new n8n_workflow_1.UnexpectedError(`Unknown metric kind: ${String(_exhaustive)}`);
            }
        }
    }
    getMetricDef(name, kind) {
        const def = this.metricDefs.get(name);
        if (def?.kind === kind)
            return def;
        this.scopedLogger.warn('Emitted unknown expression metric', { name });
        return undefined;
    }
    counter(name, value, tags) {
        const def = this.getMetricDef(name, 'counter');
        if (!def)
            return;
        const counter = this.getOrRegisterMetric(def);
        if (tags)
            counter.inc(tags, value);
        else
            counter.inc(value);
    }
    gauge(name, value, tags) {
        const def = this.getMetricDef(name, 'gauge');
        if (!def)
            return;
        const gauge = this.getOrRegisterMetric(def);
        if (tags)
            gauge.set(tags, value);
        else
            gauge.set(value);
    }
    histogram(name, value, tags) {
        const def = this.getMetricDef(name, 'histogram');
        if (!def)
            return;
        const histogram = this.getOrRegisterMetric(def);
        if (tags)
            histogram.observe(tags, value);
        else
            histogram.observe(value);
        if (name === expression_runtime_1.EXPRESSION_METRICS.evaluationDuration.name)
            this.maybeRecordSpan(value, tags);
    }
    maybeRecordSpan(durationSeconds, tags) {
        const { tracesEnabled, slowEvaluationThresholdMs } = this.config;
        if (!tracesEnabled)
            return;
        const decision = this.tailSample(durationSeconds, tags);
        if (decision === 'drop')
            return;
        const slowThresholdSeconds = slowEvaluationThresholdMs / 1000;
        const outcome = tags?.status === 'error'
            ? 'error'
            : durationSeconds > slowThresholdSeconds
                ? 'slow'
                : 'healthy';
        const tracer = this.otelService.getTracer(expression_observability_constants_1.TRACER_NAME);
        const errorType = tags?.type && tags.type !== 'none' ? tags.type : undefined;
        const span = tracer.startSpan('expression.evaluate', {
            attributes: {
                [expression_observability_constants_1.ATTRIBUTE.EXPRESSION_ENGINE]: this.config.engine,
                [expression_observability_constants_1.ATTRIBUTE.EXPRESSION_DURATION_SECONDS]: durationSeconds,
                [expression_observability_constants_1.ATTRIBUTE.EXPRESSION_OUTCOME]: outcome,
                ...(errorType ? { [expression_observability_constants_1.ATTRIBUTE.EXPRESSION_ERROR_TYPE]: errorType } : {}),
            },
        });
        if (tags?.status === 'error')
            span.setStatus({ code: api_1.SpanStatusCode.ERROR });
        span.end();
    }
    tailSample(durationSeconds, tags) {
        if (tags?.status === 'error')
            return 'keep';
        const { slowEvaluationThresholdMs, tracesSampleRate } = this.config;
        if (durationSeconds > slowEvaluationThresholdMs / 1000)
            return 'keep';
        if (tracesSampleRate > 0 && Math.random() < tracesSampleRate)
            return 'keep';
        return 'drop';
    }
    startSpan(name, attributes) {
        if (!this.config.tracesEnabled)
            return expression_runtime_1.NoOpProvider.traces.startSpan(name, attributes);
        const tracer = this.otelService.getTracer(expression_observability_constants_1.TRACER_NAME);
        const otelSpan = tracer.startSpan(name, {
            attributes: (0, expression_observability_formatters_1.normalizeAttributes)(attributes),
        });
        return {
            setStatus: (status) => otelSpan.setStatus({
                code: status === 'ok' ? api_1.SpanStatusCode.OK : api_1.SpanStatusCode.ERROR,
            }),
            setAttribute: (key, value) => {
                const normalized = (0, expression_observability_formatters_1.normalizeAttributeValue)(value);
                if (normalized !== undefined)
                    otelSpan.setAttribute(key, normalized);
            },
            recordException: (error) => otelSpan.recordException(error),
            end: () => otelSpan.end(),
        };
    }
};
exports.ExpressionObservabilityProvider = ExpressionObservabilityProvider;
exports.ExpressionObservabilityProvider = ExpressionObservabilityProvider = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.ExpressionEngineConfig, backend_common_1.Logger, config_1.GlobalConfig, otel_service_1.OtelService])
], ExpressionObservabilityProvider);
//# sourceMappingURL=expression-observability.provider.js.map