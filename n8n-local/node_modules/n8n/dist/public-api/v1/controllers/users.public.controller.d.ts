import { CreateUsersPublicDto, DeleteUserQueryPublicDto, GetUserQueryDto, InvitedUsersPublicDto, ListUsersQueryDto, RoleChangeRequestDto, UserListPublicDto, UserPublicDto } from '@n8n/api-types';
import { EventService } from '@n8n/backend-services';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { ProjectService } from '../../../services/project.service.ee';
import { UserService } from '../../../services/user.service';
export declare class UsersPublicController {
    private readonly userService;
    private readonly projectService;
    private readonly eventService;
    constructor(userService: UserService, projectService: ProjectService, eventService: EventService);
    getUsers(req: AuthenticatedRequest, _res: Response, query: ListUsersQueryDto): Promise<UserListPublicDto>;
    getUser(req: AuthenticatedRequest, _res: Response, userId: string, query: GetUserQueryDto): Promise<UserPublicDto>;
    createUser(req: AuthenticatedRequest, _res: Response, body: CreateUsersPublicDto): Promise<InvitedUsersPublicDto>;
    deleteUser(req: AuthenticatedRequest, _res: Response, userId: string, query: DeleteUserQueryPublicDto): Promise<void>;
    changeRole(req: AuthenticatedRequest, _res: Response, userId: string, body: RoleChangeRequestDto): Promise<void>;
}
