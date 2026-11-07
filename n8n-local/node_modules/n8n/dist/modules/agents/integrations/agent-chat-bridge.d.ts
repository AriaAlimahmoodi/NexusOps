import { type StreamChunk } from '@n8n/agents';
import { type AgentIntegrationConfig } from '@n8n/api-types';
import { type HttpRequestClient } from '@n8n/backend-network';
import type { Chat } from 'chat';
import { type Logger } from 'n8n-workflow';
import { AgentChatAttachmentService } from '../agent-chat-attachment.service';
import { AgentMessageQueueService } from '../agent-message-queue.service';
import type { AgentExecutionAdmission, QueuedIntegrationMessage } from '../types/agent-queued-message';
import type { AgentExecutionStreamChunk } from '../types/agent-steering';
import type { AgentExecutionOrchestratorService, ExecuteForChatPublishedConfig } from '../agent-execution-orchestrator.service';
import type { AgentSessionMode } from '../utils/agent-thread-access';
import { type CallbackMetadata } from './callback-store';
import type { ComponentMapper, ShortenCallback } from './component-mapper';
import { IntegrationMessageContextService } from './integration-message-context.service';
import type { IntegrationMessageContext } from './integration-tools';
import { type InternalThread } from './types';
interface AgentExecutor extends Pick<AgentExecutionOrchestratorService, 'resumeForChat'> {
    getSessionMode?(threadId: string): Promise<AgentSessionMode>;
    executeForChatPublished(config: Omit<ExecuteForChatPublishedConfig, 'memory'> & {
        memory: {
            threadId: InternalThread;
            resourceId: string;
        };
    }): AsyncGenerator<AgentExecutionStreamChunk>;
    findOpenSuspension?(config: {
        agentId: string;
        threadId: string;
    }): Promise<OpenSuspension | null>;
    isResumable?(config: {
        agentId: string;
        runId: string;
    }): Promise<boolean>;
}
interface OpenSuspension {
    suspendPayload?: unknown;
}
export declare class AgentChatBridge {
    private readonly chat;
    private readonly agentId;
    private readonly agentService;
    private readonly componentMapper;
    private readonly logger;
    private readonly n8nProjectId;
    private readonly integration;
    private readonly attachmentService?;
    private readonly discordHttpClient?;
    private readonly messageQueue;
    private readonly callbackStore?;
    private readonly integrationImpl;
    private readonly messageContextBridge;
    private readonly streamConsumer;
    private readonly hitlResumeHandler;
    constructor(chat: Chat, agentId: string, agentService: AgentExecutor, componentMapper: ComponentMapper, logger: Logger, n8nProjectId: string, integration: AgentIntegrationConfig, messageContextStore?: IntegrationMessageContextService, attachmentService?: AgentChatAttachmentService | undefined, discordHttpClient?: HttpRequestClient | undefined, messageQueue?: AgentMessageQueueService);
    static create(chat: Chat, agentId: string, agentService: AgentExecutionOrchestratorService, componentMapper: ComponentMapper, logger: Logger, n8nProjectId: string, integration: AgentIntegrationConfig): AgentChatBridge;
    private registerHandlers;
    private handleFollowUp;
    private canUserAccess;
    private anchorInboundThread;
    resumeInAgentThread(agentThreadId: string, runId: string, toolCallId: string, resumeData: unknown, context?: {
        messageContext: IntegrationMessageContext | null;
        allowLegacyThreadId: boolean;
    }): Promise<void>;
    deliverWakeResponse(threadId: string, chunks: AgentExecutionStreamChunk[], cardRecipientId?: string): Promise<void>;
    deliverBackgroundApproval(threadId: string, { jobId, title, token, toolCall, }: {
        jobId: string;
        title: string;
        token: string;
        toolCall: Extract<StreamChunk, {
            type: 'tool-call-suspended';
        }>;
    }): Promise<void>;
    private resolvePlatformThreadId;
    private toAgentThreadId;
    private baseThreadId;
    private resolveActiveThreadId;
    private resetSession;
    private withSessionLock;
    private computeGeneration;
    private hasOpenSuspension;
    private sessionLockKey;
    getShortenCallback(metadata?: CallbackMetadata): ShortenCallback | undefined;
    private handleInboundMessage;
    private readInboundMessage;
    private fetchInboundAttachments;
    private runTurn;
    private resolveTurnSession;
    private enqueueTurn;
    consumeQueuedMessage(payload: QueuedIntegrationMessage, threadId: string, admittedExecution: AgentExecutionAdmission, abortSignal: AbortSignal, integration: AgentIntegrationConfig): Promise<void>;
    private restoreQueuedReplyThread;
    private storeInboundAttachments;
    private fetchAttachmentData;
    private resolveBridgeExecutionContext;
    private handleSuspension;
    private deliverSuspensionCard;
    private handleMessage;
    private getPlatformAgentContext;
    private getInboundText;
    private prepareInboundText;
    private postErrorToThread;
}
export {};
