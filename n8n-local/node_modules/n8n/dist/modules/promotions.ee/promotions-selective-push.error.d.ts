import { type PromotionsWorkflowsMovedCrossProjectMeta } from '@n8n/api-types';
import { BadRequestError } from '@n8n/errors';
export declare class PromotionsWorkflowsMovedCrossProjectError extends BadRequestError {
    readonly meta: PromotionsWorkflowsMovedCrossProjectMeta;
    constructor(workflowIds: string[]);
}
