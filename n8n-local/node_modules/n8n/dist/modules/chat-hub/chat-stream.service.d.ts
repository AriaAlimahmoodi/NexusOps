import type { ChatHubAttachmentInfo, ChatHubMessageStatus, ChatMessageId, ChatSessionId } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { ExecutionsConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { Push } from '../../push';
import { Publisher } from '../../scaling/pubsub/publisher.service';
import { ChatStreamStateService } from './chat-stream-state.service';
export interface StartStreamParams {
    userId: string;
    sessionId: ChatSessionId;
    messageId: ChatMessageId;
    previousMessageId: ChatMessageId | null;
    retryOfMessageId: ChatMessageId | null;
    executionId: number | null;
}
export declare class ChatStreamService {
    private readonly logger;
    private readonly push;
    private readonly publisher;
    private readonly instanceSettings;
    private readonly executionsConfig;
    private readonly streamStore;
    constructor(logger: Logger, push: Push, publisher: Publisher, instanceSettings: InstanceSettings, executionsConfig: ExecutionsConfig, streamStore: ChatStreamStateService);
    startExecution(userId: string, sessionId: ChatSessionId): Promise<void>;
    endExecution(userId: string, sessionId: ChatSessionId, status: 'success' | 'error' | 'cancelled'): Promise<void>;
    startStream(params: StartStreamParams): Promise<void>;
    sendChunk(sessionId: ChatSessionId, messageId: ChatMessageId, content: string): Promise<void>;
    endStream(sessionId: ChatSessionId, messageId: ChatMessageId, status: ChatHubMessageStatus): Promise<void>;
    sendError(sessionId: ChatSessionId, messageId: ChatMessageId, error: string): Promise<void>;
    sendErrorDirect(userId: string, sessionId: ChatSessionId, messageId: ChatMessageId, error: string): Promise<void>;
    getPendingChunks(sessionId: ChatSessionId, lastReceivedSequence: number): Promise<Array<{
        sequenceNumber: number;
        content: string;
    }>>;
    hasActiveStream(sessionId: ChatSessionId): Promise<boolean>;
    getCurrentMessageId(sessionId: ChatSessionId): Promise<ChatMessageId | null>;
    handleRelayChatStreamEvent(payload: {
        eventType: 'execution-begin' | 'execution-end' | 'begin' | 'chunk' | 'end' | 'error';
        userId: string;
        sessionId: string;
        messageId: string;
        sequenceNumber: number;
        payload: {
            previousMessageId?: string | null;
            retryOfMessageId?: string | null;
            executionId?: number | null;
            content?: string;
            status?: ChatHubMessageStatus;
            error?: string;
        };
    }): void;
    private sendPushMessage;
    private shouldRelayViaPubSub;
    private relayViaPubSub;
    sendHumanMessage(params: {
        userId: string;
        sessionId: ChatSessionId;
        messageId: ChatMessageId;
        previousMessageId: ChatMessageId | null;
        content: string;
        attachments: ChatHubAttachmentInfo[];
    }): Promise<void>;
    sendMessageEdit(params: {
        userId: string;
        sessionId: ChatSessionId;
        revisionOfMessageId: ChatMessageId;
        messageId: ChatMessageId;
        content: string;
        attachments: ChatHubAttachmentInfo[];
    }): Promise<void>;
    private relayHumanMessageViaPubSub;
    private relayMessageEditViaPubSub;
    handleRelayChatHumanMessage(payload: {
        userId: string;
        sessionId: string;
        messageId: string;
        previousMessageId: string | null;
        content: string;
        attachments: Array<{
            id: string;
            fileName: string;
            mimeType: string;
        }>;
    }): void;
    handleRelayChatMessageEdit(payload: {
        userId: string;
        sessionId: string;
        revisionOfMessageId: string;
        messageId: string;
        content: string;
        attachments: Array<{
            id: string;
            fileName: string;
            mimeType: string;
        }>;
    }): void;
}
