import type { AgentChatQueueResponse } from '@n8n/api-types';
import { TransactionRunner, type OperationContext } from '@n8n/db';
import { AgentChatAttachmentService } from './agent-chat-attachment.service';
import { AgentMessageSteeringService } from './agent-message-steering.service';
import { AgentsSettingsService } from './agents-settings.service';
import { AgentExecutionUpdateBroadcaster } from './agent-execution-update-broadcaster';
import { AgentExecutionService, type StartExecutionParams } from './agent-execution.service';
import type { AgentExecutionThread } from './entities/agent-execution-thread.entity';
import type { AgentMessageQueue } from './entities/agent-message-queue.entity';
import { N8NCheckpointStorage } from './integrations/n8n-checkpoint-storage';
import { AgentExecutionRepository } from './repositories/agent-execution.repository';
import { AgentExecutionThreadRepository } from './repositories/agent-execution-thread.repository';
import { AgentMessageQueueRepository } from './repositories/agent-message-queue.repository';
import { AgentMessageRepository } from './repositories/agent-message.repository';
import { AgentRepository } from './repositories/agent.repository';
import { type AgentExecutionAdmission, type AgentQueuedMessage, type QueuedIntegrationMessage, type QueuedUserChatMessage } from './types/agent-queued-message';
import { type AgentSessionMode } from './utils/agent-thread-access';
export interface ClaimedAgentMessage {
    item: AgentMessageQueue;
    payload: Omit<QueuedUserChatMessage, 'userId' | 'messageId'> | QueuedIntegrationMessage;
    thread: AgentExecutionThread;
    admission: AgentExecutionAdmission;
    recording: StartExecutionParams;
}
interface PendingMessageScope {
    projectId: string;
    agentId: string;
    threadId: string;
    userId: string;
    kind: QueuedUserChatMessage['kind'];
}
export declare class AgentMessageQueueService {
    private readonly txRunner;
    private readonly repository;
    private readonly threadRepository;
    private readonly executionRepository;
    private readonly executionService;
    private readonly checkpointStorage;
    private readonly agentRepository;
    private readonly attachments;
    private readonly updates;
    private readonly messages;
    private readonly steering;
    private readonly settingsService;
    onAvailable?: (threadId: string) => void;
    constructor(txRunner: TransactionRunner, repository: AgentMessageQueueRepository, threadRepository: AgentExecutionThreadRepository, executionRepository: AgentExecutionRepository, executionService: AgentExecutionService, checkpointStorage: N8NCheckpointStorage, agentRepository: AgentRepository, attachments: AgentChatAttachmentService, updates: AgentExecutionUpdateBroadcaster, messages: AgentMessageRepository, steering: AgentMessageSteeringService, settingsService: AgentsSettingsService);
    enqueue(input: {
        agentId: string;
        projectId: string;
        threadId: string;
        sessionMode: AgentSessionMode;
        source: string;
        payload: AgentQueuedMessage;
    }, onInserted?: (queueId: string) => void): Promise<{
        status: 'accepted';
        item: AgentMessageQueue;
    } | {
        status: 'duplicate';
    }>;
    private enqueueMessage;
    listPending(input: PendingMessageScope): Promise<AgentChatQueueResponse>;
    removePending(input: PendingMessageScope & {
        queueId: string;
    }): Promise<void>;
    updatePending(input: PendingMessageScope & {
        queueId: string;
        message: string;
    }): Promise<void>;
    reorderPending(input: {
        projectId: string;
        agentId: string;
        threadId: string;
        userId: string;
        queueId: string;
        targetQueueId: string;
        expectedQueueIds: string[];
        kind: QueuedUserChatMessage['kind'];
    }): Promise<void>;
    steer(input: {
        projectId: string;
        agentId: string;
        threadId: string;
        userId: string;
        queueId: string;
        executionId: string;
        kind: QueuedUserChatMessage['kind'];
    }): Promise<void>;
    private assertUserChatAccess;
    claimNext(threadId: string, canConsume: (item: AgentMessageQueue, thread: AgentExecutionThread, ctx: OperationContext) => Promise<boolean>): Promise<ClaimedAgentMessage | null>;
    settle(threadId: string, executionId: string): Promise<void>;
    recordFailure(claim: ClaimedAgentMessage, error: unknown, signal?: AbortSignal): Promise<void>;
    private isBlocked;
    private recordingFor;
    private restoreInput;
}
export {};
