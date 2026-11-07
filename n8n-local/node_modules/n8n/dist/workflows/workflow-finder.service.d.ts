import { RoleService } from '@n8n/backend-services';
import type { User, WorkflowEntity, PublishHistoryScope, OperationContext } from '@n8n/db';
import { SharedWorkflowRepository, FolderRepository, WorkflowRepository, RoleRepository } from '@n8n/db';
import { type AuthPrincipal, type Scope } from '@n8n/permissions';
import type { EntityManager } from '@n8n/typeorm';
export type FindWorkflowsForUserOptions = {
    filters?: {
        name?: string;
        active?: boolean;
        tagNames?: string[];
        folderId?: string;
        projectId?: string;
    };
    offset?: number;
    limit?: number;
    includePinnedData?: boolean;
    includeTags?: boolean;
    includeProjects?: boolean;
    includeActiveVersion?: boolean;
    includeParentFolder?: boolean;
};
export declare class WorkflowFinderService {
    private readonly sharedWorkflowRepository;
    private readonly folderRepository;
    private readonly roleService;
    private readonly workflowRepository;
    private readonly roleRepository;
    constructor(sharedWorkflowRepository: SharedWorkflowRepository, folderRepository: FolderRepository, roleService: RoleService, workflowRepository: WorkflowRepository, roleRepository: RoleRepository);
    findWorkflowForUser(workflowId: string, user: User, scopes: Scope[], options?: {
        includeTags?: boolean;
        includeParentFolder?: boolean;
        includeActiveVersion?: boolean;
        publishHistory?: PublishHistoryScope;
    } & ({
        em?: EntityManager;
        ctx?: never;
    } | {
        ctx?: OperationContext;
        em?: never;
    })): Promise<WorkflowEntity | null>;
    findWorkflowHeadForUser(workflowId: string, user: User, scopes: Scope[]): Promise<{
        versionId: string;
        activeVersionId: string | null;
        updatedAt: Date;
    } | null>;
    private buildSingleWorkflowReadWhere;
    private findAllWhere;
    findWorkflowIdsWithScopeForUser(workflowIds: string[], user: AuthPrincipal & Pick<User, 'id'>, scopes: Scope[]): Promise<Set<string>>;
    findExistingWorkflowIds(workflowIds: string[]): Promise<Set<string>>;
    findWorkflowsByIdsForUser(workflowIds: string[], user: User, scopes: Scope[], options?: {
        includeParentFolder?: boolean;
        includeTags?: boolean;
        includeActiveVersion?: boolean;
    }): Promise<WorkflowEntity[]>;
    findWorkflowIdsByFolder(folderIds: string[], options?: {
        includeArchived?: boolean;
    }): Promise<Map<string, string[]>>;
    findOwnedWorkflowRemovalCandidates(projectId: string, workflowIds: string[], options?: {
        includeArchived?: boolean;
    }): Promise<{
        id: string;
        name: string;
        parentFolderId: string | null;
    }[]>;
    findOwnedWorkflowPlacementsInProject(projectId: string, options?: {
        includeArchived?: boolean;
    }): Promise<Array<{
        id: string;
        name: string;
        parentFolderId: string | null;
        isArchived: boolean;
    }>>;
    findRootWorkflowIdsInProject(projectId: string, options?: {
        includeArchived?: boolean;
    }): Promise<string[]>;
    findOwnedWorkflowsBySourceWorkflowIds(projectId: string, sourceWorkflowIds: string[], options?: {
        includeActiveVersion?: boolean;
        includeParentFolder?: boolean;
        includeArchived?: boolean;
    }): Promise<WorkflowEntity[]>;
    hasProjectScopeForUser(user: User, scopes: Scope[], projectId: string): Promise<boolean>;
    findProjectIdForFolder(folderId: string): Promise<string | null>;
    findAllWorkflowIdsForUser(user: User, scopes: Scope[], folderId?: string, projectId?: string): Promise<string[]>;
    findWorkflowsForUser(user: User, scopes: Scope[], options?: FindWorkflowsForUserOptions): Promise<{
        workflows: WorkflowEntity[];
        count: number;
    }>;
}
