import type { ContentImportContext, CredentialDecryptContext, CredentialSaveContext, CredentialTransferContext, EnforcementPoint, PolicyDecision, WorkflowPublishContext, WorkflowSaveContext, WorkflowStartContext, WorkflowTransferContext, PolicyCleared } from '@n8n/decorators';
import type { PolicyActor, PolicyEnforcementBackend } from './policy-enforcement-backend';
export declare class PolicyEnforcementService {
    private implementation?;
    setImplementation(implementation: PolicyEnforcementBackend): void;
    hasChecksFor(point: EnforcementPoint): boolean;
    enforceWorkflowSave(context: WorkflowSaveContext, actor: PolicyActor): Promise<PolicyCleared<'workflowSave'>>;
    evaluateWorkflowSave(context: WorkflowSaveContext): Promise<PolicyDecision>;
    enforceWorkflowPublish(context: WorkflowPublishContext, actor: PolicyActor): Promise<PolicyCleared<'workflowPublish'>>;
    evaluateWorkflowPublish(context: WorkflowPublishContext): Promise<PolicyDecision>;
    enforceWorkflowStart(context: WorkflowStartContext, actor: PolicyActor): Promise<PolicyCleared<'workflowStart'>>;
    evaluateWorkflowStart(context: WorkflowStartContext): Promise<PolicyDecision>;
    enforceWorkflowTransfer(context: WorkflowTransferContext, actor: PolicyActor): Promise<PolicyCleared<'workflowTransfer'>>;
    evaluateWorkflowTransfer(context: WorkflowTransferContext): Promise<PolicyDecision>;
    enforceCredentialSave(context: CredentialSaveContext, actor: PolicyActor): Promise<PolicyCleared<'credentialSave'>>;
    evaluateCredentialSave(context: CredentialSaveContext): Promise<PolicyDecision>;
    enforceCredentialTransfer(context: CredentialTransferContext, actor: PolicyActor): Promise<PolicyCleared<'credentialTransfer'>>;
    evaluateCredentialTransfer(context: CredentialTransferContext): Promise<PolicyDecision>;
    enforceCredentialDecrypt(context: CredentialDecryptContext, actor: PolicyActor): Promise<PolicyCleared<'credentialDecrypt'>>;
    evaluateCredentialDecrypt(context: CredentialDecryptContext): Promise<PolicyDecision>;
    enforceContentImport(context: ContentImportContext, actor: PolicyActor): Promise<PolicyCleared<'contentImport'>>;
    evaluateContentImport(context: ContentImportContext): Promise<PolicyDecision>;
    private enforce;
    private evaluate;
}
