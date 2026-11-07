import type { CreateCredentialDto, CredentialConnectionStatus } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService, RoleService, CredentialsFinderService } from '@n8n/backend-services';
import { Project, TransactionRunner, CredentialsEntity, DbLockService, SharedCredentials, CredentialsRepository, InstanceCredentialAssignmentRepository, ProjectRepository, SharedCredentialsRepository, UserRepository } from '@n8n/db';
import type { SlimProject, User, ICredentialsDb, OperationContext, CredentialSharingRelation } from '@n8n/db';
import { type Scope } from '@n8n/permissions';
import { type EntityManager, type FindOptionsRelations } from '@n8n/typeorm';
import { ErrorReporter } from 'n8n-core';
import type { ICredentialDataDecryptedObject, ICredentialsDecrypted, INodeProperties } from 'n8n-workflow';
import { CredentialTypes } from '../credential-types';
import { CredentialsHelper } from '../credentials-helper';
import { ExternalHooks } from '../external-hooks';
import { ExternalSecretsConfig } from '../modules/external-secrets.ee/external-secrets.config';
import { SecretsProviderAccessCheckService } from '../modules/external-secrets.ee/secret-provider-access-check.service.ee';
import type { PolicyActor } from '../policy/policy-enforcement-backend';
import { PolicyEnforcementService } from '../policy/policy-enforcement.service';
import type { CredentialRequest, ListQuery } from '../requests';
import { CredentialsTester } from '../services/credentials-tester.service';
import { OwnershipService } from '../services/ownership.service';
import { ProjectService } from '../services/project.service.ee';
import { CredentialConnectionStatusProxy } from './credential-connection-status-proxy';
import { CredentialDescriptionsService } from './credential-descriptions.service';
import { CredentialDependencyService } from './credential-dependency.service';
import { InstanceCredentialUseRegistry } from './instance-credential-use.registry';
export type CredentialsGetSharedOptions = {
    allowGlobalScope: true;
    globalScope: Scope;
} | {
    allowGlobalScope: false;
};
type PrepareUpdateDataOptions = {
    clearOauthTokenData?: boolean;
    operationContext?: OperationContext;
    dataMerge?: 'unredact' | 'replace' | 'partial';
};
type GetManyOptions = {
    listQueryOptions?: ListQuery.Options & {
        relations?: CredentialSharingRelation[];
    };
    includeScopes?: boolean;
    includeData?: boolean;
    onlySharedWithMe?: boolean;
    includeGlobal?: boolean;
    filters?: {
        externalSecretsStore?: string;
    };
};
type UpdateOptions = {
    deleteUserEntries?: boolean;
    instanceCredential?: Pick<CredentialsEntity, 'id' | 'type'>;
    user?: User;
};
export declare const PENDING_AUTHORIZATION_GRACE_MS: number;
type InstanceCredentialWriteOptions = {
    skipExternalHooks?: boolean;
    encryptedData?: ICredentialsDb;
};
type CredentialsWithCount<T = CredentialsEntity> = {
    credentials: T[];
    count: number;
};
type WorkflowCredentialResult = {
    id: string;
    name: string;
    type: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    scopes: Scope[];
    isManaged: boolean;
    isGlobal: boolean;
    isResolvable: boolean;
    homeProject: SlimProject | null;
    sharedWithProjects: SlimProject[];
    currentUserHasAccess: boolean;
    sharedRoute: 'project' | 'personal';
} & CredentialConnectionStatus;
export declare class CredentialsService {
    private readonly credentialsRepository;
    private readonly credentialDependencyService;
    private readonly sharedCredentialsRepository;
    private readonly ownershipService;
    private readonly logger;
    private readonly errorReporter;
    private readonly credentialsTester;
    private readonly externalHooks;
    private readonly credentialTypes;
    private readonly projectRepository;
    private readonly projectService;
    private readonly roleService;
    private readonly userRepository;
    private readonly credentialsFinderService;
    private readonly credentialsHelper;
    private readonly externalSecretsConfig;
    private readonly externalSecretsProviderAccessCheckService;
    private readonly connectionStatusProxy;
    private readonly instanceCredentialAssignmentRepository;
    private readonly instanceCredentialUseRegistry;
    private readonly dbLockService;
    private readonly eventService;
    private readonly transactionRunner;
    private readonly policyEnforcementService;
    private readonly credentialDescriptions;
    constructor(credentialsRepository: CredentialsRepository, credentialDependencyService: CredentialDependencyService, sharedCredentialsRepository: SharedCredentialsRepository, ownershipService: OwnershipService, logger: Logger, errorReporter: ErrorReporter, credentialsTester: CredentialsTester, externalHooks: ExternalHooks, credentialTypes: CredentialTypes, projectRepository: ProjectRepository, projectService: ProjectService, roleService: RoleService, userRepository: UserRepository, credentialsFinderService: CredentialsFinderService, credentialsHelper: CredentialsHelper, externalSecretsConfig: ExternalSecretsConfig, externalSecretsProviderAccessCheckService: SecretsProviderAccessCheckService, connectionStatusProxy: CredentialConnectionStatusProxy, instanceCredentialAssignmentRepository: InstanceCredentialAssignmentRepository, instanceCredentialUseRegistry: InstanceCredentialUseRegistry, dbLockService: DbLockService, eventService: EventService, transactionRunner: TransactionRunner, policyEnforcementService: PolicyEnforcementService, credentialDescriptions: CredentialDescriptionsService);
    countConnectedUsers(credentialId: string): Promise<number>;
    populateConnectedByMe<T extends {
        id: string;
        isResolvable?: boolean;
    }>(credentials: T[], user: User): Promise<void>;
    getMany(user: User, options: GetManyOptions & {
        includeData: true;
    }): Promise<Array<ICredentialsDecrypted<ICredentialDataDecryptedObject>>>;
    getMany(user: User, options?: GetManyOptions): Promise<CredentialsEntity[]>;
    getManyAndCount(user: User, options: GetManyOptions & {
        includeData: true;
    }): Promise<CredentialsWithCount<ICredentialsDecrypted<ICredentialDataDecryptedObject>>>;
    getManyAndCount(user: User, options?: GetManyOptions): Promise<CredentialsWithCount>;
    private getManyForAdminUser;
    private getManyForMemberUser;
    private applyPersonalProjectFilter;
    private enrichCredentials;
    private populateSharedRelations;
    private addScopesToCredentials;
    private addDecryptedDataToCredentials;
    getCredentialsAUserCanUseInAWorkflow(user: User, options: ({
        workflowId: string;
    } | {
        projectId: string;
    }) & {
        excludePersonalRoute?: boolean;
    }): Promise<WorkflowCredentialResult[]>;
    private findPersonalRouteCredentialIds;
    findAllGlobalCredentialIds(includeData?: boolean): Promise<CredentialsEntity[]>;
    findAllCredentialIdsForWorkflow(workflowId: string): Promise<CredentialsEntity[]>;
    findAllCredentialIdsForProject(projectId: string): Promise<CredentialsEntity[]>;
    getSharing(user: User, credentialId: string, globalScopes: Scope[], relations?: FindOptionsRelations<SharedCredentials>): Promise<SharedCredentials | null>;
    private applyDataMerge;
    prepareUpdateData(user: User, data: CredentialRequest.CredentialProperties, existingCredential: CredentialsEntity, options?: PrepareUpdateDataOptions): Promise<CredentialsEntity>;
    private reissuesClientCredentialsToken;
    private restoreHiddenDcrFields;
    createEncryptedData(credential: {
        id: string | null;
        name: string;
        type: string;
        data: ICredentialDataDecryptedObject;
    }): Promise<ICredentialsDb>;
    clearOauthTokenData(credential: CredentialsEntity, actor: PolicyActor): Promise<void>;
    decryptForUse(credential: CredentialsEntity, actor: PolicyActor, projectId?: string | null): Promise<ICredentialDataDecryptedObject>;
    enforceCredentialUse(credential: Pick<ICredentialsDecrypted, 'id' | 'type'>, actor: PolicyActor, projectId: string | null): Promise<void>;
    decrypt(credential: CredentialsEntity, includeRawData?: boolean): Promise<ICredentialDataDecryptedObject>;
    update(credentialId: string, newCredentialData: ICredentialsDb, actor: PolicyActor, decryptedCredentialData?: ICredentialDataDecryptedObject, options?: UpdateOptions): Promise<(CredentialsEntity & CredentialConnectionStatus) | null>;
    runInstanceCredentialHooks(event: 'create' | 'update', credential: {
        id: string | null;
        name: string;
        type: string;
        data: ICredentialDataDecryptedObject;
    }): Promise<ICredentialsDb>;
    updateInstanceCredential(user: User, credentialId: string, data: CredentialRequest.CredentialProperties, ctx: OperationContext, options?: InstanceCredentialWriteOptions): Promise<CredentialsEntity>;
    private resolveOwningProjectIdForNewCredential;
    save(credential: CredentialsEntity, encryptedData: ICredentialsDb, user: User, projectId: string, decryptedCredentialData?: ICredentialDataDecryptedObject): Promise<CredentialsEntity>;
    private enforceCredentialUpdate;
    private enforceCredentialCreate;
    private insertProjectCredential;
    findCredentialOwningProject(credentialId: string): Promise<Project | undefined>;
    delete(user: User, credentialId: string, options?: {
        includeInstanceCredentials?: boolean;
    }): Promise<boolean>;
    deleteUnowned(user: User, credentialId: string): Promise<void>;
    private emitCredentialDeleted;
    test(userId: User['id'], credentials: ICredentialsDecrypted): Promise<import("n8n-workflow").INodeCredentialTestResult>;
    testById(user: User, credentialId: string): Promise<import("n8n-workflow").INodeCredentialTestResult>;
    testWithCredentials(user: User, credentials: ICredentialsDecrypted): Promise<import("n8n-workflow").INodeCredentialTestResult>;
    probeById(user: User, credentialId: string): Promise<import("../services/credentials-tester.service").CredentialAuthProbeResult>;
    redact(data: ICredentialDataDecryptedObject, credential: CredentialsEntity): ICredentialDataDecryptedObject;
    private redactValues;
    private redactCollectionOption;
    private redactJsonLeaves;
    private mergeRedactedJsonLeaves;
    private unredactRestoreValues;
    getCredentialTypeProperties(credentialType: string): INodeProperties[];
    getChangedSharedFields(credential: CredentialsEntity, newData: ICredentialDataDecryptedObject): Promise<string[]>;
    unredact(redactedData: ICredentialDataDecryptedObject, savedData: ICredentialDataDecryptedObject, props?: INodeProperties[]): ICredentialDataDecryptedObject;
    getOne(user: User, credentialId: string, includeDecryptedData: boolean, options?: {
        includeInstanceCredentials?: boolean;
    }): Promise<{
        connectedByMe?: boolean;
        connectedAccountIdentifier?: string;
        connectedUserCount?: number;
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        name: string;
        description: string | null;
        type: string;
        shared: SharedCredentials[];
        isManaged: boolean;
        isGlobal: boolean;
        isResolvable: boolean;
        resolvableAllowFallback: boolean;
        resolverId: string | null;
        usageScope: import("@n8n/db").CredentialUsageScope;
        pendingAuthorizationExpiresAt: Date | null;
        data: ICredentialDataDecryptedObject;
    } | {
        connectedByMe?: boolean;
        connectedAccountIdentifier?: string;
        connectedUserCount?: number;
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        name: string;
        description: string | null;
        type: string;
        shared: SharedCredentials[];
        isManaged: boolean;
        isGlobal: boolean;
        isResolvable: boolean;
        resolvableAllowFallback: boolean;
        resolverId: string | null;
        usageScope: import("@n8n/db").CredentialUsageScope;
        pendingAuthorizationExpiresAt: Date | null;
    }>;
    getCredentialScopes(user: User, credentialId: string): Promise<Scope[]>;
    transferAll(fromProjectId: string, toProjectId: string, trx?: EntityManager): Promise<void>;
    replaceCredentialContentsForSharee(user: User, credential: CredentialsEntity, decryptedData: ICredentialDataDecryptedObject, mergedCredentials: ICredentialsDecrypted): Promise<void>;
    createUnmanagedCredential(dto: CreateCredentialDto, user: User, options?: {
        id?: string;
    }): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        name: string;
        description: string | null;
        data: string;
        type: string;
        isManaged: boolean;
        isGlobal: boolean;
        isResolvable: boolean;
        resolvableAllowFallback: boolean;
        resolverId: string | null;
        usageScope: import("@n8n/db").CredentialUsageScope;
        pendingAuthorizationExpiresAt: Date | null;
        scopes: Scope[];
    }>;
    createInstanceCredential(dto: CreateCredentialDto, user: User, ctx: OperationContext, options?: InstanceCredentialWriteOptions): Promise<CredentialsEntity>;
    createStubCredential(opts: {
        id?: string;
        name: string;
        type: string;
        projectId: string;
        data?: ICredentialDataDecryptedObject;
    }, user: User): Promise<CredentialsEntity>;
    validateStubCredentialData(data: ICredentialDataDecryptedObject, user: User, projectId: string): Promise<void>;
    checkCredentialData(type: string, data: ICredentialDataDecryptedObject, user: User, projectId: string): Promise<void>;
    private validateCredentialData;
    isOAuthCredentialType(type: string): boolean;
    private validateOAuthCredentialUrls;
    createManagedCredential(dto: CreateCredentialDto, user: User): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        name: string;
        description: string | null;
        data: string;
        type: string;
        isManaged: boolean;
        isGlobal: boolean;
        isResolvable: boolean;
        resolvableAllowFallback: boolean;
        resolverId: string | null;
        usageScope: import("@n8n/db").CredentialUsageScope;
        pendingAuthorizationExpiresAt: Date | null;
        scopes: Scope[];
    }>;
    ensureEndUserCredentialAllowedInProject(project?: Pick<Project, 'type'> | null): void;
    ensureCanManageEndUserCredential(user: User, projectId?: string): Promise<void>;
    private createCredential;
    private persistInstanceCredential;
    private getValidatedInstanceCredentialHookData;
    validateInstanceCredentialData(data: ICredentialDataDecryptedObject): void;
    validateInstanceCredentialUpdate(credential: Pick<CredentialsEntity, 'id' | 'type'>, data: ICredentialDataDecryptedObject, credentialUseIds?: string[], ctx?: OperationContext): Promise<void>;
    prepareCredentialsForUse({ storedCredential, user, credentialsToUse, }: {
        storedCredential: CredentialsEntity;
        user: User;
        credentialsToUse?: ICredentialsDecrypted;
    }): Promise<{
        credentials: ICredentialsDecrypted;
        storedData: ICredentialDataDecryptedObject;
    }>;
}
export {};
