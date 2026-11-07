import type { ExecutionRedaction, ExecutionRedactionOptions, RedactableExecution } from './execution-redaction';
export declare class ExecutionRedactionServiceProxy implements ExecutionRedaction {
    private executionRedaction?;
    setExecutionRedaction(executionRedaction: ExecutionRedaction): void;
    processExecution(execution: RedactableExecution, options: ExecutionRedactionOptions): Promise<RedactableExecution>;
    processExecutions(executions: RedactableExecution[], options: ExecutionRedactionOptions): Promise<void>;
}
