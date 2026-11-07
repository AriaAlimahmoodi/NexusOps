import { type WorkflowReviewActivityEntry, type WorkflowReviewEligibleReviewer, type WorkflowReviewRequestSummary } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
import type { User, WorkflowReviewActivity, WorkflowReviewActivityComment, WorkflowReviewRequest } from '@n8n/db';
export declare function toEligibleReviewer(user: User): WorkflowReviewEligibleReviewer;
export declare function toRequestSummary(request: WorkflowReviewRequest, workflowVersionId: string | null): WorkflowReviewRequestSummary;
export declare function toActivityEntry(row: WorkflowReviewActivity, messages: WorkflowReviewActivityComment[], usersById: Map<string, WorkflowReviewEligibleReviewer>, logger: Logger): WorkflowReviewActivityEntry;
