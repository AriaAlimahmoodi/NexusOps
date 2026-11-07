import { CreateProjectDto, DeleteProjectDto, UpdateProjectDto, AddUsersToProjectDto, ChangeUserRoleInProject, ListProjectsQueryDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { Response } from 'express';
import { ProvisioningService } from '../modules/provisioning.ee/provisioning.service.ee';
import type { ProjectRequest } from '../requests';
import { ProjectService } from '../services/project.service.ee';
export declare class ProjectController {
    private readonly projectsService;
    private readonly provisioningService;
    constructor(projectsService: ProjectService, provisioningService: ProvisioningService);
    getAllProjects(req: AuthenticatedRequest, res: Response, payload: ListProjectsQueryDto): Promise<import("@n8n/db").Project[] | Response<any, Record<string, any>>>;
    getProjectCounts(): Promise<Record<"personal" | "team", number>>;
    getSharingCandidates(req: AuthenticatedRequest, res: Response, payload: ListProjectsQueryDto): Promise<Response<any, Record<string, any>>>;
    createProject(req: AuthenticatedRequest, _res: Response, payload: CreateProjectDto): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        name: string;
        type: 'personal' | 'team';
        icon: {
            type: 'emoji' | 'icon';
            value: string;
        } | null;
        description: string | null;
        customTelemetryTags: Array<{
            key: string;
            value: string;
        }>;
        projectRelations: import("@n8n/db").ProjectRelation[];
        sharedCredentials: import("@n8n/db").SharedCredentials[];
        sharedWorkflows: import("@n8n/db").SharedWorkflow[];
        secretsProviderAccess: import("@n8n/db").ProjectSecretsProviderAccess[];
        variables: import("@n8n/db").Variables[];
        roleMappingRules: import("@n8n/db").RoleMappingRule[];
        creatorId: string | null;
        creator?: import("@n8n/typeorm").Relation<import("@n8n/db").User>;
        role: string;
        scopes: import("@n8n/permissions").Scope[];
    }>;
    getMyProjects(req: AuthenticatedRequest, _res: Response): Promise<ProjectRequest.GetMyProjectsResponse>;
    getPersonalProject(req: AuthenticatedRequest): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        name: string;
        type: 'personal' | 'team';
        icon: {
            type: 'emoji' | 'icon';
            value: string;
        } | null;
        description: string | null;
        customTelemetryTags: Array<{
            key: string;
            value: string;
        }>;
        projectRelations: import("@n8n/db").ProjectRelation[];
        sharedCredentials: import("@n8n/db").SharedCredentials[];
        sharedWorkflows: import("@n8n/db").SharedWorkflow[];
        secretsProviderAccess: import("@n8n/db").ProjectSecretsProviderAccess[];
        variables: import("@n8n/db").Variables[];
        roleMappingRules: import("@n8n/db").RoleMappingRule[];
        creatorId: string | null;
        creator?: import("@n8n/typeorm").Relation<import("@n8n/db").User>;
        scopes: import("@n8n/permissions").Scope[];
        rolesManaged: boolean;
    }>;
    getProject(req: AuthenticatedRequest, _res: Response, projectId: string): Promise<ProjectRequest.ProjectWithRelations>;
    updateProject(req: AuthenticatedRequest, _res: Response, payload: UpdateProjectDto, projectId: string): Promise<void>;
    private assertProjectRolesNotManaged;
    addProjectUsers(req: AuthenticatedRequest, res: Response, projectId: string, payload: AddUsersToProjectDto): Promise<Response<any, Record<string, any>>>;
    changeProjectUserRole(req: AuthenticatedRequest, res: Response, projectId: string, userId: string, body: ChangeUserRoleInProject): Promise<Response<any, Record<string, any>>>;
    deleteProjectUser(req: AuthenticatedRequest, res: Response, projectId: string, userId: string): Promise<Response<any, Record<string, any>>>;
    deleteProject(req: AuthenticatedRequest, _res: Response, query: DeleteProjectDto, projectId: string): Promise<void>;
}
