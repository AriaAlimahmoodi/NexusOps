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
var OtelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtelService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const api_1 = require("@opentelemetry/api");
const context_async_hooks_1 = require("@opentelemetry/context-async-hooks");
const core_1 = require("@opentelemetry/core");
const exporter_trace_otlp_proto_1 = require("@opentelemetry/exporter-trace-otlp-proto");
const resources_1 = require("@opentelemetry/resources");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const execution_identity_1 = require("./execution-identity");
const otel_settings_service_1 = require("./otel-settings.service");
const otel_constants_1 = require("./otel.constants");
const constants_1 = require("../../constants");
const stripEmptyResolutionNote = (message) => message.replace(/\s*Resolution note:\s*$/, '');
let noopTracerProvider;
let OtelService = OtelService_1 = class OtelService {
    constructor(otelSettingsService, instanceSettings, logger, outboundHttp) {
        this.otelSettingsService = otelSettingsService;
        this.instanceSettings = instanceSettings;
        this.logger = logger;
        this.outboundHttp = outboundHttp;
        this.ownsGlobalApi = false;
        this.hasLoggedForeignGlobalApiOwner = false;
    }
    async init() {
        const settings = await this.otelSettingsService.loadSettings();
        await this.start(settings);
    }
    async restart() {
        await this.shutdown();
        const settings = await this.otelSettingsService.loadSettings();
        await this.start(settings);
    }
    getTracer(name) {
        if (this.provider)
            return this.provider.getTracer(name);
        noopTracerProvider ??= new sdk_trace_base_1.BasicTracerProvider({ sampler: new sdk_trace_base_1.AlwaysOffSampler() });
        return noopTracerProvider.getTracer(name);
    }
    async sendTestTrace(connection) {
        let provider;
        try {
            const exporter = await this.createTraceExporter(connection, connection.startupConnectivityTimeoutMs);
            try {
                return await new Promise((resolve) => {
                    const processor = {
                        onStart: () => { },
                        onEnd: (span) => exporter.export([span], (result) => resolve(result.error
                            ? { success: false, error: stripEmptyResolutionNote(result.error.message) }
                            : { success: true })),
                        forceFlush: async () => { },
                        shutdown: async () => { },
                    };
                    provider = new sdk_trace_base_1.BasicTracerProvider({
                        resource: (0, resources_1.resourceFromAttributes)({
                            [otel_constants_1.ATTR.OTEL_SERVICE_NAME]: connection.exporterServiceName,
                            [otel_constants_1.ATTR.OTEL_SERVICE_VERSION]: constants_1.N8N_VERSION,
                            [otel_constants_1.ATTR.INSTANCE_ID]: this.instanceSettings.instanceId,
                            [otel_constants_1.ATTR.INSTANCE_ROLE]: this.instanceSettings.instanceType,
                        }),
                        sampler: new sdk_trace_node_1.TraceIdRatioBasedSampler(1),
                        spanProcessors: [processor],
                    });
                    const span = provider
                        .getTracer('n8n-otel-test')
                        .startSpan(otel_constants_1.OTEL_TEST_SPAN_NAME, { attributes: { [otel_constants_1.ATTR.IS_TEST_TRACE]: true } });
                    span.end();
                });
            }
            finally {
                await provider?.shutdown().catch(() => { });
                await exporter.shutdown().catch(() => { });
            }
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    async start(settings) {
        if (!settings.enabled)
            return;
        this.configureDiagnosticsLogger();
        let provider;
        try {
            provider = await this.startProvider(settings);
        }
        catch (error) {
            this.logger.error('Failed to start OpenTelemetry tracing, so tracing stays off', {
                error: error instanceof Error ? error.message : String(error),
            });
            await this.shutdown();
            return;
        }
        void this.checkEndpointReachability(settings, provider);
    }
    async shutdown() {
        const provider = this.provider;
        this.provider = undefined;
        try {
            await provider?.shutdown();
        }
        catch (error) {
            this.logger.warn('Failed to cleanly shut down OpenTelemetry tracer provider (exporter flush may have failed)', { error: error instanceof Error ? error.message : String(error) });
        }
    }
    async startProvider(settings) {
        const traceExporter = await this.createTraceExporter(settings);
        this.provider = new sdk_trace_node_1.NodeTracerProvider({
            resource: this.buildResource(settings.exporterServiceName),
            sampler: new sdk_trace_node_1.TraceIdRatioBasedSampler(settings.tracesSampleRate),
            spanProcessors: [new execution_identity_1.ExecutionIdentitySpanProcessor(), new sdk_trace_base_1.BatchSpanProcessor(traceExporter)],
        });
        this.registerGlobalApi(this.provider);
        return this.provider;
    }
    buildResource(serviceName) {
        return (0, resources_1.resourceFromAttributes)({
            [otel_constants_1.ATTR.OTEL_SERVICE_NAME]: serviceName,
            [otel_constants_1.ATTR.OTEL_SERVICE_VERSION]: constants_1.N8N_VERSION,
            [otel_constants_1.ATTR.INSTANCE_ID]: this.instanceSettings.instanceId,
            [otel_constants_1.ATTR.INSTANCE_ROLE]: this.instanceSettings.instanceType,
        }).merge((0, resources_1.detectResources)({ detectors: [resources_1.envDetector, resources_1.processDetector, resources_1.hostDetector] }));
    }
    registerGlobalApi(provider) {
        if (this.ownsGlobalApi) {
            api_1.trace.disable();
            this.ownsGlobalApi = api_1.trace.setGlobalTracerProvider(provider);
            return;
        }
        this.ownsGlobalApi = api_1.trace.setGlobalTracerProvider(provider);
        if (!this.ownsGlobalApi) {
            this.logForeignGlobalApiOwner();
            return;
        }
        api_1.context.setGlobalContextManager(new context_async_hooks_1.AsyncLocalStorageContextManager().enable());
        api_1.propagation.setGlobalPropagator(new core_1.CompositePropagator({
            propagators: [new core_1.W3CTraceContextPropagator(), new core_1.W3CBaggagePropagator()],
        }));
    }
    logForeignGlobalApiOwner() {
        if (this.hasLoggedForeignGlobalApiOwner)
            return;
        this.hasLoggedForeignGlobalApiOwner = true;
        this.logger.info('Another library owns the global OpenTelemetry API, so n8n workflow tracing runs on its own tracer provider');
    }
    async createTraceExporter(connection, timeoutMillis) {
        if (connection.exporterProtocol === 'grpc') {
            return await this.createGrpcTraceExporter(connection, timeoutMillis);
        }
        return this.createHttpTraceExporter(connection, timeoutMillis);
    }
    createHttpTraceExporter(connection, timeoutMillis) {
        const headers = this.parseOtlpHeaders(connection.exporterHeaders);
        const url = this.resolveExporterUrl(connection);
        return new exporter_trace_otlp_proto_1.OTLPTraceExporter({ url, headers, timeoutMillis });
    }
    async createGrpcTraceExporter(connection, timeoutMillis) {
        const headers = this.parseOtlpHeaders(connection.exporterHeaders);
        const url = this.resolveExporterUrl(connection);
        const [{ OTLPTraceExporter: OTLPGrpcTraceExporter }, { Metadata }] = await Promise.all([
            import('@opentelemetry/exporter-trace-otlp-grpc'),
            import('@grpc/grpc-js'),
        ]);
        return new OTLPGrpcTraceExporter({
            url,
            metadata: this.toGrpcMetadata(headers, new Metadata()),
            timeoutMillis,
        });
    }
    resolveExporterUrl(connection) {
        const endpoint = connection.exporterEndpoint.replace(/^https?:\/\//i, (scheme) => scheme.toLowerCase());
        return connection.exporterProtocol === 'grpc'
            ? endpoint
            : this.buildOtlpTracesUrl(endpoint, connection.exporterTracingPath);
    }
    toGrpcMetadata(headers, metadata) {
        for (const [key, value] of Object.entries(headers)) {
            try {
                metadata.set(key.toLowerCase(), value);
            }
            catch (error) {
                this.logger.warn(`Skipping invalid OTEL exporter header "${key}": ${error instanceof Error ? error.message : String(error)}.`);
            }
        }
        return metadata;
    }
    parseOtlpHeaders(headersToSplit) {
        const headers = {};
        for (const pair of headersToSplit.split(',')) {
            const trimmedPair = pair.trim();
            if (!trimmedPair)
                continue;
            if (!trimmedPair.includes('=')) {
                this.logger.warn(`Skipping invalid OTEL exporter header "${trimmedPair}": missing "=" separator. Expected format: "key=value".`);
                continue;
            }
            const [key, ...rest] = trimmedPair.split('=');
            const trimmedKey = key.trim();
            if (!trimmedKey) {
                this.logger.warn(`Skipping invalid OTEL exporter header "${trimmedPair}": empty key. Expected format: "key=value".`);
                continue;
            }
            headers[trimmedKey] = rest.join('=').trim();
        }
        return headers;
    }
    configureDiagnosticsLogger() {
        if (OtelService_1.isDiagnosticsLoggerConfigured)
            return;
        const diagnosticsLogger = {
            error: (...args) => this.logger.error('OpenTelemetry diagnostics error', { args }),
            warn: (...args) => this.logger.warn('OpenTelemetry diagnostics warning', { args }),
            info: (...args) => this.logger.info('OpenTelemetry diagnostics info', { args }),
            debug: (...args) => this.logger.debug('OpenTelemetry diagnostics debug', { args }),
            verbose: (...args) => this.logger.debug('OpenTelemetry diagnostics verbose', { args }),
        };
        api_1.diag.setLogger(diagnosticsLogger, api_1.DiagLogLevel.WARN);
        OtelService_1.isDiagnosticsLoggerConfigured = true;
    }
    buildOtlpTracesUrl(endpoint, path) {
        const exporterEndpointWithoutTrailingSlash = endpoint.replace(/\/+$/, '');
        return `${exporterEndpointWithoutTrailingSlash}${path}`;
    }
    async checkEndpointReachability(settings, startedProvider) {
        const url = this.resolveExporterUrl(settings);
        const timeoutMs = settings.startupConnectivityTimeoutMs;
        try {
            if (settings.exporterProtocol === 'grpc') {
                await this.probeGrpcEndpoint(url, timeoutMs);
            }
            else {
                await this.probeHttpEndpoint(url, timeoutMs);
            }
        }
        catch (error) {
            if (this.provider !== startedProvider)
                return;
            this.logger.error('Failed to connect to OpenTelemetry OTLP endpoint during startup', {
                endpoint: url,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async probeHttpEndpoint(url, timeoutMs) {
        await this.outboundHttp.transport({ useDefaultSsrfPolicy: 'unsafe' }).asCustomFetch()(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(timeoutMs),
        });
    }
    async probeGrpcEndpoint(endpoint, timeoutMs) {
        const { host, port, protocol } = new URL(endpoint);
        const { Client, credentials } = await import('@grpc/grpc-js');
        const client = new Client(host, protocol === 'https:' ? credentials.createSsl() : credentials.createInsecure(), {});
        try {
            await new Promise((resolve, reject) => {
                client.waitForReady(Date.now() + timeoutMs, (error) => {
                    if (!error)
                        return resolve();
                    const portHint = port
                        ? ''
                        : ' The endpoint has no port, so grpc-js dials its default 443, not 4317.';
                    const tlsHint = protocol === 'https:'
                        ? ' This check ignores the OTEL_EXPORTER_OTLP_CERTIFICATE, client key and client certificate variables, so a private-CA or mTLS collector can fail it and still receive spans.'
                        : '';
                    reject(new n8n_workflow_1.OperationalError(`gRPC channel to "${host}" was not ready after ${timeoutMs}ms (${error.message}): nothing listens there, or it does not speak gRPC, or its TLS mode does not match the "${protocol}" scheme.${portHint}${tlsHint}`));
                });
            });
        }
        finally {
            client.close();
        }
    }
};
exports.OtelService = OtelService;
OtelService.isDiagnosticsLoggerConfigured = false;
exports.OtelService = OtelService = OtelService_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [otel_settings_service_1.OtelSettingsService, n8n_core_1.InstanceSettings, backend_common_1.Logger, backend_network_1.OutboundHttp])
], OtelService);
//# sourceMappingURL=otel.service.js.map