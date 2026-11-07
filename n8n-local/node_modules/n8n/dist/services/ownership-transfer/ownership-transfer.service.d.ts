import { OwnershipTransferHandlerRegistry } from '@n8n/backend-services';
import { SharedCredentialsRepository, SharedWorkflowRepository, UserRepository, WorkflowRepository } from '@n8n/db';
import { CredentialsService } from '../../credentials/credentials.service';
import type { PolicyActor } from '../../policy/policy-enforcement-backend';
import { PolicyEnforcementService } from '../../policy/policy-enforcement.service';
import { FolderService } from '../../services/folder.service';
import { OwnershipService } from '../../services/ownership.service';
import { WorkflowService } from '../../workflows/workflow.service';
export declare class OwnershipTransferService {
    private readonly userRepository;
    private readonly workflowService;
    private readonly credentialsService;
    private readonly folderService;
    private readonly ownershipService;
    private readonly transferHandlers;
    private readonly sharedWorkflowRepository;
    private readonly workflowRepository;
    private readonly sharedCredentialsRepository;
    private readonly policyEnforcementService;
    constructor(userRepository: UserRepository, workflowService: WorkflowService, credentialsService: CredentialsService, folderService: FolderService, ownershipService: OwnershipService, transferHandlers: OwnershipTransferHandlerRegistry<Parameters<WorkflowService['transferAll']>[2]>, sharedWorkflowRepository: SharedWorkflowRepository, workflowRepository: WorkflowRepository, sharedCredentialsRepository: SharedCredentialsRepository, policyEnforcementService: PolicyEnforcementService);
    enforceTransferPolicy(fromProjectId: string, toProjectId: string, actor: PolicyActor): Promise<void>;
    transferAllResources(fromProjectIds: string[], toProjectId: string): Promise<void>;
    deleteModuleOwnedResources(projectIds: string[]): Promise<void>;
}
