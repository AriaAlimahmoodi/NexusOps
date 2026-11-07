import { UnexpectedError } from 'n8n-workflow';
import type { AgentExecutionLogRef } from './agent-execution-log-store';
export declare class AgentExecutionLogWriteError extends UnexpectedError {
    constructor(ref: AgentExecutionLogRef, cause: unknown);
}
