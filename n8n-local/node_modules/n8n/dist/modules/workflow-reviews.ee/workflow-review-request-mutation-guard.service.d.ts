import { SharedWorkflowRepository, WorkflowRepository, type OperationContext, type WorkflowReviewRequest } from '@n8n/db';
type BlockedAction = 'submit' | 'review' | 'update';
export declare function assertWorkflowReviewRequestUpdatable(request: WorkflowReviewRequest): void;
export declare class WorkflowReviewRequestMutationGuard {
    private readonly workflowRepository;
    private readonly sharedWorkflowRepository;
    constructor(workflowRepository: WorkflowRepository, sharedWorkflowRepository: SharedWorkflowRepository);
    assertWorkflowStillReviewable(workflowId: string, expectedProjectId: string, ctx: OperationContext, action: BlockedAction): Promise<void>;
}
export {};
