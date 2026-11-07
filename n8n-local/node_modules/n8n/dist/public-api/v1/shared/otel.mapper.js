"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toOtelSettingsResponse = toOtelSettingsResponse;
function toOtelSettingsResponse(config) {
    return {
        enabled: config.enabled,
        exporterProtocol: config.exporterProtocol,
        exporterEndpoint: config.exporterEndpoint,
        exporterTracingPath: config.exporterTracingPath,
        exporterServiceName: config.exporterServiceName,
        exporterHeaders: config.exporterHeaders,
        tracesSampleRate: config.tracesSampleRate,
        startupConnectivityTimeoutMs: config.startupConnectivityTimeoutMs,
        includeNodeSpans: config.includeNodeSpans,
        emitWorkflowStartSpan: config.emitWorkflowStartSpan,
        emitNodeStartSpan: config.emitNodeStartSpan,
        injectOutbound: config.injectOutbound,
        productionExecutionsOnly: config.productionExecutionsOnly,
    };
}
//# sourceMappingURL=otel.mapper.js.map