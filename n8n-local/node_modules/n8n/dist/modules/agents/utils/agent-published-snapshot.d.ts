import type { AgentSkill } from '@n8n/api-types';
import type { OperationContext } from '@n8n/db';
import type { AgentSkillRefsService } from '../agent-skill-refs.service';
import type { Agent, ProjectAgent } from '../entities/agent.entity';
import type { AgentSkillRefs } from '../json-config/agent-document';
export interface AgentRunSource<T extends Agent = ProjectAgent> {
    agent: T;
    skillRefs: AgentSkillRefs;
    skills: Record<string, AgentSkill>;
}
export declare function resolveAgentRunSource<T extends Agent>(agentEntity: T, usePublishedVersion: boolean, agentSkillRefs: AgentSkillRefsService, ctx: OperationContext): Promise<AgentRunSource<T>>;
