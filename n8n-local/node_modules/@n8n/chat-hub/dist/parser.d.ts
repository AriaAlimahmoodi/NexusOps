import { type ChatHubMessageType, type ChatMessageContentChunk } from '@n8n/api-types';
export interface MessageWithContent {
    type: ChatHubMessageType;
    content: string;
}
export declare function appendChunkToParsedMessageItems(items: ChatMessageContentChunk[], chunk: string): ChatMessageContentChunk[];
export declare function parseMessage(message: MessageWithContent): ChatMessageContentChunk[];
