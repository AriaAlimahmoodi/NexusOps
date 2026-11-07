import { BadRequestError } from '@n8n/errors';
export declare class WorkflowDeactivationBadRequestError extends BadRequestError {
    readonly meta: {
        description?: string;
    };
    constructor(message: string, meta?: {
        description?: string;
    });
}
