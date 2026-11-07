import { EventService } from '@n8n/backend-services';
export declare class DurableLogMetrics {
    private readonly eventService;
    drain: {
        batches: number;
        rowsWritten: number;
        bytesWritten: number;
        appendConflicts: number;
        appendFailures: number;
        queueLatencyMsTotal: number;
        queueLatencyMsMax: number;
        queueLatencySamples: number;
    };
    sse: {
        replaysServed: number;
        replayEventsServed: number;
        cursorAgeEventsTotal: number;
        cursorAgeEventsMax: number;
    };
    history: {
        foldReads: number;
        foldLatencyMsTotal: number;
        treesDerived: number;
    };
    sweep: {
        runsExamined: number;
        runsMarkedInterrupted: number;
        runsCrashResumed: number;
        toolInterruptedFacts: number;
    };
    constructor(eventService: EventService);
    recordDrainBatch(rows: number, bytes: number): void;
    recordQueueLatency(ms: number): void;
    recordAppendConflict(attempt: number): void;
    recordAppendFailure(events: number): void;
    recordReplay(eventsServed: number, cursorAgeEvents: number): void;
    recordFoldRead(latencyMs: number, trees: number): void;
    recordSweepRunExamined(): void;
    recordSweepToolInterruptedFact(): void;
    recordSweepOutcome(outcome: 'interrupted' | 'crash-resumed', toolInterruptedFacts: number): void;
}
