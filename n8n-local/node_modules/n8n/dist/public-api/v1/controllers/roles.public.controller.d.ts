import { CreateRoleDto, RoleDeleteQueryDto, RoleGetPublicDto, RoleListPublicDto, RoleListQueryPublicDto, RolePublicDto, UpdateRolePublicDto } from '@n8n/api-types';
import { EventService, RoleService } from '@n8n/backend-services';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
export declare class RolesPublicController {
    private readonly roleService;
    private readonly eventService;
    constructor(roleService: RoleService, eventService: EventService);
    getAllRoles(_req: AuthenticatedRequest, _res: Response, query: RoleListQueryPublicDto): Promise<RoleListPublicDto>;
    getRole(_req: AuthenticatedRequest, _res: Response, roleSlug: string, query: RoleListQueryPublicDto): Promise<RoleGetPublicDto>;
    createRole(req: AuthenticatedRequest, _res: Response, createRole: CreateRoleDto): Promise<RolePublicDto>;
    updateRole(req: AuthenticatedRequest, _res: Response, roleSlug: string, updateRole: UpdateRolePublicDto): Promise<RolePublicDto>;
    deleteRole(req: AuthenticatedRequest, _res: Response, roleSlug: string, query: RoleDeleteQueryDto): Promise<RolePublicDto>;
}
