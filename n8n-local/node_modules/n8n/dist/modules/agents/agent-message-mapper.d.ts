import { type AgentDbMessage, type MessageContent } from '@n8n/agents';
import type { AgentPersistedMessageContentPart, AgentPersistedMessageDto } from '@n8n/api-types';
export declare function contentPartToDto(part: MessageContent): AgentPersistedMessageContentPart;
export declare function messageToDto(msg: AgentDbMessage): AgentPersistedMessageDto | null;
export declare function messagesToDto(msgs: AgentDbMessage[]): AgentPersistedMessageDto[];
