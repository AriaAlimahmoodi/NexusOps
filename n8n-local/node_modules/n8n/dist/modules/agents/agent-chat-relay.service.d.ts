import { type AgentChatAttachmentPayload, type AgentSseEvent } from '@n8n/api-types';
import type { Response } from 'express';
import { AgentChatAttachmentService } from './agent-chat-attachment.service';
import { AgentMessageQueueService } from './agent-message-queue.service';
import { AgentQueuedPreviewStreamService } from './agent-queued-preview-stream.service';
import { type FlushableResponse } from './agent-sse-stream';
import type { AgentChatAttachment } from './entities/agent-chat-attachment.entity';
import type { StoredAttachmentRef } from './types/agent-chat-attachment';
export declare class AgentChatRelayService {
    private readonly messageQueue;
    private readonly queuedPreviewStreams;
    private readonly agentChatAttachmentService;
    constructor(messageQueue: AgentMessageQueueService, queuedPreviewStreams: AgentQueuedPreviewStreamService, agentChatAttachmentService: AgentChatAttachmentService);
    createChatExecution(res: FlushableResponse): {
        send: (event: AgentSseEvent) => void;
        abortSignal: AbortSignal;
        onExecutionStarted: (id: string, sessionId: string, inputMessageIds: string[]) => void;
        onChunk: (chunk: import("./types/agent-steering").AgentExecutionStreamChunk) => void;
        close: () => void;
    };
    storeChatAttachments(params: {
        attachments: AgentChatAttachmentPayload[] | undefined;
        agentId: string;
        projectId: string;
        threadId: string;
        resourceId: string;
        source?: string;
    }): Promise<StoredAttachmentRef[] | undefined>;
    relayQueuedMessage(res: FlushableResponse, accept: (send: (event: AgentSseEvent) => void, abortSignal: AbortSignal) => Promise<Parameters<AgentMessageQueueService['enqueue']>[0] | undefined>): Promise<void>;
    streamAttachment(attachment: AgentChatAttachment, res: Response): Promise<void>;
}
