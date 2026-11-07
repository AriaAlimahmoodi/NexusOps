import type { WorkflowReviewDecisionIneligibilityReason } from '@n8n/api-types';
export interface WorkflowReviewDecisionFacts {
    canReadEveryWorkflow: boolean;
    isAuthor: boolean;
    isAssignedReviewer: boolean;
    hasAdminOverride: boolean;
}
export type WorkflowReviewDecisionCapability = {
    allowed: true;
} | {
    allowed: false;
    reason: WorkflowReviewDecisionIneligibilityReason;
};
export declare function resolveDecisionCapability(facts: WorkflowReviewDecisionFacts): WorkflowReviewDecisionCapability;
