import { UnexpectedError } from 'n8n-workflow';
import type { ExecutionRef } from './types';
export declare class ExecutionDataWriteError extends UnexpectedError {
    constructor(ref: ExecutionRef, cause: unknown);
}
