import { UserError } from 'n8n-workflow';
import type { WorkflowNotFoundReason } from './mcp.types';
export declare class McpExecutionTimeoutError extends UserError {
    executionId: string | null;
    timeoutMs: number;
    constructor(executionId: string | null, timeoutMs: number);
}
export declare class WorkflowAccessError extends UserError {
    readonly reason: WorkflowNotFoundReason;
    constructor(message: string, reason: WorkflowNotFoundReason);
}
