import type { ChatMessageId } from '@n8n/api-types';
import type { Response } from 'express';
import type { StructuredChunk } from 'n8n-workflow';
import type { ChatHubMessage } from './chat-hub-message.entity';
export type ChunkTransformer = (chunk: string) => Promise<string>;
export declare function interceptResponseWrites<T extends Response>(res: T, transform: ChunkTransformer): T;
export type AggregatedMessage = Pick<ChatHubMessage, 'id' | 'previousMessageId' | 'retryOfMessageId' | 'content' | 'createdAt' | 'updatedAt' | 'status'>;
type Handlers = {
    onBegin?: (message: AggregatedMessage) => Promise<void>;
    onItem?: (message: AggregatedMessage, delta: string) => Promise<void>;
    onEnd?: (message: AggregatedMessage) => Promise<void>;
    onError?: (message: AggregatedMessage, errText?: string) => Promise<void>;
    onCancel?: (message: AggregatedMessage) => Promise<void>;
};
export declare function createStructuredChunkAggregator(initialPreviousMessageId: ChatMessageId, retryOfMessageId: ChatMessageId | null, handlers?: Handlers): {
    ingest: (chunk: StructuredChunk) => Promise<AggregatedMessage | null>;
    cancelAll: () => Promise<void>;
};
export {};
