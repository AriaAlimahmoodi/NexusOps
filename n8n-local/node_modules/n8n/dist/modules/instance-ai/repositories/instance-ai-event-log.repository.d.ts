import type { AiPreferencesAppliedPayload, InstanceAiEvent, InstanceAiSetupItem } from '@n8n/api-types';
import type { StoredEvent } from '@n8n/instance-ai';
import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceAiEventLogEntry } from '../entities/instance-ai-event-log-entry.entity';
export interface UnfinishedRun {
    threadId: string;
    runId: string;
}
export declare class InstanceAiEventLogRepository extends Repository<InstanceAiEventLogEntry> {
    constructor(dataSource: DataSource);
    maxSeq(threadId: string): Promise<number>;
    appendBatch(threadId: string, firstSeq: number, events: InstanceAiEvent[]): Promise<number>;
    payloadAt(threadId: string, seq: number): Promise<string | null>;
    getAfter(threadId: string, afterSeq: number): Promise<StoredEvent[]>;
    getForRuns(threadId: string, runIds: string[]): Promise<InstanceAiEvent[]>;
    getActivityTerminalEvents(threadId: string, runIds: string[]): Promise<InstanceAiEvent[]>;
    getForThreadRuns(threadId: string, runIds: string[]): Promise<Array<{
        runId: string;
        createdAt: Date;
        event: InstanceAiEvent;
    }>>;
    findRunIdsInWindow(threadId: string, window: {
        since?: Date;
        before?: Date;
    }): Promise<string[]>;
    getRunStarts(threadId: string): Promise<Array<{
        runId: string;
        messageGroupId?: string;
    }>>;
    findLangsmithAnchor(threadId: string, responseId: string): Promise<{
        langsmithRunId: string;
        langsmithTraceId: string;
    } | undefined>;
    getSetupItemsSnapshots(threadId: string): Promise<Array<{
        workflowId: string;
        items: InstanceAiSetupItem[];
    }>>;
    getLastPreferencesInjectionRunId(threadId: string): Promise<string | undefined>;
    getLastAppliedPreferences(threadId: string): Promise<AiPreferencesAppliedPayload | undefined>;
    private findLastPreferencesApplied;
    lastFactAt(threadId: string, runId: string): Promise<Date | null>;
    findUnfinishedRuns(threadId?: string): Promise<UnfinishedRun[]>;
    private toEvent;
}
