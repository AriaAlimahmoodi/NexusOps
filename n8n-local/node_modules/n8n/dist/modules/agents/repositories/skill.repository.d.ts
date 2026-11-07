import { BaseRepository, Project, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import type { SkillUsage } from '@n8n/api-types';
import { AgentHistory } from '../entities/agent-history.entity';
import { Agent, type ProjectScoped } from '../entities/agent.entity';
import { SkillFile } from '../entities/skill-file.entity';
import { SkillVersion } from '../entities/skill-version.entity';
import { Skill, type SkillSource } from '../entities/skill.entity';
import { type SkillContent } from '../skills/skill-content-hash';
export type SkillTarget = {
    projectId: string | null;
    agentId: string | null;
};
export type ResolvedSkillRow = {
    skill: Skill;
    version: SkillVersion;
    files: SkillFile[];
};
export type SkillDependencyRef = {
    skillId: string;
    versionId?: string | null;
};
export type SkillVisibility = {
    projectIds: string[] | 'all';
};
export type SkillListFilter = {
    scope?: 'project' | 'agent' | 'instance';
    projectId?: string;
    attachableTo?: {
        agentId: string;
        projectId: string;
    };
    search?: string;
    skip: number;
    take?: number;
};
export type { SkillUsage } from '@n8n/api-types';
export type SkillSummary = {
    name: string;
    description: string;
    version: number;
};
export declare class SkillRepository extends BaseRepository<Skill> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    findVisiblePage(visibility: SkillVisibility, filter: SkillListFilter, ctx?: OperationContext): Promise<{
        skills: Skill[];
        count: number;
    }>;
    findByIds(ids: string[], ctx?: OperationContext): Promise<Skill[]>;
    findLatestSaved(skillIds: string[], ctx?: OperationContext): Promise<Map<string, ResolvedSkillRow>>;
    findLatestSummaries(skillIds: string[], ctx?: OperationContext): Promise<Map<string, SkillSummary>>;
    findLatestNamesInTarget(target: SkillTarget, ctx?: OperationContext): Promise<Array<{
        skillId: string;
        name: string;
    }>>;
    findVersionsByIds(versionIds: string[], ctx?: OperationContext): Promise<Map<string, ResolvedSkillRow>>;
    findPinned(agentVersionId: string, ctx?: OperationContext): Promise<Map<string, ResolvedSkillRow>>;
    findPinnedSkillIds(agentVersionId: string, ctx?: OperationContext): Promise<string[]>;
    nextVersionNumber(skillId: string, ctx?: OperationContext): Promise<number>;
    createSkill(skill: {
        id: string;
        target: SkillTarget;
        source: SkillSource;
        createdById: string | null;
    }, content: SkillContent, ctx?: OperationContext): Promise<string>;
    insertSavedVersion(skillId: string, version: number, content: SkillContent, createdById: string | null, ctx?: OperationContext): Promise<string>;
    insertPins(pins: Array<{
        agentVersionId: string;
        skillId: string;
        skillVersionId: string;
    }>, ctx?: OperationContext): Promise<void>;
    replaceDependencies(agentId: string, refs: SkillDependencyRef[], ctx?: OperationContext): Promise<void>;
    findFollowingAgents(skillId: string, ctx?: OperationContext): Promise<Array<Pick<Agent, 'id' | 'name'>>>;
    findDependencies(agentIds: string[], ctx?: OperationContext): Promise<Map<string, Array<{
        skillId: string;
        versionId: string | null;
    }>>>;
    findFollowingAgentIds(skillIds: string[], ctx?: OperationContext): Promise<string[]>;
    findUsage(skillId: string, projectIds?: string[] | 'all', ctx?: OperationContext): Promise<SkillUsage>;
    hasHubState(agentId: string, ctx?: OperationContext): Promise<boolean>;
    findUnpinnedVersions(agentId: string, ctx?: OperationContext): Promise<Array<Pick<AgentHistory, 'versionId' | 'schema' | 'skills'>>>;
    findAgentSkillVersions(agentId: string, ctx?: OperationContext): Promise<Array<Pick<SkillVersion, 'id' | 'skillId' | 'version' | 'contentHash'>>>;
    findAgentIdsWithDraftRefs(ctx?: OperationContext): Promise<string[]>;
    findDraftContentHashes(agentIds: string[], ctx?: OperationContext): Promise<Map<string, string[]>>;
    existsById(skillId: string, ctx?: OperationContext): Promise<boolean>;
    findUsingAgentIds(skillId: string, ctx?: OperationContext): Promise<string[]>;
    updateTarget(skillId: string, target: SkillTarget, ctx?: OperationContext): Promise<void>;
    countUsingAgents(skillIds: string[], ctx?: OperationContext): Promise<Map<string, number>>;
    findProjects(projectIds: string[], ctx?: OperationContext): Promise<Map<string, Pick<Project, 'name' | 'type'>>>;
    findAgents(agentIds: string[], ctx?: OperationContext): Promise<Map<string, ProjectScoped<Pick<Agent, 'name' | 'projectId'>>>>;
    deleteSkill(skillId: string, ctx?: OperationContext): Promise<void>;
    lockForEdit(skillIds: string[], ctx?: OperationContext): Promise<void>;
    lockForPublish(skillIds: string[], ctx?: OperationContext): Promise<void>;
    private lock;
    private findActivePinVersions;
    private resolveBySkill;
    private resolve;
}
