import { Logger } from '@n8n/backend-common';
import type { CredentialUsedByWorkflow, User, WorkflowWithSharingsAndCredentials, WorkflowWithSharingsMetaDataAndCredentials } from '@n8n/db';
import { SharedWorkflow, CredentialsRepository, FolderRepository, SharedWorkflowRepository, WorkflowRepository, WorkflowHistoryRepository, WorkflowPublishHistoryRepository } from '@n8n/db';
import { type EntityManager } from '@n8n/typeorm';
import type { INode, IWorkflowBase, WorkflowId } from 'n8n-workflow';
import { ActiveWorkflowManager } from '../active-workflow-manager';
import { CredentialsFinderService, WorkflowMutationHooksProxy } from '@n8n/backend-services';
import { CredentialsService } from '../credentials/credentials.service';
import { EnterpriseCredentialsService } from '../credentials/credentials.service.ee';
import { CredentialsPermissionChecker } from '../executions/pre-execution-checks/credentials-permission-checker';
import { NodeTypes } from '../node-types';
import { PolicyEnforcementService } from '../policy/policy-enforcement.service';
import { OwnershipService } from '../services/ownership.service';
import { ProjectService } from '../services/project.service.ee';
import { WorkflowFinderService } from './workflow-finder.service';
export type CredentialGuardOptions = {
    allowUninspectableSource?: boolean;
};
export declare class EnterpriseWorkflowService {
    private readonly logger;
    private readonly sharedWorkflowRepository;
    private readonly workflowRepository;
    private readonly credentialsRepository;
    private readonly credentialsService;
    private readonly ownershipService;
    private readonly projectService;
    private readonly activeWorkflowManager;
    private readonly credentialsFinderService;
    private readonly enterpriseCredentialsService;
    private readonly workflowFinderService;
    private readonly folderRepository;
    private readonly workflowPublishHistoryRepository;
    private readonly workflowMutationHooks;
    private readonly policyEnforcementService;
    private readonly nodeTypes;
    private readonly credentialsPermissionChecker;
    private readonly workflowHistoryRepository;
    constructor(logger: Logger, sharedWorkflowRepository: SharedWorkflowRepository, workflowRepository: WorkflowRepository, credentialsRepository: CredentialsRepository, credentialsService: CredentialsService, ownershipService: OwnershipService, projectService: ProjectService, activeWorkflowManager: ActiveWorkflowManager, credentialsFinderService: CredentialsFinderService, enterpriseCredentialsService: EnterpriseCredentialsService, workflowFinderService: WorkflowFinderService, folderRepository: FolderRepository, workflowPublishHistoryRepository: WorkflowPublishHistoryRepository, workflowMutationHooks: WorkflowMutationHooksProxy, policyEnforcementService: PolicyEnforcementService, nodeTypes: NodeTypes, credentialsPermissionChecker: CredentialsPermissionChecker, workflowHistoryRepository: WorkflowHistoryRepository);
    shareWithProjects(workflowId: WorkflowId, shareWithIds: string[], entityManager: EntityManager): Promise<SharedWorkflow[]>;
    addOwnerAndSharings(workflow: WorkflowWithSharingsAndCredentials): WorkflowWithSharingsMetaDataAndCredentials;
    addCredentialsToWorkflow(workflow: WorkflowWithSharingsMetaDataAndCredentials, currentUser: User): Promise<void>;
    private findUsableCredentialIds;
    validateCredentialPermissionsToUser(workflow: IWorkflowBase, allowedCredentials: Array<{
        id: string;
    }> | ReadonlySet<string>, options?: CredentialGuardOptions): void;
    preventTampering<T extends IWorkflowBase>(workflow: T, workflowId: string, user: User, restoredNodes?: INode[]): Promise<T>;
    private findNodesAsHistoryStoredThem;
    private isSameNodeApartFromEditableFields;
    private toComparableNode;
    validateWorkflowCredentialUsage<T extends IWorkflowBase>(newWorkflowVersion: T, previousWorkflowVersion: IWorkflowBase, credentialsUserHasAccessTo: Array<{
        id: string;
    }>, historyNodes?: INode[], options?: CredentialGuardOptions): T;
    getNodesWithInaccessibleCreds(workflow: IWorkflowBase, userCredIds: Iterable<string>, options?: CredentialGuardOptions): INode[];
    collectCredentialReferences(workflow: IWorkflowBase): {
        ids: Set<string>;
        hasUnresolved: boolean;
        hasUninspectableSource: boolean;
    };
    canUseEveryCredential(user: User): boolean;
    private isBlockedByUninspectableSource;
    private getNodeDefinition;
    private getDisplayedParameters;
    private getNodeTypeDescription;
    private hasUninspectableSubworkflowSource;
    private getNodeCredentialRefs;
    private parseInlineAgent;
    private getAgentToolNodes;
    private getInlineWorkflowNodes;
    getWorkflowIdsWithResolvableCredentials(workflowIds: string[]): Promise<Set<string>>;
    transferWorkflow(user: User, workflowId: string, destinationProjectId: string, shareCredentials?: string[], destinationParentFolderId?: string): Promise<{
        error: {
            message: string;
            lineNumber: number | undefined;
            timestamp: number;
            name: string;
            description: string | null | undefined;
            context: import("n8n-workflow").IDataObject;
            cause: {
                name: string;
                message: string;
            } | undefined;
        } | {
            name: string;
            message: string;
        };
    } | undefined>;
    getFolderUsedCredentials(user: User, folderId: string, projectId: string): Promise<CredentialUsedByWorkflow[]>;
    transferFolder(user: User, sourceProjectId: string, sourceFolderId: string, destinationProjectId: string, destinationParentFolderId: string, shareCredentials?: string[]): Promise<void>;
    private formatActivationError;
    private attemptWorkflowReactivation;
    private transferWorkflowOwnership;
    private shareCredentialsWithProject;
    private moveFoldersToDestination;
    private isActiveWorkflow;
}
