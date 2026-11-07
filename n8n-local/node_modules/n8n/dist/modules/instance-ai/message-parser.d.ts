import type { AgentDbMessage } from '@n8n/agents';
import type { InstanceAiMessage } from '@n8n/api-types';
import type { AgentTreeSnapshot } from '@n8n/instance-ai';
type RunSnapshots = AgentTreeSnapshot[];
export interface StoredAgentMessage {
    id: string;
    role: string;
    content: unknown;
    type?: string;
    createdAt: Date;
}
export declare function extractTextFromContent(content: unknown): string;
export declare function parseStoredMessages(storedMessages: Array<AgentDbMessage | StoredAgentMessage>, snapshots?: RunSnapshots): InstanceAiMessage[];
export declare function collectConfirmationRequestIds(messages: Array<Pick<InstanceAiMessage, 'agentTree'>>): string[];
export declare function markExpiredConfirmations(messages: Array<Pick<InstanceAiMessage, 'agentTree'>>, liveRequestIds: Set<string>): void;
export {};
