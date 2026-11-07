import { type InstanceAiEvent } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { StoredEvent } from '@n8n/instance-ai';
import { DurableLogMetrics } from './durable-log-metrics';
import { InstanceAiEventLogRepository } from '../repositories/instance-ai-event-log.repository';
export interface DrainedEvent {
    id?: number;
    event: InstanceAiEvent;
    live: boolean;
}
export interface OpenSegment {
    runId: string;
    agentId: string;
    responseId?: string;
    kind: 'text' | 'reasoning';
    text: string;
}
type EmitFn = (drained: DrainedEvent) => void;
export declare class DurableEventLog {
    private readonly logger;
    private readonly repo;
    private readonly metrics;
    private readonly pendingByThread;
    private readonly draining;
    private readonly lastSeq;
    private readonly buffers;
    private readonly emitters;
    private readonly activityByThread;
    private readonly lifecycles;
    private readonly idleFlushTimers;
    idleFlushMs: number;
    constructor(logger: Logger, repo: InstanceAiEventLogRepository, metrics: DurableLogMetrics);
    publish(threadId: string, event: InstanceAiEvent, emit: EmitFn): void;
    private scheduleIdleFlush;
    private settleIdleThread;
    retainedThreadCount(): number;
    getEventsAfter(threadId: string, afterSeq: number): Promise<StoredEvent[]>;
    getEventsForRuns(threadId: string, runIds: string[]): Promise<InstanceAiEvent[]>;
    getSetupItemsSnapshots(threadId: string): Promise<{
        workflowId: string;
        items: import("@n8n/api-types").InstanceAiSetupItem[];
    }[]>;
    getLastPreferencesInjectionRunId(threadId: string): Promise<string | undefined>;
    getLastAppliedPreferences(threadId: string): Promise<{
        preferences: {
            id: string;
            scope: "instance" | "project" | "user";
            projectId?: string | undefined;
            projectName?: string | undefined;
        }[];
        renderedLength: number;
        injectedThisTurn: true;
        carriedFromRunId?: undefined;
    } | {
        preferences: {
            id: string;
            scope: "instance" | "project" | "user";
            projectId?: string | undefined;
            projectName?: string | undefined;
        }[];
        renderedLength: number;
        injectedThisTurn: false;
        carriedFromRunId?: string | undefined;
    } | undefined>;
    getOpenSegments(threadId: string): OpenSegment[];
    getNextEventId(threadId: string): Promise<number>;
    clearThread(threadId: string): void;
    clear(): void;
    private resolvePendingFlushes;
    flush(threadId: string): Promise<void>;
    flushAll(): Promise<void>;
    private ensureDraining;
    private drainBatch;
    private currentLifecycle;
    private takeAllOpenBlocks;
    private persistWithRetry;
    private didBatchCommit;
    private bufferDelta;
    private markBufferedPartsEmitted;
    private flushBlocks;
    private rollSegmentOnResponseChange;
    private takeBlock;
    private currentSeq;
    private getOrCreateBuffer;
    private takePending;
}
export {};
