import type { ChatHubMessageStatus, ChatMessageId, ChatSessionId } from '../chat-hub';
export interface ChatHubStreamMetadata {
    sessionId: ChatSessionId;
    messageId: ChatMessageId;
    sequenceNumber: number;
    timestamp: number;
}
export type ChatHubStreamBegin = {
    type: 'chatHubStreamBegin';
    data: ChatHubStreamMetadata & {
        previousMessageId: ChatMessageId | null;
        retryOfMessageId: ChatMessageId | null;
        executionId: number | null;
    };
};
export type ChatHubStreamChunk = {
    type: 'chatHubStreamChunk';
    data: ChatHubStreamMetadata & {
        content: string;
    };
};
export type ChatHubStreamEnd = {
    type: 'chatHubStreamEnd';
    data: ChatHubStreamMetadata & {
        status: ChatHubMessageStatus;
    };
};
export type ChatHubStreamError = {
    type: 'chatHubStreamError';
    data: ChatHubStreamMetadata & {
        error: string;
    };
};
export interface ChatHubAttachmentInfo {
    id: string;
    fileName: string;
    mimeType: string;
}
export type ChatHubHumanMessageCreated = {
    type: 'chatHubHumanMessageCreated';
    data: {
        sessionId: ChatSessionId;
        messageId: ChatMessageId;
        previousMessageId: ChatMessageId | null;
        content: string;
        attachments: ChatHubAttachmentInfo[];
        timestamp: number;
    };
};
export type ChatHubMessageEdited = {
    type: 'chatHubMessageEdited';
    data: {
        sessionId: ChatSessionId;
        revisionOfMessageId: ChatMessageId;
        messageId: ChatMessageId;
        content: string;
        attachments: ChatHubAttachmentInfo[];
        timestamp: number;
    };
};
export type ChatHubExecutionBegin = {
    type: 'chatHubExecutionBegin';
    data: {
        sessionId: ChatSessionId;
        timestamp: number;
    };
};
export type ChatHubExecutionEnd = {
    type: 'chatHubExecutionEnd';
    data: {
        sessionId: ChatSessionId;
        status: ChatHubMessageStatus;
        timestamp: number;
    };
};
export type ChatHubStreamEvent = ChatHubStreamBegin | ChatHubStreamChunk | ChatHubStreamEnd | ChatHubStreamError;
export type ChatHubExecutionEvent = ChatHubExecutionBegin | ChatHubExecutionEnd;
export type ChatHubPushMessage = ChatHubStreamEvent | ChatHubExecutionEvent | ChatHubHumanMessageCreated | ChatHubMessageEdited;
