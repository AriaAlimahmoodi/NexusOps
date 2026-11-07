import type { AgentExecutionStatus, AgentMessageAuthor, AgentN8nChatThreadSummary, AgentN8nChatThreadsResponse, AgentSessionPreviewAccess, AgentSessionQueryFilters, AgentSessionStatus } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { TransactionRunner, type OperationContext } from '@n8n/db';
import { ErrorReporter, StorageConfig } from 'n8n-core';
import type { AgentRunTelemetryType, IAgentConfigurationTelemetryProperties } from '../../interfaces';
import { Telemetry } from '../../telemetry';
import { AgentChatAttachmentService } from './agent-chat-attachment.service';
import type { StoredAttachmentRef } from './types/agent-chat-attachment';
import { AgentExecutionUpdateBroadcaster } from './agent-execution-update-broadcaster';
import { AgentMessageQueueRepository } from './repositories/agent-message-queue.repository';
import { type AgentExecutionAdmission } from './types/agent-queued-message';
import { AgentMessageRepository } from './repositories/agent-message.repository';
import type { AgentMessageOrigin } from './entities/agent-message.entity';
import { AgentExecutionThread, type AgentThreadAccess } from './entities/agent-execution-thread.entity';
import { AgentExecution, type AgentExecutionHitlStatus } from './entities/agent-execution.entity';
import type { MessageRecord, TimelineEvent } from './execution-recorder';
import { AgentExecutionLogStore, type AgentExecutionLogRef } from './execution-log/agent-execution-log-store';
import { N8nMemory } from './integrations/n8n-memory';
import { N8NCheckpointStorage } from './integrations/n8n-checkpoint-storage';
import { type AgentSessionMode } from './utils/agent-thread-access';
import { AgentExecutionThreadRepository } from './repositories/agent-execution-thread.repository';
import type { AgentExecutionThreadMetadata } from './repositories/agent-execution-thread.repository';
import { AgentExecutionRepository, type RunningAgentExecution } from './repositories/agent-execution.repository';
import { type ThreadFailureSummary } from './utils/execution-failure-summary';
export interface RecordMessageParams {
    threadId: string;
    agentId: string;
    agentName: string;
    projectId: string;
    userMessage: string | null;
    author?: AgentMessageAuthor;
    attachments?: StoredAttachmentRef[];
    record: MessageRecord;
    hitlStatus?: AgentExecutionHitlStatus;
    source?: string;
    threadMetadata?: AgentExecutionThreadMetadata;
    taskId?: string;
    taskVersionId?: string;
    telemetry?: {
        userId?: string;
        runType: AgentRunTelemetryType;
        configuration: IAgentConfigurationTelemetryProperties;
    };
}
export interface StartExecutionParams extends Omit<RecordMessageParams, 'record' | 'hitlStatus'> {
    resourceId: string;
    messageOrigin?: Omit<AgentMessageOrigin, 'source' | 'hidden'>;
    hideUserMessageFromTranscript?: boolean;
    access: AgentThreadAccess;
    previewChat?: boolean;
    acceptsSteering?: boolean;
    sessionMode?: AgentSessionMode;
    initialTimeline?: TimelineEvent[];
    queueItemId?: string;
    resumeRunId?: string;
    allowSuspendedPredecessor?: boolean;
}
export interface AgentExecutionReservation {
    execution: AgentExecution;
    needsTitleSync: boolean;
    inputMessageIds: string[];
}
interface TimelineSnapshotParams extends AgentExecutionLogRef {
    projectId: string;
    timeline: TimelineEvent[];
}
export interface ThreadDetail {
    thread: AgentExecutionThread;
    executions: AgentExecution[];
}
export interface ThreadListItem extends Omit<AgentExecutionThread, 'generateId' | 'setUpdateDate' | 'ownerId' | 'accessScope' | 'owner'>, AgentSessionPreviewAccess {
    firstMessage: string | null;
    source: string | null;
    failureSummary: ThreadFailureSummary | null;
    status: AgentSessionStatus | null;
}
export declare class AgentExecutionService {
    private readonly logger;
    private readonly agentExecutionRepository;
    private readonly agentExecutionThreadRepository;
    private readonly n8nMemory;
    private readonly telemetry;
    private readonly agentChatAttachmentService;
    private readonly agentExecutionLogStore;
    private readonly storageConfig;
    private readonly errorReporter;
    private readonly executionUpdateBroadcaster;
    private readonly checkpointStorage;
    private readonly txRunner;
    private readonly queueRepository;
    private readonly messageRepository;
    private static readonly logDeletionBatchSize;
    private static readonly heartbeatIntervalMs;
    private readonly heartbeatTimers;
    private readonly executionControllers;
    private readonly pendingTimelineSnapshots;
    private readonly timelineSnapshotWrites;
    private readonly pausedTimelineSnapshots;
    private readonly executionsNeedingTitleSync;
    private readonly sideCallReportInFlight;
    private readonly sideCallUsageInFlightByExecution;
    constructor(logger: Logger, agentExecutionRepository: AgentExecutionRepository, agentExecutionThreadRepository: AgentExecutionThreadRepository, n8nMemory: N8nMemory, telemetry: Telemetry, agentChatAttachmentService: AgentChatAttachmentService, agentExecutionLogStore: AgentExecutionLogStore, storageConfig: StorageConfig, errorReporter: ErrorReporter, executionUpdateBroadcaster: AgentExecutionUpdateBroadcaster, checkpointStorage: N8NCheckpointStorage, txRunner: TransactionRunner, queueRepository: AgentMessageQueueRepository, messageRepository: AgentMessageRepository);
    startExecutionRecording(params: StartExecutionParams, startedAt: Date): Promise<AgentExecutionAdmission>;
    reserveExecution(params: StartExecutionParams, startedAt: Date, ctx: OperationContext, lockedQueueThread?: AgentExecutionThread): Promise<AgentExecutionReservation>;
    private reserveInput;
    private checkAdmission;
    activateExecution({ execution, needsTitleSync }: AgentExecutionReservation, params: StartExecutionParams): void;
    getAbortSignal(executionId: string): AbortSignal;
    recordTimelineSnapshot({ executionId, ...snapshot }: TimelineSnapshotParams): void;
    withTimelineWritesPaused<T>(executionId: string, commit: () => Promise<T>): Promise<T>;
    finalizeExecution(executionId: string, params: RecordMessageParams): Promise<string>;
    private deleteUnreferencedTimelineBlob;
    finalizeInterruptedExecution(execution: RunningAgentExecution, staleBefore: Date): Promise<boolean>;
    private notifyInterruptedExecution;
    private startHeartbeat;
    private abortLostExecution;
    private stopHeartbeat;
    private ensureTimelineSnapshotWrite;
    private drainTimelineSnapshots;
    prepareThread(params: StartExecutionParams, ctx: OperationContext): Promise<{
        created: boolean;
        thread: AgentExecutionThread;
    }>;
    private completeRecordedExecution;
    findLatestSuspendedRun(threadId: string): Promise<AgentExecution | null>;
    private backfillSuspendedExecutions;
    private syncTitleFromMemory;
    deleteThread(projectId: string, agentId: string, threadId: string, userId: string): Promise<boolean>;
    deleteExecutionLogsForAgent(agentId: string): Promise<void>;
    getThreads(projectId: string, agentId: string, userId: string, limit: number, cursor?: string, filters?: AgentSessionQueryFilters): Promise<{
        threads: ThreadListItem[];
        nextCursor: string | null;
    }>;
    findN8nChatThreadsForAgents(userId: string, agentIds: string[], options: {
        limit: number;
        cursor?: string;
        search?: string;
    }): Promise<AgentN8nChatThreadsResponse>;
    findN8nChatThreadForAgents(userId: string, agentIds: string[], threadId: string): Promise<AgentN8nChatThreadSummary | null>;
    countN8nChatThreadsByAgent(userId: string, projectIds: string[] | null): Promise<Map<string, number>>;
    private toThreadListItems;
    getThreadDetail(threadId: string, projectId: string, agentId: string, userId: string): Promise<ThreadDetail | null>;
    private hydrateExecutionInputs;
    private inputMessageToDto;
    private hydrateTimelines;
    findThreadById(threadId: string): Promise<AgentExecutionThread | null>;
    canUseDraftThread(threadId: string, projectId: string, agentId: string, userId: string, options?: {
        previewChat?: boolean;
        sessionMode?: AgentSessionMode;
    }): Promise<boolean>;
    canUseProductionChatThread(threadId: string, projectId: string, agentId: string, userId: string, sessionMode: AgentSessionMode): Promise<boolean>;
    private canUseUnrecordedThread;
    getSessionMode(threadId: string): Promise<AgentSessionMode>;
    private toBlobRefs;
    private writeTerminalExecution;
    private moveFinalTimelineToBlob;
    private writeTimelineSnapshot;
    private updateThreadAfterExecution;
    recordSideCallUsage(executionId: string, threadId: string, report: {
        task: string;
        model?: string;
        cost: number;
        reportId: string;
    }): Promise<void>;
    private applySideCallUsage;
    private trackFinishedTurn;
}
export declare function toSessionStatus(latestStatus: AgentExecutionStatus | undefined): AgentSessionStatus | null;
export {};
