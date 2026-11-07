import { type ResolvedSubAgentSource, type SubAgentSource } from '@n8n/api-types';
import { AgentSkillRefsService } from '../agent-skill-refs.service';
import { AgentHistoryRepository } from '../repositories/agent-history.repository';
import { AgentRepository } from '../repositories/agent.repository';
import { type AgentRuntimeAssets } from '../utils/agent-runtime-assets';
export interface ResolveSubAgentSourceContext {
    projectId: string;
    usePublishedVersion?: boolean;
    runtimeSnapshot?: string;
}
export interface ResolvedSubAgentRuntimeSource extends AgentRuntimeAssets {
    source: ResolvedSubAgentSource;
}
export declare class SubAgentSourceResolver {
    private readonly agentRepository;
    private readonly agentHistoryRepository;
    private readonly agentSkillRefs;
    constructor(agentRepository: AgentRepository, agentHistoryRepository: AgentHistoryRepository, agentSkillRefs: AgentSkillRefsService);
    resolveForRuntime(source: SubAgentSource, context: ResolveSubAgentSourceContext): Promise<ResolvedSubAgentRuntimeSource>;
    private toRunnableConfig;
}
