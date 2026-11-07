import type { RoleChangeRequestDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService, UrlService, RoleService, JwtService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import type { PublicUser } from '@n8n/db';
import { AuthIdentity, User, UserRepository, ProjectRepository, SharedCredentialsRepository, SharedWorkflowRepository } from '@n8n/db';
import type { IUserSettings } from 'n8n-workflow';
import { OwnershipService } from './ownership.service';
import { ProjectService } from './project.service.ee';
import { PublicApiKeyService } from './public-api-key.service';
import { ExternalHooks } from '../external-hooks';
import type { Invitation } from '../interfaces';
import { License } from '../license';
import { PostHogClient } from '../posthog';
import type { UserRequest } from '../requests';
import { UserManagementMailer } from '../user-management/email';
export declare const CHANGE_ROLE_ERROR_MESSAGES: {
    readonly NO_USER: 'Target user not found';
    readonly NO_ADMIN_ON_OWNER: 'Admin cannot change role on global owner';
    readonly NO_OWNER_ON_OWNER: 'Owner cannot change role on global owner';
    readonly CANNOT_CHANGE_OWN_ROLE: 'Cannot change your own global role';
    readonly INSTANCE_ROLES_MANAGED: 'Instance roles are managed automatically and cannot be changed manually';
};
export declare class UserService {
    private readonly logger;
    private readonly userRepository;
    private readonly projectRepository;
    private readonly mailer;
    private readonly urlService;
    private readonly eventService;
    private readonly ownershipService;
    private readonly publicApiKeyService;
    private readonly roleService;
    private readonly globalConfig;
    private readonly jwtService;
    private readonly projectService;
    private readonly license;
    private readonly externalHooks;
    private readonly sharedCredentialsRepository;
    private readonly sharedWorkflowRepository;
    constructor(logger: Logger, userRepository: UserRepository, projectRepository: ProjectRepository, mailer: UserManagementMailer, urlService: UrlService, eventService: EventService, ownershipService: OwnershipService, publicApiKeyService: PublicApiKeyService, roleService: RoleService, globalConfig: GlobalConfig, jwtService: JwtService, projectService: ProjectService, license: License, externalHooks: ExternalHooks, sharedCredentialsRepository: SharedCredentialsRepository, sharedWorkflowRepository: SharedWorkflowRepository);
    update(userId: string, data: Partial<User>): Promise<void>;
    getManager(): import("@n8n/db").EntityManager;
    assertGetUsersAccess(user: User, projectId?: string): Promise<void>;
    updateSettings(userId: string, newSettings: Partial<IUserSettings>): Promise<void>;
    findUserWithAuthIdentities(userId: string): Promise<User>;
    findSsoIdentity(userId: string): Promise<AuthIdentity | undefined>;
    toPublic(user: User, options?: {
        posthog?: PostHogClient;
        withScopes?: boolean;
        mfaAuthenticated?: boolean;
    }): Promise<PublicUser>;
    private addFeatureFlags;
    private sendEmails;
    inviteUsers(owner: User, invitations: Invitation[]): Promise<{
        usersInvited: UserRequest.InviteResponse[];
        usersCreated: string[];
    }>;
    changeUserRole(user: User, newRole: RoleChangeRequestDto): Promise<void>;
    private processTokenBasedInvite;
    getInvitationIdsFromPayload(token: string): Promise<{
        inviterId: string;
        inviteeId: string;
    }>;
    getUser(withIdentifier: string): Promise<User | null>;
    getUsersAndCount(options: {
        ids?: string[];
        limit?: number;
        offset?: number;
    }): Promise<{
        users: User[];
        count: number;
    }>;
    inviteUser(inviter: User, invitations: Invitation[]): Promise<UserRequest.InviteResponse[]>;
    deleteUser(actor: User, idToDelete: string, transferId?: string): Promise<{
        success: boolean;
    }>;
    changeGlobalRole(actor: User, id: string, payload: RoleChangeRequestDto): Promise<{
        success: boolean;
    }>;
    private getProvisioningService;
    private getWorkflowService;
    private getCredentialsService;
    private getOwnershipTransferService;
}
