"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionIdentitySpanProcessor = void 0;
exports.buildExecutionIdentity = buildExecutionIdentity;
exports.toExecutionIdentity = toExecutionIdentity;
exports.withExecutionIdentity = withExecutionIdentity;
const api_1 = require("@opentelemetry/api");
const is_record_1 = require("@n8n/utils/is-record");
const otel_constants_1 = require("./otel.constants");
const IDENTITY_KEY = (0, api_1.createContextKey)('n8n.execution_identity');
function buildExecutionIdentity(source) {
    return {
        [otel_constants_1.ATTR.EXECUTION_ID]: source.executionId,
        [otel_constants_1.ATTR.WORKFLOW_ID]: source.workflowId,
        ...(source.workflowName && { [otel_constants_1.ATTR.WORKFLOW_NAME]: source.workflowName }),
        ...(source.projectId && { [otel_constants_1.ATTR.PROJECT_ID]: source.projectId }),
        ...(source.projectName && { [otel_constants_1.ATTR.PROJECT_NAME]: source.projectName }),
    };
}
function toExecutionIdentity(value) {
    return isExecutionIdentity(value) ? value : undefined;
}
function withExecutionIdentity(ctx, identity) {
    return ctx.setValue(IDENTITY_KEY, identity);
}
class ExecutionIdentitySpanProcessor {
    onStart(span, parentContext) {
        const identity = toExecutionIdentity(parentContext.getValue(IDENTITY_KEY));
        if (identity)
            span.setAttributes(identity);
    }
    onEnd(_span) { }
    async forceFlush() { }
    async shutdown() { }
}
exports.ExecutionIdentitySpanProcessor = ExecutionIdentitySpanProcessor;
function isExecutionIdentity(value) {
    return ((0, is_record_1.isRecord)(value) &&
        typeof value[otel_constants_1.ATTR.EXECUTION_ID] === 'string' &&
        typeof value[otel_constants_1.ATTR.WORKFLOW_ID] === 'string' &&
        Object.values(value).every((entry) => typeof entry === 'string'));
}
//# sourceMappingURL=execution-identity.js.map