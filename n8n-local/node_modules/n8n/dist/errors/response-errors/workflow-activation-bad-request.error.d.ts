import { BadRequestError } from '@n8n/errors';
export declare class WorkflowActivationBadRequestError extends BadRequestError {
    readonly meta: {
        nodeId?: string;
        validationError?: boolean;
        description?: string;
    };
    constructor(message: string, meta?: {
        nodeId?: string;
        validationError?: boolean;
        description?: string;
    });
}
