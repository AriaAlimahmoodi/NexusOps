import type { AgentExecutionCounter } from '@n8n/agents';
import type { AgentRunTelemetryType } from '../../../interfaces';
import type { Telemetry } from '../../../telemetry';
export declare function createAgentExecutionCounter(telemetry: Telemetry, { agentId, userId, runType, source, }: {
    agentId: string;
    userId?: string;
    runType: AgentRunTelemetryType;
    source?: string;
}): AgentExecutionCounter;
