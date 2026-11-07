export type PollCursorCommitOperation = 'with_execution' | 'cursor_only';
export type PollCursorCommitResult = 'success' | 'fence_rejected' | 'failure';
export type PollTriggerMetricsEventMap = {
    'poll-cursor-commit-settled': {
        operation: PollCursorCommitOperation;
        result: PollCursorCommitResult;
        durationMs: number;
    };
    'poll-tick-timed-out': {
        nodeType: string;
    };
};
