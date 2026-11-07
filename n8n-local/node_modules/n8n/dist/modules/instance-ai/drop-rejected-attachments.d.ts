import type { Logger } from '@n8n/backend-common';
import type { AgentDbMessage } from '@n8n/agents';
export declare const ATTACHMENT_REMOVED_NOTE = "[An attached file was removed because it was too large to process.]";
export declare function stripFileAttachmentParts(messages: AgentDbMessage[]): AgentDbMessage[];
interface AttachmentHistoryStore {
    getMessages: (threadId: string) => Promise<AgentDbMessage[]>;
    saveMessages: (args: {
        threadId: string;
        resourceId: string;
        messages: AgentDbMessage[];
    }) => Promise<void>;
}
export type AttachmentCleanupOutcome = 'no-attachments' | 'removed' | 'failed';
export declare function dropRejectedAttachmentsFromHistory(memory: AttachmentHistoryStore, args: {
    threadId: string;
    resourceId: string;
}, logger: Logger): Promise<AttachmentCleanupOutcome>;
export {};
