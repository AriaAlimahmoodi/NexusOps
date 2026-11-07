import type { MessageRecord, TimelineEvent } from '../execution-recorder';
export declare const MAX_ITERATIONS_STOPPED_MESSAGE = "The agent has reached the maximum number of iterations and has stopped.";
export declare function applyFatalSessionOutcome(record: MessageRecord): MessageRecord;
export declare function isFatalSessionOutcomeError(error: string, timeline: TimelineEvent[] | null): boolean;
