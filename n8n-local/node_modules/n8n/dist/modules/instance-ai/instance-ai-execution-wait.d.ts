import type { ActiveExecutions } from '../../active-executions';
export type ExecutionWaitOutcome = {
    kind: 'completed';
} | {
    kind: 'cancelled';
    reason: 'timeout' | 'abort';
    message: string;
};
export declare function waitForInstanceAiExecution(args: {
    activeExecutions: ActiveExecutions;
    executionId: string;
    timeoutMs: number;
    abortSignal?: AbortSignal;
}): Promise<ExecutionWaitOutcome>;
