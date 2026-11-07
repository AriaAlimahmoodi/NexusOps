"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILT_IN_ATTRIBUTE_KEYS = exports.ATTR = exports.OTEL_TEST_SPAN_NAME = exports.DEFAULT_CUSTOM_ATTRIBUTE_PREFIXES = exports.CUSTOM_ATTRIBUTE_PREFIXES_ENV_VAR = exports.OTEL_ENV_VARS = exports.OTLP_PROTOCOLS = void 0;
const api_types_1 = require("@n8n/api-types");
Object.defineProperty(exports, "OTLP_PROTOCOLS", { enumerable: true, get: function () { return api_types_1.OTLP_PROTOCOLS; } });
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
exports.OTEL_ENV_VARS = {
    enabled: 'N8N_OTEL_ENABLED',
    exporterProtocol: 'N8N_OTEL_EXPORTER_OTLP_PROTOCOL',
    exporterEndpoint: 'N8N_OTEL_EXPORTER_OTLP_ENDPOINT',
    exporterTracingPath: 'N8N_OTEL_EXPORTER_OTLP_TRACING_PATH',
    exporterHeaders: 'N8N_OTEL_EXPORTER_OTLP_HEADERS',
    exporterServiceName: 'N8N_OTEL_EXPORTER_SERVICE_NAME',
    tracesSampleRate: 'N8N_OTEL_TRACES_SAMPLE_RATE',
    startupConnectivityTimeoutMs: 'N8N_OTEL_STARTUP_CONNECTIVITY_TIMEOUT_MS',
    includeNodeSpans: 'N8N_OTEL_TRACES_INCLUDE_NODE_SPANS',
    emitWorkflowStartSpan: 'N8N_OTEL_TRACES_EMIT_WORKFLOW_START_SPAN',
    emitNodeStartSpan: 'N8N_OTEL_TRACES_EMIT_NODE_START_SPAN',
    injectOutbound: 'N8N_OTEL_TRACES_INJECT_OUTBOUND',
    productionExecutionsOnly: 'N8N_OTEL_TRACES_PRODUCTION_ONLY',
};
exports.CUSTOM_ATTRIBUTE_PREFIXES_ENV_VAR = 'N8N_OTEL_TRACES_CUSTOM_ATTRIBUTE_PREFIXES';
exports.DEFAULT_CUSTOM_ATTRIBUTE_PREFIXES = {
    project: 'n8n.project.custom.',
    workflow: 'n8n.workflow.custom.',
    node: 'n8n.node.custom.',
};
exports.OTEL_TEST_SPAN_NAME = 'n8n.test_trace';
exports.ATTR = {
    OTEL_SERVICE_NAME: semantic_conventions_1.ATTR_SERVICE_NAME,
    OTEL_SERVICE_VERSION: semantic_conventions_1.ATTR_SERVICE_VERSION,
    INSTANCE_ID: 'n8n.instance.id',
    INSTANCE_ROLE: 'n8n.instance.role',
    IS_TEST_TRACE: 'n8n.test',
    PROJECT_ID: 'n8n.project.id',
    PROJECT_NAME: 'n8n.project.name',
    WORKFLOW_ID: 'n8n.workflow.id',
    WORKFLOW_VERSION_ID: 'n8n.workflow.version_id',
    WORKFLOW_NAME: 'n8n.workflow.name',
    WORKFLOW_NODE_COUNT: 'n8n.workflow.node_count',
    EXECUTION_ID: 'n8n.execution.id',
    EXECUTION_MODE: 'n8n.execution.mode',
    EXECUTION_STATUS: 'n8n.execution.status',
    EXECUTION_IS_RETRY: 'n8n.execution.is_retry',
    EXECUTION_RETRY_OF: 'n8n.execution.retry_of',
    EXECUTION_ERROR_TYPE: 'n8n.execution.error_type',
    EXECUTION_CRASH_DETECTOR: 'n8n.execution.crash.detector',
    EXECUTION_RECONSTRUCTED: 'n8n.execution.reconstructed',
    NODE_ID: 'n8n.node.id',
    NODE_NAME: 'n8n.node.name',
    NODE_TYPE: 'n8n.node.type',
    NODE_TYPE_VERSION: 'n8n.node.type_version',
    NODE_ITEMS_INPUT: 'n8n.node.items.input',
    NODE_ITEMS_OUTPUT: 'n8n.node.items.output',
    NODE_TERMINATION_REASON: 'n8n.node.termination_reason',
    CONTINUATION_REASON: 'n8n.continuation.reason',
};
exports.BUILT_IN_ATTRIBUTE_KEYS = new Set(Object.values(exports.ATTR));
//# sourceMappingURL=otel.constants.js.map