import type { AgentIntegrationConfig, ListAgentsQueryDto } from '@n8n/api-types';
import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { Agent, type ProjectAgent, type ProjectScoped } from '../entities/agent.entity';
export interface AgentListResult {
    count: number;
    data: ProjectAgent[];
}
export type AgentSummary = ProjectScoped<Pick<Agent, 'id' | 'name' | 'projectId' | 'activeVersionId' | 'availableInMCP' | 'updatedAt'>>;
export declare function hasN8nChatChannel(integrations: Array<{
    type: string;
}> | undefined): boolean;
export type AgentIntegrationState = Pick<Agent, 'integrations' | 'versionId' | 'activeVersionId'>;
export type AgentSummaryFilters = {
    query?: string;
    publishedOnly?: boolean;
    excludeAgentId?: string;
    limit?: number;
};
export declare class AgentRepository extends BaseRepository<Agent> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    insertNew(agent: Agent, ctx?: OperationContext): Promise<void>;
    hasRevision(id: string, revision: number): Promise<boolean>;
    findByProjectId(projectId: string): Promise<ProjectAgent[]>;
    findForExport(agentIds: string[], projectIds: string[] | null, options: {
        includeActiveVersion: boolean;
    }): Promise<ProjectAgent[]>;
    findIdsInProjectsForExport(projectIds: string[]): Promise<string[]>;
    findExistingIds(agentIds: string[]): Promise<Set<string>>;
    findSummariesByProjectIds(projectIds: string[] | null, options?: AgentSummaryFilters): Promise<AgentSummary[]>;
    findByProjectIdsPaginated(projectIds: string[] | null, options: ListAgentsQueryDto, { withProject, usageCounts, }?: {
        withProject?: boolean;
        usageCounts?: Map<string, number>;
    }): Promise<AgentListResult>;
    findN8nChatListPaginated(reachableProjectIds: string[] | null, ownedProjectIds: string[], options: ListAgentsQueryDto, usageCounts?: Map<string, number>): Promise<AgentListResult>;
    private chatReachableQuery;
    findChatReachableIds(projectIds: string[] | null): Promise<string[]>;
    findChatReachableById(id: string, projectIds: string[] | null): Promise<ProjectAgent | null>;
    private applyFilters;
    private publishedN8nChatSql;
    private applySorting;
    private applyUsageSorting;
    findByIdAndProjectId(id: string, projectId: string): Promise<ProjectAgent | null>;
    isN8nChatPublished(id: string, projectId: string): Promise<boolean>;
    findById(id: string): Promise<ProjectAgent | null>;
    ensureInstanceAgent(id: string, name: string): Promise<void>;
    findDependencyIndexAgentIdsBatch(afterId: string | null, batchSize: number): Promise<Array<Pick<Agent, 'id'>>>;
    findSummariesByIds(ids: string[]): Promise<Array<ProjectScoped<Pick<Agent, 'id' | 'name' | 'projectId'>>>>;
    findByIdInProjects(id: string, projectIds: string[]): Promise<ProjectAgent | null>;
    existsByIdAndProjectId(id: string, projectId: string): Promise<boolean>;
    getProjectIdById(id: string): Promise<string | null>;
    findBudgetAlertTarget(id: string): Promise<ProjectScoped<Pick<Agent, 'name' | 'projectId'>> | null>;
    findByIdsAndProjectId(ids: string[], projectId: string): Promise<Array<Pick<Agent, 'id' | 'name' | 'activeVersionId'>>>;
    findMcpAvailabilityCandidates(where: {
        ids: string[];
    } | {
        projectIds: string[];
    } | {
        all: true;
    }): Promise<Array<ProjectScoped<Pick<Agent, 'id' | 'projectId' | 'availableInMCP'>>>>;
    setAvailableInMCP(agentIds: string[], availableInMCP: boolean): Promise<void>;
    claimSetupCompleted(id: string, completedAt: Date): Promise<boolean>;
    findIntegrationState(id: string): Promise<AgentIntegrationState | null>;
    updateIntegrations(id: string, integrations: AgentIntegrationConfig[], expected: Pick<Agent, 'revision' | 'versionId' | 'activeVersionId'>, versionId: string | null): Promise<boolean>;
    findPublished(): Promise<ProjectAgent[]>;
    findPublishedAgentIds(): Promise<string[]>;
    findActiveVersionId(agentId: string): Promise<string | null>;
    findPublishedIds(agentIds: string[]): Promise<Set<string>>;
    findByIntegrationCredentialAnyProject(type: string, credentialId: string, excludeAgentId: string): Promise<Array<Pick<Agent, 'id' | 'name' | 'integrations'>>>;
    findWithIntegrationType(type: string): Promise<Array<Pick<Agent, 'id' | 'integrations'>>>;
    findByIntegrationCredential(type: string, credentialId: string, projectId: string, excludeAgentId: string): Promise<ProjectAgent[]>;
    setActiveVersionFenced(id: string, expectedRevision: number, next: {
        activeVersionId: string | null;
        versionId: string;
    }, ctx?: OperationContext): Promise<boolean>;
    saveDraftFenced(agent: Agent, ctx?: OperationContext): Promise<boolean>;
    markDraftChangedIfInSync(agentIds: string[], ctx?: OperationContext): Promise<string[]>;
    findPageForSkillCopy(after: Pick<Agent, 'createdAt' | 'id'> | null, take: number, ctx?: OperationContext): Promise<Array<Pick<Agent, 'id' | 'createdAt'>>>;
    findForSkillCopy(agentId: string, ctx?: OperationContext): Promise<Pick<Agent, 'id' | 'schema' | 'skills'> | null>;
    lockForSkillCopy(agentId: string, ctx: OperationContext): Promise<void>;
    findProjectIdsByIds(ids: string[], ctx?: OperationContext): Promise<Array<ProjectScoped<Pick<Agent, 'id' | 'projectId'>>>>;
    updateDraftSkills(agent: Pick<Agent, 'id' | 'schema' | 'skills' | 'updatedAt'>, ctx: OperationContext): Promise<void>;
    updateDraftSchema(agent: Pick<Agent, 'id' | 'schema' | 'updatedAt'>, ctx: OperationContext): Promise<void>;
}
