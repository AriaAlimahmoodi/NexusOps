import type { WorkflowReviewBlockedDetails } from '@n8n/api-types';
import { ConflictError } from '@n8n/errors';
export declare class WorkflowPublishBlockedError extends ConflictError {
    readonly details: WorkflowReviewBlockedDetails;
    constructor(details: WorkflowReviewBlockedDetails);
}
