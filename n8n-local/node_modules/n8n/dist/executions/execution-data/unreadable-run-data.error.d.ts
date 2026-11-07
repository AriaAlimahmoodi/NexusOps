import { UnexpectedError } from 'n8n-workflow';
import type { ExecutionRef } from './types';
export declare class UnreadableRunDataError extends UnexpectedError {
    constructor(ref: ExecutionRef);
}
