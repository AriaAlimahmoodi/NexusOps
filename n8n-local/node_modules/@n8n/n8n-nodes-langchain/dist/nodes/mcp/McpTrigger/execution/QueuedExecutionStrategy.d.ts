import type { Tool } from '@langchain/core/tools';
import type { ExecutionContext, ExecutionStrategy } from './ExecutionStrategy';
import type { PendingCallsManager } from './PendingCallsManager';
export declare class QueuedExecutionStrategy implements ExecutionStrategy {
    private pendingCalls;
    private timeoutMs;
    constructor(pendingCalls: PendingCallsManager, timeoutMs?: number);
    executeTool(tool: Tool, args: Record<string, unknown>, context: ExecutionContext): Promise<unknown>;
    resolveToolCall(callId: string, result: unknown): boolean;
    rejectToolCall(callId: string, error: Error): boolean;
    getPendingCallsManager(): PendingCallsManager;
}
