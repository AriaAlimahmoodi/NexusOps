import type { Agent } from '../entities/agent.entity';
import type { AgentRepository } from '../repositories/agent.repository';
export type SubAgentConfigRef = {
    agentId: string;
    useWhen?: string;
    enabled?: boolean;
};
export type ResolvedSubAgentRef = SubAgentConfigRef & {
    agent: Agent | null;
};
export declare function resolveUniqueSubAgents({ refs, projectId, agentRepository, }: {
    refs: SubAgentConfigRef[];
    projectId: string;
    agentRepository: Pick<AgentRepository, 'findByIdAndProjectId'>;
}): Promise<ResolvedSubAgentRef[]>;
