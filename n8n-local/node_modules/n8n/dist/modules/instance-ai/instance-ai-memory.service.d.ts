import type { InstanceAiEnsureThreadResponse, InstanceAiRichMessagesResponse, InstanceAiThreadInfo, InstanceAiThreadListResponse, InstanceAiThreadHistoryQuery, InstanceAiThreadHistoryResponse, InstanceAiThreadMessagesResponse, InstanceAiThreadOrigin, InstanceAiThreadSource } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { type AgentBuilderTarget } from '@n8n/instance-ai';
import { DurableLogMetrics } from './event-bus/durable-log-metrics';
import { markExpiredConfirmations } from './message-parser';
import { InstanceAiCheckpointRepository } from './repositories/instance-ai-checkpoint.repository';
import { InstanceAiEventLogRepository } from './repositories/instance-ai-event-log.repository';
import { InstanceAiPendingConfirmationRepository } from './repositories/instance-ai-pending-confirmation.repository';
import { TypeORMAgentMemory } from './storage/typeorm-agent-memory';
export interface InstanceAiThreadLaunchMetadata {
    source: InstanceAiThreadSource;
    origin: InstanceAiThreadOrigin;
    sourceContext?: Record<string, unknown>;
}
export declare class InstanceAiMemoryService {
    private readonly logger;
    private readonly agentMemory;
    private readonly checkpointRepository;
    private readonly pendingConfirmationRepository;
    private readonly eventLogRepository;
    private readonly durableLogMetrics;
    private readonly instanceAiConfig;
    constructor(logger: Logger, globalConfig: GlobalConfig, agentMemory: TypeORMAgentMemory, checkpointRepository: InstanceAiCheckpointRepository, pendingConfirmationRepository: InstanceAiPendingConfirmationRepository, eventLogRepository: InstanceAiEventLogRepository, durableLogMetrics: DurableLogMetrics);
    getThreadInfo(threadId: string): Promise<InstanceAiThreadInfo>;
    listThreadHistory(userId: string, query: InstanceAiThreadHistoryQuery): Promise<InstanceAiThreadHistoryResponse>;
    listThreads(userId: string, page?: number, perPage?: number): Promise<InstanceAiThreadListResponse>;
    ensureThread(userId: string, threadId: string, projectId: string, launchMetadata: InstanceAiThreadLaunchMetadata, title?: string): Promise<InstanceAiEnsureThreadResponse>;
    seedOpeningMessages(threadId: string, userId: string, greeting: string, hiddenUserText?: string): Promise<{
        userMessageId: string;
    }>;
    restoreThreadMessages(userId: string, threadId: string, messages: Array<Record<string, unknown>>): Promise<{
        restored: number;
    }>;
    getThreadProjectId(threadId: string): Promise<string | undefined>;
    getThreadMessages(_userId: string, threadId: string, options?: {
        limit?: number;
        page?: number;
    }): Promise<InstanceAiThreadMessagesResponse>;
    getRichMessages(_userId: string, threadId: string, options?: {
        limit?: number;
        page?: number;
        excludeRunIds?: string[];
        excludeMessageGroupIds?: string[];
    }): Promise<Omit<InstanceAiRichMessagesResponse, 'nextEventId'>>;
    private foldSnapshotsFromLog;
    flagExpiredConfirmations(messages: Parameters<typeof markExpiredConfirmations>[0]): Promise<void>;
    private loadActiveCheckpoints;
    validateThreadOwnership(userId: string, threadId: string): Promise<boolean>;
    checkThreadOwnership(userId: string, threadId: string): Promise<'owned' | 'not_found' | 'other_user'>;
    deleteThread(threadId: string): Promise<void>;
    deleteThreadsForUser(userId: string): Promise<number>;
    renameThread(threadId: string, title: string): Promise<InstanceAiThreadInfo>;
    updateThread(threadId: string, updates: {
        title?: string;
        metadata?: Record<string, unknown>;
    }): Promise<InstanceAiThreadInfo>;
    bindAgentBuilderTarget(userId: string, threadId: string, target: AgentBuilderTarget): Promise<InstanceAiThreadInfo>;
    getThreadMetadata(userId: string, threadId: string): Promise<Record<string, unknown> | undefined>;
    cleanupExpiredThreads(onThreadDeleted?: (threadId: string) => Promise<void>, signal?: AbortSignal): Promise<number>;
    private toThreadInfo;
    private toThreadMessage;
}
