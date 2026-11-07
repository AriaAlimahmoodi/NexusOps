import { Logger } from '@n8n/backend-common';
import type { BuiltFileStore } from '@n8n/agents';
import { BinaryDataService } from 'n8n-core';
import type { Readable } from 'node:stream';
import { AgentChatAttachment } from './entities/agent-chat-attachment.entity';
import { AgentChatAttachmentRepository } from './repositories/agent-chat-attachment.repository';
import { AgentExecutionThreadRepository } from './repositories/agent-execution-thread.repository';
export interface StoreInboundAttachmentParams {
    agentId: string | null;
    projectId: string;
    threadId: string;
    resourceId?: string;
    source: string;
    fileName: string;
    mimeType: string;
    data: Buffer;
}
export declare class AgentChatAttachmentService {
    private readonly logger;
    private readonly binaryDataService;
    private readonly repository;
    private readonly threadRepository;
    constructor(logger: Logger, binaryDataService: BinaryDataService, repository: AgentChatAttachmentRepository, threadRepository: AgentExecutionThreadRepository);
    storeInbound(params: StoreInboundAttachmentParams): Promise<AgentChatAttachment>;
    getForAgent(attachmentId: string, scope: {
        agentId: string;
        projectId: string;
        userId: string;
    }): Promise<AgentChatAttachment | null>;
    getStream(attachment: AgentChatAttachment): Promise<Readable>;
    deleteByIds(attachmentIds: string[]): Promise<void>;
    deleteByThread(threadId: string, scope: {
        projectId: string;
    } | {
        agentId: string;
    }): Promise<void>;
    deleteByAgent(agentId: string): Promise<void>;
    deleteFromSourceCreatedBefore(scope: {
        agentId: string;
        source: string;
    }, before: Date, signal?: AbortSignal): Promise<number>;
    deleteStoredData(binaryDataIds: string[], logContext: Record<string, string>): Promise<void>;
    private deleteAttachments;
    getFileStore(scope: {
        agentId: string;
        projectId: string;
    }, provider: string): BuiltFileStore;
}
