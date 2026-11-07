import type { ActionableCause, TimedCause } from 'n8n-workflow';
export type PollFailureType = 'transient' | 'permanent';
export declare const MAX_BACKOFF_MS: number;
export declare const RETRY_AFTER_MAX_MS: number;
export type PollFailure = {
    type: PollFailureType;
    retryAfterMs: number | null;
    cause?: TimedCause | ActionableCause;
};
export declare function pollFailureFromError(error: unknown, now: Date): PollFailure;
export declare function computeBackoffDelayMs(args: {
    type: PollFailureType;
    consecutiveErrors: number;
    retryAfterMs: number | null;
}): number;
