import { UnexpectedError } from 'n8n-workflow';
import type { ExecutionRef } from './types';
export declare class MissingExecutionDataError extends UnexpectedError {
    constructor(ref: ExecutionRef);
}
