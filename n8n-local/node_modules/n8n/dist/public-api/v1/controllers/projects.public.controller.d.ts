import { AddProjectMembersPublicDto, ChangeProjectMemberRolePublicDto, CreatedProjectPublicDto, CreateProjectPublicDto, DeleteProjectQueryPublicDto, ListProjectMembersQueryPublicDto, ListProjectsQueryPublicDto, ProjectListPublicDto, ProjectMemberListPublicDto, UpdateProjectPublicDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { ProvisioningService } from '../../../modules/provisioning.ee/provisioning.service.ee';
import { ProjectService } from '../../../services/project.service.ee';
export declare class ProjectsPublicController {
    private readonly projectService;
    private readonly provisioningService;
    constructor(projectService: ProjectService, provisioningService: ProvisioningService);
    getProjects(_req: AuthenticatedRequest, _res: Response, query: ListProjectsQueryPublicDto): Promise<ProjectListPublicDto>;
    createProject(req: AuthenticatedRequest, _res: Response, body: CreateProjectPublicDto): Promise<CreatedProjectPublicDto>;
    updateProject(req: AuthenticatedRequest, _res: Response, projectId: string, body: UpdateProjectPublicDto): Promise<void>;
    deleteProject(req: AuthenticatedRequest, _res: Response, projectId: string, _query: DeleteProjectQueryPublicDto): Promise<void>;
    getProjectUsers(req: AuthenticatedRequest, _res: Response, projectId: string, query: ListProjectMembersQueryPublicDto): Promise<ProjectMemberListPublicDto>;
    addUsersToProject(req: AuthenticatedRequest, _res: Response, projectId: string, body: AddProjectMembersPublicDto): Promise<void>;
    changeUserRoleInProject(req: AuthenticatedRequest, _res: Response, projectId: string, userId: string, body: ChangeProjectMemberRolePublicDto): Promise<void>;
    deleteUserFromProject(req: AuthenticatedRequest, _res: Response, projectId: string, userId: string): Promise<void>;
    private assertProjectRolesNotManaged;
}
