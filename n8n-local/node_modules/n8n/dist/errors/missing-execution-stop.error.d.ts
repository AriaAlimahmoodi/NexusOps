import { UserError } from '@n8n/errors';
export declare class MissingExecutionStopError extends UserError {
    constructor(executionId: string);
}
