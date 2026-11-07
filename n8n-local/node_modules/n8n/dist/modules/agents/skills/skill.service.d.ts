import { type AgentSkill } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { ProjectScopeService } from '@n8n/backend-services';
import { TransactionRunner, type OperationContext, type User } from '@n8n/db';
import { AgentUpdateBroadcaster } from '../agent-update-broadcaster';
import type { SkillFrontmatter } from '../entities/skill-version.entity';
import type { Skill, SkillSource } from '../entities/skill.entity';
import { AgentRepository } from '../repositories/agent.repository';
import { SkillRepository, type ResolvedSkillRow, type SkillTarget } from '../repositories/skill.repository';
import { type SkillContent } from './skill-content-hash';
export type SkillRef = {
    id: string;
    versionId?: string;
};
export type SkillUpdate = Partial<AgentSkill> & {
    baseSkillHash: string;
};
export type SkillSaveResult = {
    versionId: string;
    version: number;
    created: boolean;
    skill: AgentSkill;
    followingAgentIds: string[];
};
export declare function toSkillContent(skill: AgentSkill, frontmatter?: SkillFrontmatter | null): SkillContent;
export declare function toAgentSkill(row: ResolvedSkillRow): AgentSkill;
export declare function withTrimmedName<T extends {
    name: string;
}>(skill: T): T;
export type SkillMoveOptions = {
    nameAfterMove?: string;
    checkedSource?: SkillTarget;
};
export declare class SkillService {
    private readonly logger;
    private readonly skillRepository;
    private readonly agentRepository;
    private readonly txRunner;
    private readonly agentUpdateBroadcaster;
    private readonly projectScopeService;
    constructor(logger: Logger, skillRepository: SkillRepository, agentRepository: AgentRepository, txRunner: TransactionRunner, agentUpdateBroadcaster: AgentUpdateBroadcaster, projectScopeService: ProjectScopeService);
    resolveForAgentDraft(refs: SkillRef[], ctx?: OperationContext): Promise<Record<string, AgentSkill>>;
    resolvePinned(agentVersionId: string, ctx?: OperationContext): Promise<Record<string, AgentSkill>>;
    private resolveRows;
    private latestNames;
    private runtimeNames;
    create(input: {
        target: SkillTarget;
        skill: AgentSkill;
        source: SkillSource;
        createdById: string;
        checkNameTaken?: boolean;
    }, ctx?: OperationContext): Promise<string>;
    save(skillId: string, update: SkillUpdate, userId: string, ctx?: OperationContext, pushRef?: string): Promise<SkillSaveResult>;
    refreshFollowingAgents(agentIds: string[], excludePushRef?: string): Promise<void>;
    freeName(requested: string, target: SkillTarget, ctx?: OperationContext): Promise<string>;
    private assertNameFree;
    private assertRenameKeepsNamesApart;
    snapshotForPublish(refs: SkillRef[], ctx: OperationContext): Promise<{
        skills: Record<string, AgentSkill>;
        versionByRef: Map<string, string>;
    }>;
    pinForPublish(agentVersionId: string, versionByRef: Map<string, string>, ctx: OperationContext): Promise<void>;
    restoreFromVersion(agentVersionId: string, refs: SkillRef[], ctx?: OperationContext): Promise<SkillRef[]>;
    isAttachable(skill: Pick<Skill, 'projectId' | 'agentId'>, agent: {
        id: string;
        projectId: string | null;
    }): boolean;
    checkRefs(agent: {
        id: string;
        projectId: string | null;
    }, refs: SkillRef[], ctx?: OperationContext): Promise<SkillRef[]>;
    changeTarget(skillId: string, target: SkillTarget, keepAgentId: string | undefined, ctx?: OperationContext, { nameAfterMove, checkedSource }?: SkillMoveOptions): Promise<void>;
    projectOf(skill: Pick<Skill, 'projectId' | 'agentId'>, ctx?: OperationContext): Promise<string | null>;
    canAccess(user: User, skill: Pick<Skill, 'projectId' | 'agentId'>, operation: 'read' | 'update' | 'delete'): Promise<boolean>;
    accessCheck(user: User, operation: 'read' | 'update' | 'delete'): Promise<(skill: Pick<Skill, 'agentId'>, projectId: string | null) => boolean>;
    private canAccessInstanceSkill;
    canEdit(user: User, skill: Pick<Skill, 'projectId' | 'agentId'>): Promise<boolean>;
    assertCanMove(user: User, skillId: string): Promise<SkillTarget>;
    assertCanEdit(user: User, skillIds: string[], ctx?: OperationContext): Promise<void>;
    deleteSkill(skillId: string, agentProjectIds?: string[] | 'all', ctx?: OperationContext): Promise<void>;
}
