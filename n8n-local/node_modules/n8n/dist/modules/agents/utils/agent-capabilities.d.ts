import { type AgentIntegrationConfig, type AgentJsonConfig } from '@n8n/api-types';
export type AgentCapabilityCounts = {
    tool: number;
    skill: number;
    subAgent: number;
    mcpServer: number;
    vectorStore: number;
    task: number;
    channel: number;
};
export declare function countAgentCapabilities(config: AgentJsonConfig | null, integrations?: AgentIntegrationConfig[]): AgentCapabilityCounts;
export declare function totalAgentCapabilities(counts: AgentCapabilityCounts): number;
export declare function configuredCapabilityKinds(counts: AgentCapabilityCounts): Array<keyof AgentCapabilityCounts>;
export declare function capabilityCountTelemetryProperties(counts: AgentCapabilityCounts): {
    readonly capability_kinds: (keyof AgentCapabilityCounts)[];
    readonly capability_count: number;
    readonly tool_count: number;
    readonly skill_count: number;
    readonly sub_agent_count: number;
    readonly mcp_server_count: number;
    readonly vector_store_count: number;
    readonly task_count: number;
    readonly trigger_count: number;
};
export declare function isUnconfiguredAgent(schema: AgentJsonConfig | null, integrations: AgentIntegrationConfig[]): boolean;
