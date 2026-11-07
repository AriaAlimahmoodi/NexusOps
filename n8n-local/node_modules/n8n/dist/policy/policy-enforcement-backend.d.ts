import type { ContentImportContext, CredentialDecryptContext, CredentialSaveContext, CredentialTransferContext, EnforcementPoint, PolicyDecision, WorkflowPublishContext, WorkflowSaveContext, WorkflowStartContext, WorkflowTransferContext } from '@n8n/decorators';
import type { UserLike } from '../types/user-like.types';
type PolicyContexts = {
    workflowSave: WorkflowSaveContext;
    workflowPublish: WorkflowPublishContext;
    workflowStart: WorkflowStartContext;
    workflowTransfer: WorkflowTransferContext;
    credentialSave: CredentialSaveContext;
    credentialTransfer: CredentialTransferContext;
    credentialDecrypt: CredentialDecryptContext;
    contentImport: ContentImportContext;
};
export type PolicyContext<Point extends EnforcementPoint> = PolicyContexts[Point];
export type PolicySystemReason = 'execution' | 'cli-import' | 'activation' | 'publication' | 'integration' | 'log-streaming';
export type PolicyActor = {
    kind: 'user';
    user: UserLike;
} | {
    kind: 'system';
    reason: PolicySystemReason;
    executionId?: string;
};
export interface PolicyEnforcementBackend {
    enforce<Point extends EnforcementPoint>(point: Point, context: PolicyContext<Point>, actor: PolicyActor): Promise<PolicyDecision>;
    evaluate<Point extends EnforcementPoint>(point: Point, context: PolicyContext<Point>): Promise<PolicyDecision>;
    hasChecksFor(point: EnforcementPoint): boolean;
}
export {};
