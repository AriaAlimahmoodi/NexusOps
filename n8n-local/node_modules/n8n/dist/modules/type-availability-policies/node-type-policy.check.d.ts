import { LicenseState } from '@n8n/backend-common';
import type { ContentImportContext, CredentialDecryptContext, PolicyCheckResult, RegisteredPolicyCheck, WorkflowPublishContext, WorkflowSaveContext, WorkflowStartContext, WorkflowTransferContext } from '@n8n/decorators';
import { TypeAvailabilityPolicyService } from './type-availability-policy.service';
export declare class NodeTypePolicyCheck implements RegisteredPolicyCheck {
    private readonly service;
    private readonly licenseState;
    readonly id = "node-type-availability";
    constructor(service: TypeAvailabilityPolicyService, licenseState: LicenseState);
    onWorkflowSave({ workflow, storedWorkflow, projectId, }: WorkflowSaveContext): Promise<PolicyCheckResult>;
    onWorkflowPublish({ workflow, projectId, }: WorkflowPublishContext): Promise<PolicyCheckResult>;
    onWorkflowStart({ workflow, projectId }: WorkflowStartContext): Promise<PolicyCheckResult>;
    onWorkflowTransfer({ workflow, targetProjectId, }: WorkflowTransferContext): Promise<PolicyCheckResult>;
    onContentImport(context: ContentImportContext): Promise<PolicyCheckResult>;
    onCredentialDecrypt({ consumer, projectId, }: CredentialDecryptContext): Promise<PolicyCheckResult>;
    private check;
    private checkTypes;
}
