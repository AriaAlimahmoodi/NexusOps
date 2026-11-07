import type { DependenciesBatchResponse, DependencyCountsBatchResponse, DependencyResourceType, ResolvedDependency } from '@n8n/api-types';
import { CredentialsRepository, ProjectRelationRepository, WorkflowDependencyRepository, WorkflowRepository } from '@n8n/db';
import type { User } from '@n8n/db';
import { CredentialsFinderService, RoleService } from '@n8n/backend-services';
import { DataTableRepository } from '../../modules/data-table/data-table.repository';
import { WorkflowFinderService } from '../../workflows/workflow-finder.service';
import { AgentUsageProviderProxy } from './agent-usage-provider-proxy.service';
export interface NodeTypeUsage {
    workflowsInScope: number;
    nodeTypes?: Array<{
        nodeType: string;
        workflowCount: number;
    }>;
    workflows?: Array<{
        workflowId: string;
        name: string;
        updatedAt: Date;
    }>;
    truncated?: boolean;
}
export declare class WorkflowDependencyQueryService {
    private readonly dependencyRepository;
    private readonly credentialsRepository;
    private readonly workflowRepository;
    private readonly dataTableRepository;
    private readonly workflowFinderService;
    private readonly credentialsFinderService;
    private readonly projectRelationRepository;
    private readonly roleService;
    private readonly agentUsageProvider;
    constructor(dependencyRepository: WorkflowDependencyRepository, credentialsRepository: CredentialsRepository, workflowRepository: WorkflowRepository, dataTableRepository: DataTableRepository, workflowFinderService: WorkflowFinderService, credentialsFinderService: CredentialsFinderService, projectRelationRepository: ProjectRelationRepository, roleService: RoleService, agentUsageProvider: AgentUsageProviderProxy);
    getNodeTypeUsage(user: User, options?: {
        projectId?: string;
        nodeType?: string;
        limit?: number;
    }): Promise<NodeTypeUsage>;
    getDependencyCounts(resourceIds: string[], resourceType: DependencyResourceType, user: User): Promise<DependencyCountsBatchResponse>;
    getResourceDependencies(resourceIds: string[], resourceType: DependencyResourceType, user: User, options?: {
        listUnavailableCredentials?: boolean;
    }): Promise<DependenciesBatchResponse>;
    getFolderDependencies(projectId: string, folderId: string, user: User): Promise<ResolvedDependency[]>;
    private loadDepsForResources;
    private loadAgentDeps;
    private buildDepMaps;
    private buildEnrichedResult;
    private filterByAccess;
    private filterDataTableIdsByAccess;
    private getAccessibleAgentProjectIds;
}
