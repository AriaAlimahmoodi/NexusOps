import { UnexpectedError } from '@n8n/errors';
export declare class ExecutionNotFoundError extends UnexpectedError {
    constructor(executionId: string);
}
