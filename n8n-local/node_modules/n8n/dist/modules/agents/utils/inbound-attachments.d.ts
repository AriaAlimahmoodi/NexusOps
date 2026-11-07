import type { AgentMessage, Message } from '@n8n/agents';
import type { StoredAttachmentRef } from '../types/agent-chat-attachment';
export declare function resolveInboundMimeType(declared: string | undefined, data: Buffer): Promise<string>;
export declare function buildInboundUserMessage(text: string, attachments: StoredAttachmentRef[]): [Message];
export declare function readInboundUserMessage(input: AgentMessage): {
    message: string;
    attachments: StoredAttachmentRef[];
};
