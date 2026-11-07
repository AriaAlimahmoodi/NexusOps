import type { ChatHubLLMProvider, AgentIconOrEmoji, ChatHubAgentKnowledgeItem } from '@n8n/api-types';
import { User, CredentialsEntity, WithTimestamps } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import type { ChatHubTool } from './chat-hub-tool.entity';
export interface IChatHubAgent {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string | null;
    icon: AgentIconOrEmoji | null;
    suggestedPrompts: Array<{
        text: string;
        icon?: AgentIconOrEmoji;
    }>;
    systemPrompt: string;
    ownerId: string;
    credentialId: string | null;
    provider: ChatHubLLMProvider;
    model: string;
    files: ChatHubAgentKnowledgeItem[];
}
export declare class ChatHubAgent extends WithTimestamps {
    id: string;
    name: string;
    description: string | null;
    icon: AgentIconOrEmoji | null;
    suggestedPrompts: Array<{
        text: string;
        icon?: AgentIconOrEmoji;
    }>;
    systemPrompt: string;
    ownerId: string;
    owner?: User;
    credentialId: string | null;
    credential?: CredentialsEntity | null;
    provider: ChatHubLLMProvider;
    model: string;
    tools?: Relation<ChatHubTool[]>;
    files: ChatHubAgentKnowledgeItem[];
}
