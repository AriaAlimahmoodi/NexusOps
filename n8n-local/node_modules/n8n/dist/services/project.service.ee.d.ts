import type { CreateProjectDto, ProjectType, UpdateProjectDto } from '@n8n/api-types';
import { LicenseState, Logger, ModuleRegistry } from '@n8n/backend-common';
import { EventService, RoleService } from '@n8n/backend-services';
import { type User, FolderRepository, Project, ProjectRelation, ProjectRelationRepository, ProjectRepository, RoleRepository, SharedCredentialsRepository, SharedWorkflowRepository, UserRepository, type ProjectListOptions } from '@n8n/db';
import { type Scope, type GlobalRole, type ProjectRole, AssignableProjectRole } from '@n8n/permissions';
import type { EntityManager } from '@n8n/typeorm';
import { UserError } from 'n8n-workflow';
import { NotFoundError } from '@n8n/errors';
import { UserManagementMailer } from '../user-management/email';
import { OwnershipService } from './ownership.service';
export declare class TeamProjectOverQuotaError extends UserError {
    constructor(limit: number);
}
export declare class UnlicensedProjectRoleError extends UserError {
    constructor(role: AssignableProjectRole);
}
export declare class ProjectNotFoundError extends NotFoundError {
    readonly projectId: string;
    constructor(projectId: string);
    static isDefinedAndNotNull<T>(value: T | undefined | null, projectId: string): asserts value is T;
}
export interface ProjectCreateOverrides {
    id?: string;
    description?: string | null;
    customTelemetryTags?: Array<{
        key: string;
        value: string;
    }>;
}
export type ProjectWithRelationsAndScopes = Project & {
    role: ProjectRole | AssignableProjectRole | GlobalRole;
    scopes?: Scope[];
};
export declare class ProjectService {
    private readonly sharedWorkflowRepository;
    private readonly projectRepository;
    private readonly projectRelationRepository;
    private readonly roleService;
    private readonly sharedCredentialsRepository;
    private readonly folderRepository;
    private readonly licenseState;
    private readonly moduleRegistry;
    private readonly ownershipService;
    private readonly logger;
    private readonly eventService;
    private readonly userManagementMailer;
    private readonly userRepository;
    private readonly roleRepository;
    constructor(sharedWorkflowRepository: SharedWorkflowRepository, projectRepository: ProjectRepository, projectRelationRepository: ProjectRelationRepository, roleService: RoleService, sharedCredentialsRepository: SharedCredentialsRepository, folderRepository: FolderRepository, licenseState: LicenseState, moduleRegistry: ModuleRegistry, ownershipService: OwnershipService, logger: Logger, eventService: EventService, userManagementMailer: UserManagementMailer, userRepository: UserRepository, roleRepository: RoleRepository);
    private get workflowService();
    private get credentialsService();
    private get ownershipTransferService();
    private get dataTableService();
    private get secretsProvidersConnectionsService();
    private get agentRepository();
    private get agentKnowledgeService();
    private get agentExecutionService();
    private get agentChatAttachmentService();
    private get connectionStatusProxy();
    deleteProject(user: User, projectId: string, { migrateToProject }?: {
        migrateToProject?: string;
    }): Promise<void>;
    findProjectsWorkflowIsIn(workflowId: string): Promise<string[]>;
    findTeamProjectsWorkflowIsIn(workflowId: string): Promise<string[]>;
    addUserScopes(user: User, projects: Project[]): Promise<Array<Project & {
        role: string;
        scopes: Scope[];
    }>>;
    getAccessibleProjects(user: User): Promise<Project[]>;
    getAccessibleProjectsAndCount(user: User, options: ProjectListOptions): Promise<{
        projects: Project[];
        count: number;
    }>;
    getShareableProjectsAndCount(user: User, options: ProjectListOptions): Promise<{
        projects: Project[];
        count: number;
    }>;
    getProjectsAndCount({ offset, limit, }: {
        offset: number;
        limit: number;
    }): Promise<{
        projects: Project[];
        count: number;
    }>;
    getPersonalProjectOwners(projectIds: string[]): Promise<ProjectRelation[]>;
    getMyProjects(user: User): Promise<ProjectWithRelationsAndScopes[]>;
    createTeamProject(adminUser: User, data: CreateProjectDto, overrides?: ProjectCreateOverrides): Promise<Project>;
    updateProject(user: User, projectId: string, { name, icon, description, customTelemetryTags }: UpdateProjectDto, { preserveCustomTelemetryTags }?: {
        preserveCustomTelemetryTags?: boolean;
    }): Promise<void>;
    getPersonalProject(user: User): Promise<Project | null>;
    getProjectRelationsForUser(user: User): Promise<ProjectRelation[]>;
    syncProjectRelations(projectId: string, relations: Array<{
        role: AssignableProjectRole;
        userId: string;
    }>): Promise<{
        project: Project;
        newRelations: Array<{
            role: AssignableProjectRole;
            userId: string;
        }>;
    }>;
    private notifyNewSharees;
    private emitProjectMembersUpdated;
    addUsersToProject(user: User, projectId: string, relations: Array<{
        userId: string;
        role: AssignableProjectRole;
    }>): Promise<void>;
    addUsersWithConflictSemantics(user: User, projectId: string, relations: Array<{
        userId: string;
        role: AssignableProjectRole;
    }>): Promise<{
        project: Project;
        added: Array<{
            userId: string;
            role: AssignableProjectRole;
        }>;
        conflicts: Array<{
            userId: string;
            currentRole: AssignableProjectRole;
            requestedRole: AssignableProjectRole;
        }>;
    }>;
    private getTeamProjectWithRelations;
    private checkRolesLicensed;
    private findInstanceAdminIds;
    private withoutInstanceAdmins;
    private assertNoInstanceAdmins;
    private isUserProjectOwner;
    deleteUserFromProject(user: User, projectId: string, userId: string): Promise<void>;
    changeUserRoleInProject(user: User, projectId: string, userId: string, role: AssignableProjectRole): Promise<void>;
    pruneRelations(em: EntityManager, project: Project): Promise<void>;
    addManyRelations(em: EntityManager, project: Project, relations: Array<{
        userId: string;
        role: AssignableProjectRole;
    }>): Promise<void>;
    getProjectWithScope(user: User, projectId: string, scopes: Scope[], entityManager?: EntityManager): Promise<Project | null>;
    getProjectIdsWithScope(user: User, scopes: Scope[], projectIds?: string[]): Promise<string[]>;
    findExistingProjectIds(projectIds: string[]): Promise<Set<string>>;
    findProjectsByIdsForUser(user: User, projectIds: string[], scopes: Scope[]): Promise<Project[]>;
    addUser(projectId: string, { userId, role }: {
        userId: string;
        role: AssignableProjectRole;
    }, trx?: EntityManager): Promise<{
        projectId: string;
        userId: string;
        role: {
            slug: string;
        };
    } & ProjectRelation>;
    getProject(projectId: string): Promise<Project>;
    findProject(projectId: string): Promise<Project | null>;
    getProjectRelations(projectId: string): Promise<ProjectRelation[]>;
    getImplicitProjectMembers(project: Pick<Project, 'id' | 'type'>): Promise<User[]>;
    findUserIdsByProjectId(projectId: string): Promise<string[]>;
    getProjectRelationForUserAndProject(userId: string, projectId: string): Promise<ProjectRelation | null>;
    getProjectMembersAndCount(projectId: string, { offset, limit }: {
        offset: number;
        limit: number;
    }): Promise<{
        members: ProjectRelation[];
        count: number;
    }>;
    getProjectScopesForUser(user: User, projectId: string): Promise<Scope[]>;
    getUserOwnedOrAdminProjects(userId: string): Promise<Project[]>;
    getProjectCounts(): Promise<Record<ProjectType, number>>;
}
