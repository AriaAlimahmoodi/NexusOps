import { ChatHubProvider, type ChatHubSessionType } from '@n8n/api-types';
import { WithTimestamps, User, CredentialsEntity, WorkflowEntity } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import type { ChatHubAgent } from './chat-hub-agent.entity';
import type { ChatHubMessage } from './chat-hub-message.entity';
import type { ChatHubTool } from './chat-hub-tool.entity';
export interface IChatHubSession {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    ownerId: string;
    lastMessageAt: Date;
    credentialId: string | null;
    provider: ChatHubProvider | null;
    model: string | null;
    workflowId: string | null;
    agentId: string | null;
    agentName: string | null;
    type: ChatHubSessionType;
}
export declare class ChatHubSession extends WithTimestamps {
    id: string;
    title: string;
    ownerId: string;
    owner?: Relation<User>;
    lastMessageAt: Date;
    credentialId: string | null;
    credential?: Relation<CredentialsEntity> | null;
    provider: ChatHubProvider | null;
    model: string | null;
    workflowId: string | null;
    workflow?: Relation<WorkflowEntity> | null;
    agentId: string | null;
    agent?: Relation<ChatHubAgent> | null;
    agentName: string | null;
    type: ChatHubSessionType;
    messages?: Array<Relation<ChatHubMessage>>;
    tools?: Relation<ChatHubTool[]>;
}
