import type { AgentSnapshot, BuiltTelemetry } from '@n8n/agents';
import { AgentsConfig } from '@n8n/config';
import { OtelService } from '../../modules/otel/otel.service';
interface AgentRunTracingMetadataBase {
    agentId: string;
    projectId: string;
    threadId: string;
    userId?: string;
    modelId?: string;
}
interface WorkflowAgentRunTracingMetadata extends AgentRunTracingMetadataBase {
    source: 'workflow';
    executionId?: string;
    workflowId?: string;
    nodeId?: string;
    hasParentContext?: boolean;
}
interface NonWorkflowAgentRunTracingMetadata extends AgentRunTracingMetadataBase {
    source: string;
}
export type AgentRunTracingMetadata = WorkflowAgentRunTracingMetadata | NonWorkflowAgentRunTracingMetadata;
export declare class AgentRunTracingService {
    private readonly agentsConfig;
    private readonly otelService;
    constructor(agentsConfig: AgentsConfig, otelService: OtelService);
    get enabled(): boolean;
    build(metadata: AgentRunTracingMetadata): Promise<BuiltTelemetry | undefined>;
}
export declare function modelIdFromSnapshot(model: AgentSnapshot['model']): string | undefined;
export {};
