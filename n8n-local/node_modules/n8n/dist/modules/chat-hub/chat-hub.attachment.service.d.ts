import type { ChatMessageId, ChatSessionId, ChatAttachment } from '@n8n/api-types';
import type { EntityManager } from '@n8n/typeorm';
import { BinaryDataService } from 'n8n-core';
import { type IBinaryData } from 'n8n-workflow';
import type Stream from 'node:stream';
import { ChatHubMessageRepository } from './chat-message.repository';
export declare class ChatHubAttachmentService {
    private readonly binaryDataService;
    private readonly messageRepository;
    private readonly maxTotalSizeBytes;
    constructor(binaryDataService: BinaryDataService, messageRepository: ChatHubMessageRepository);
    validateAttachments(attachments: ChatAttachment[], allowFileUploads: boolean, allowedFilesMimeTypes: string): void;
    store(sessionId: ChatSessionId, messageId: ChatMessageId, attachments: ChatAttachment[]): Promise<IBinaryData[]>;
    getAttachment(sessionId: ChatSessionId, messageId: ChatMessageId, attachmentIndex: number): Promise<[
        IBinaryData,
        ({
            type: 'buffer';
            buffer: Buffer<ArrayBufferLike>;
            fileSize: number;
        } | {
            type: 'stream';
            stream: Stream.Readable;
            fileSize: number;
        })
    ]>;
    deleteAllBySessionId(sessionId: string, trx?: EntityManager): Promise<void>;
    deleteAll(): Promise<void>;
    deleteAttachments(attachments: IBinaryData[]): Promise<void>;
    getDataUrl(binaryData: IBinaryData): Promise<string>;
    getAsBuffer(binaryData: IBinaryData): Promise<Buffer<ArrayBufferLike>>;
    storeTemporaryExecutionFile(workflowId: string, buffer: Buffer, mimeType: string, fileName: string): Promise<IBinaryData>;
    private isAllowedMimeType;
    private processAttachment;
}
