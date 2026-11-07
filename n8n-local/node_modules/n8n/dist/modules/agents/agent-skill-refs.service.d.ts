import type { AgentJsonSkillConfig, AgentSkill, AgentSkillAvailability, StoredAgentConfig } from '@n8n/api-types';
import type { OperationContext, User } from '@n8n/db';
import type { AgentHistory } from './entities/agent-history.entity';
import type { Agent } from './entities/agent.entity';
import { type AgentSkillRefs } from './json-config/agent-document';
import { AgentRepository } from './repositories/agent.repository';
import { SkillRepository } from './repositories/skill.repository';
import { SkillService, type SkillMoveOptions } from './skills/skill.service';
import { SkillsHubRollout } from './skills/skills-hub-rollout';
export type PublishSnapshot = {
    schema: StoredAgentConfig | null;
    skills: Record<string, AgentSkill> | null;
    pins: Map<string, string>;
};
export interface AgentSkillsSnapshot {
    skillRefs: AgentJsonSkillConfig[];
    skills: Record<string, AgentSkill>;
}
export declare class AgentSkillRefsService {
    private readonly skillRepository;
    private readonly skillService;
    private readonly agentRepository;
    private readonly rollout;
    constructor(skillRepository: SkillRepository, skillService: SkillService, agentRepository: AgentRepository, rollout: SkillsHubRollout);
    get usesSkillsHub(): boolean;
    refsForDraft(agent: Pick<Agent, 'id' | 'schema'>, ctx: OperationContext): Promise<AgentJsonSkillConfig[]>;
    refsForVersion(version: Pick<AgentHistory, 'versionId' | 'schema' | 'skills'>, ctx: OperationContext): Promise<AgentJsonSkillConfig[]>;
    readDraft(agent: Pick<Agent, 'id' | 'schema' | 'skills' | 'updatedAt'>, ctx: OperationContext): Promise<AgentSkillsSnapshot>;
    readVersion(version: Pick<AgentHistory, 'versionId' | 'schema' | 'skills'>, ctx: OperationContext): Promise<AgentSkillsSnapshot>;
    skillsForRefs(agent: Pick<Agent, 'skills'>, skillRefs: AgentSkillRefs, ctx: OperationContext): Promise<Record<string, AgentSkill>>;
    findOutdatedSkillIds(skillRefs: AgentJsonSkillConfig[], skills: Record<string, AgentSkill>, ctx: OperationContext): Promise<string[]>;
    effectiveDraftRefs(agent: Pick<Agent, 'id' | 'projectId' | 'schema' | 'skills' | 'updatedAt'>, refs: AgentJsonSkillConfig[], ctx: OperationContext): Promise<AgentJsonSkillConfig[]>;
    replaceDraftRefs(agent: Pick<Agent, 'id' | 'projectId' | 'schema' | 'skills' | 'updatedAt'>, refs: AgentSkillRefs, ctx: OperationContext): Promise<void>;
    restoreDraftRefs(agent: Pick<Agent, 'id' | 'schema' | 'skills' | 'updatedAt'>, version: Pick<AgentHistory, 'versionId' | 'skills'>, refs: AgentSkillRefs, ctx: OperationContext): Promise<void>;
    unpinDraftRef(agent: Pick<Agent, 'id' | 'schema'>, skillId: string, ctx: OperationContext): Promise<void>;
    createDraftRefs(agent: Pick<Agent, 'id' | 'projectId' | 'schema' | 'skills' | 'updatedAt'>, refs: AgentSkillRefs, bodies: Record<string, AgentSkill>, creator: User | null, ctx: OperationContext): Promise<AgentJsonSkillConfig[]>;
    createSkills(agent: Pick<Agent, 'id' | 'projectId' | 'schema' | 'skills' | 'updatedAt'>, skills: AgentSkill[], creatorId: string, availableTo: AgentSkillAvailability, ctx: OperationContext): Promise<string[]>;
    versionSnapshot(agent: Pick<Agent, 'id' | 'schema' | 'skills'>, ctx: OperationContext): Promise<PublishSnapshot>;
    pinVersion(agentVersionId: string, snapshot: PublishSnapshot, ctx: OperationContext): Promise<void>;
    availabilityOf(skillId: string, ctx: OperationContext): Promise<AgentSkillAvailability | undefined>;
    setAvailability(agent: Pick<Agent, 'id' | 'projectId'>, skillId: string, availableTo: AgentSkillAvailability, ctx: OperationContext, options?: SkillMoveOptions): Promise<void>;
    private writeLegacyDraft;
    private writeDependencies;
}
