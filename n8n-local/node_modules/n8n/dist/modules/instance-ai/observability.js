"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInstanceAiObservabilityContext = buildInstanceAiObservabilityContext;
exports.runMetricsModelLabel = runMetricsModelLabel;
const instance_ai_1 = require("@n8n/instance-ai");
function buildInstanceAiObservabilityContext(context) {
    return {
        source: 'instance-ai',
        threadId: context.threadId,
        ...(context.runId ? { runId: context.runId } : {}),
        ...(context.projectId ? { projectId: context.projectId } : {}),
        ...(context.tracing?.rootRun?.otelTraceId
            ? { traceId: context.tracing.rootRun.otelTraceId }
            : {}),
        ...(context.tracing?.rootRun?.traceId
            ? { langsmithTraceId: context.tracing.rootRun.traceId }
            : {}),
        ...(context.agentId ? { agentId: context.agentId } : {}),
        ...(context.userId ? { userId: context.userId } : {}),
        ...(context.messageGroupId ? { messageGroupId: context.messageGroupId } : {}),
        ...(context.messageId ? { messageId: context.messageId } : {}),
        ...(context.taskId ? { taskId: context.taskId } : {}),
        ...(context.role ? { role: context.role } : {}),
    };
}
function runMetricsModelLabel(modelId) {
    if (modelId === undefined || (0, instance_ai_1.isEndpointModelConfig)(modelId))
        return 'custom';
    return (0, instance_ai_1.modelConfigId)(modelId) ?? 'custom';
}
//# sourceMappingURL=observability.js.map