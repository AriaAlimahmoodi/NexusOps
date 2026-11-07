import { LicenseState } from '@n8n/backend-common';
import type { ContentImportContext, CredentialDecryptContext, CredentialSaveContext, CredentialTransferContext, PolicyCheckResult, RegisteredPolicyCheck, WorkflowPublishContext, WorkflowSaveContext, WorkflowStartContext, WorkflowTransferContext } from '@n8n/decorators';
import { NodeTypes } from '../../node-types';
import { TypeAvailabilityPolicyService } from './type-availability-policy.service';
export declare class CredentialTypePolicyCheck implements RegisteredPolicyCheck {
    private readonly service;
    private readonly licenseState;
    private readonly nodeTypes;
    readonly id = "credential-type-availability";
    constructor(service: TypeAvailabilityPolicyService, licenseState: LicenseState, nodeTypes: NodeTypes);
    onWorkflowSave({ workflow, storedWorkflow, projectId, }: WorkflowSaveContext): Promise<PolicyCheckResult>;
    onWorkflowPublish({ workflow, projectId, }: WorkflowPublishContext): Promise<PolicyCheckResult>;
    onWorkflowStart({ workflow, projectId }: WorkflowStartContext): Promise<PolicyCheckResult>;
    onWorkflowTransfer({ workflow, targetProjectId, }: WorkflowTransferContext): Promise<PolicyCheckResult>;
    onContentImport(context: ContentImportContext): Promise<PolicyCheckResult>;
    onCredentialSave({ credential, storedCredential, projectId, }: CredentialSaveContext): Promise<PolicyCheckResult>;
    onCredentialTransfer({ credential, targetProjectId, }: CredentialTransferContext): Promise<PolicyCheckResult>;
    onCredentialDecrypt({ credentialType, projectId, }: CredentialDecryptContext): Promise<PolicyCheckResult>;
    private distinctCredentialTypes;
    private parameterCredentialTypes;
    private checkWorkflow;
    private checkTypes;
}
