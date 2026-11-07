import { OperationalError } from '@n8n/errors';
export declare class ExecutionAlreadyResumingError extends OperationalError {
    constructor(executionId: string);
}
