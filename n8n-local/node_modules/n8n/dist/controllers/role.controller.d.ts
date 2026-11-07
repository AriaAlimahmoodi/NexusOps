import { CreateRoleDto, RoleDeleteQueryDto, RoleGetQueryDto, RoleListQueryDto, UpdateRoleDto } from '@n8n/api-types';
import type { RoleAssignmentsResponse, RoleMembersResponse, RoleProjectMembersResponse } from '@n8n/api-types';
import { EventService, RoleService } from '@n8n/backend-services';
import { AuthenticatedRequest } from '@n8n/db';
import { Role as RoleDTO } from '@n8n/permissions';
import { ProjectService } from '../services/project.service.ee';
export declare class RoleController {
    private readonly roleService;
    private readonly eventService;
    private readonly projectService;
    constructor(roleService: RoleService, eventService: EventService, projectService: ProjectService);
    getAllRoles(_req: AuthenticatedRequest, _res: Response, query: RoleListQueryDto): Promise<Record<string, RoleDTO[]>>;
    getRoleProjectMembers(req: AuthenticatedRequest, _res: Response, slug: string, projectId: string): Promise<RoleProjectMembersResponse>;
    getRoleAssignments(req: AuthenticatedRequest, _res: Response, slug: string): Promise<RoleAssignmentsResponse>;
    getRoleMembers(_req: AuthenticatedRequest, _res: Response, slug: string): Promise<RoleMembersResponse>;
    getRoleBySlug(_req: AuthenticatedRequest, _res: Response, slug: string, query: RoleGetQueryDto): Promise<RoleDTO>;
    updateRole(req: AuthenticatedRequest, _res: Response, slug: string, updateRole: UpdateRoleDto): Promise<RoleDTO>;
    deleteRole(req: AuthenticatedRequest, _res: Response, slug: string, query: RoleDeleteQueryDto): Promise<RoleDTO>;
    createRole(req: AuthenticatedRequest, _res: Response, createRole: CreateRoleDto): Promise<RoleDTO>;
}
