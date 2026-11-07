import { OwnerSetupRequestDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { CacheService, EventService, WorkflowProjectService } from '@n8n/backend-services';
import type { ListQueryDb } from '@n8n/db';
import { Project, User, ProjectRelationRepository, ProjectRepository, UserRepository, SettingsRepository } from '@n8n/db';
import { PasswordUtility } from './password.utility';
export declare class OwnershipService {
    private cacheService;
    private eventService;
    private logger;
    private passwordUtility;
    private projectRelationRepository;
    private projectRepository;
    private workflowProjectService;
    private userRepository;
    private settingsRepository;
    constructor(cacheService: CacheService, eventService: EventService, logger: Logger, passwordUtility: PasswordUtility, projectRelationRepository: ProjectRelationRepository, projectRepository: ProjectRepository, workflowProjectService: WorkflowProjectService, userRepository: UserRepository, settingsRepository: SettingsRepository);
    copyProject(project: Project): Partial<Project>;
    reconstructProject(project: Partial<Project>): Project | undefined;
    copyUser(user: User): Partial<User>;
    reconstructUser(cachedUser: Partial<User>): User | undefined;
    getWorkflowProjectCached(workflowId: string): Promise<Project>;
    setWorkflowProjectCacheEntry(workflowId: string, project: Project): Promise<Project>;
    getPersonalProjectOwnerCached(projectId: string): Promise<User | null>;
    getPersonalProjectOwnersCached(projectIds: string[]): Promise<Map<string, User>>;
    invalidateProjectOwnerCacheByUserId(userId: string): Promise<void>;
    invalidateWorkflowProjectCacheForProject(projectId: string): Promise<void>;
    invalidateWorkflowProjectCacheByIds(workflowIds: string[]): Promise<void>;
    addOwnedByAndSharedWith(rawWorkflow: ListQueryDb.Workflow.WithSharing): ListQueryDb.Workflow.WithOwnedByAndSharedWith;
    addOwnedByAndSharedWith(rawCredential: ListQueryDb.Credentials.WithSharing): ListQueryDb.Credentials.WithOwnedByAndSharedWith;
    getInstanceOwner(): Promise<User>;
    hasInstanceOwner(): Promise<boolean>;
    setupOwner(payload: OwnerSetupRequestDto, options?: {
        overwriteExisting?: boolean;
        passwordIsHashed?: boolean;
    }): Promise<User>;
}
