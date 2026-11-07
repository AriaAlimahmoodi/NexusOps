import type { ScimUser, ScimUserCreate, ScimListResponse, ScimPatchRequestDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { RoleRepository, UserRepository } from '@n8n/db';
import { EventService, UrlService } from '@n8n/backend-services';
import { PasswordUtility } from '../../services/password.utility';
import { ScimUserRepository } from './database/scim-user.repository';
export declare class ScimService {
    private readonly logger;
    private readonly userRepository;
    private readonly scimUserRepository;
    private readonly roleRepository;
    private readonly urlService;
    private readonly globalConfig;
    private readonly passwordUtility;
    private readonly eventService;
    constructor(logger: Logger, userRepository: UserRepository, scimUserRepository: ScimUserRepository, roleRepository: RoleRepository, urlService: UrlService, globalConfig: GlobalConfig, passwordUtility: PasswordUtility, eventService: EventService);
    private toScimUser;
    private parseFilter;
    getUsers(options: {
        startIndex?: number;
        count?: number;
        filter?: string;
    }): Promise<ScimListResponse>;
    getUserById(id: string): Promise<ScimUser | null>;
    private resolveRequestedRole;
    private resolveEmail;
    createUser(scimUser: ScimUserCreate): Promise<ScimUser>;
    patchUser(id: string, patchRequest: ScimPatchRequestDto): Promise<ScimUser>;
    private applyPathOperation;
    updateUser(id: string, scimUser: ScimUserCreate): Promise<ScimUser>;
    deleteUser(id: string): Promise<void>;
    private getUserEntity;
    private toScimRoles;
    private applyRoleChange;
    private saveUser;
    private getSsoProviderType;
}
