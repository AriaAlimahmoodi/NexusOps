import { type SerializableAgentState } from '@n8n/agents';
import type { AgentChatMessagesResponse, AgentPersistedMessageDto } from '@n8n/api-types';
interface WithOpenSuspensionsOptions {
    appendInactiveCheckpointMessages?: boolean;
}
export declare function withOpenSuspensions(messages: AgentPersistedMessageDto[], checkpoint: SerializableAgentState | null, options?: WithOpenSuspensionsOptions): AgentChatMessagesResponse;
export {};
