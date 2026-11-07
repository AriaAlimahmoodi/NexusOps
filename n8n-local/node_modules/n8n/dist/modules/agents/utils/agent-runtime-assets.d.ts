import type { ToolDescriptor } from '@n8n/agents';
import type { AgentSkill } from '@n8n/api-types';
import type { AgentHistory } from '../entities/agent-history.entity';
import type { Agent } from '../entities/agent.entity';
export type AgentRuntimeAssets = ReturnType<typeof getAgentRuntimeAssets>;
export declare function getAgentRuntimeAssets(agent: Pick<Agent | AgentHistory, 'tools'>, skills: Record<string, AgentSkill>): {
    toolDescriptors: Record<string, ToolDescriptor>;
    toolCodeByName: Record<string, string>;
    skills: Record<string, AgentSkill>;
};
