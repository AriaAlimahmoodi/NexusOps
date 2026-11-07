import type { InstanceAiTraceContext, ModelConfig } from '@n8n/instance-ai';
export type InstanceAiObservabilityContext = {
    threadId: string;
    runId?: string;
    projectId?: string;
    tracing?: InstanceAiTraceContext;
    agentId?: string;
    userId?: string;
    messageGroupId?: string;
    messageId?: string;
    taskId?: string;
    role?: string;
};
export declare function buildInstanceAiObservabilityContext(context: InstanceAiObservabilityContext): Record<string, string>;
export declare function runMetricsModelLabel(modelId: ModelConfig | undefined): string;
