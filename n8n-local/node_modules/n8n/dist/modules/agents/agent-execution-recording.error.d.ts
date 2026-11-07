import { OperationalError } from 'n8n-workflow';
type RecordingFailure = {
    cause: unknown;
    executionError?: unknown;
} & ({
    phase: 'create';
    executionId?: never;
    executionStarted?: never;
} | {
    phase: 'finalize';
    executionId: string;
    executionStarted: boolean;
});
export declare class AgentExecutionRecordingError extends OperationalError {
    readonly phase: 'create' | 'finalize';
    readonly executionId?: string;
    readonly executionStarted: boolean;
    readonly executionError?: unknown;
    constructor(failure: RecordingFailure);
}
export {};
