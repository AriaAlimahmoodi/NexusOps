import type { WorkflowPublishForbiddenDetails } from '@n8n/api-types';
import { ForbiddenError } from '@n8n/errors';
export declare class WorkflowPublishForbiddenError extends ForbiddenError {
    readonly details: WorkflowPublishForbiddenDetails;
    readonly meta: Record<string, unknown>;
    constructor(details: WorkflowPublishForbiddenDetails);
}
