import { WorkflowReviewRequestRepository } from '@n8n/db';
import type { WorkflowPublishGuard } from '@n8n/backend-services';
import { WorkflowReviewFeatureGate } from './workflow-review-feature-gate.service';
export declare class WorkflowReviewPublishGuard implements WorkflowPublishGuard {
    private readonly featureGate;
    private readonly workflowReviewRequestRepository;
    constructor(featureGate: WorkflowReviewFeatureGate, workflowReviewRequestRepository: WorkflowReviewRequestRepository);
    assertCanPublish(workflowId: string): Promise<void>;
}
