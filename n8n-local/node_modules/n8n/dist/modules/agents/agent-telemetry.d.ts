import type { AgentIntegrationConfig, AgentJsonConfig } from '@n8n/api-types';
import type { IAgentConfigurationTelemetryProperties } from '../../interfaces';
import type { MessageRecord } from './execution-recorder';
import type { AgentRunSource } from './utils/agent-published-snapshot';
export declare function buildAgentTurnMetrics(record: MessageRecord): {
    latency_ms: number;
    cost: number;
    token_count: number;
    tool_call_count: number;
};
export declare function buildAgentCapabilityTelemetryProperties(config: AgentJsonConfig | null, integrations: AgentIntegrationConfig[]): {
    capability_kinds: (keyof import("./utils/agent-capabilities").AgentCapabilityCounts)[];
    capability_count: number;
    tool_count: number;
    skill_count: number;
    sub_agent_count: number;
    mcp_server_count: number;
    vector_store_count: number;
    task_count: number;
    trigger_count: number;
    model: string | null;
    tool_types: string[];
};
export declare function buildAgentConfigurationTelemetry({ agent, skillRefs, }: AgentRunSource): IAgentConfigurationTelemetryProperties;
export declare function buildAgentConfigurationTelemetryFromConfig(config: AgentJsonConfig | null, integrations?: AgentJsonConfig['integrations']): IAgentConfigurationTelemetryProperties;
