import type { ChatHubProvider, ChatHubMessageType, ChatHubMessageStatus } from '@n8n/api-types';
import { ExecutionEntity, WithTimestamps, WorkflowEntity } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import type { IBinaryData } from 'n8n-workflow';
import type { ChatHubSession } from './chat-hub-session.entity';
export declare class ChatHubMessage extends WithTimestamps {
    id: string;
    sessionId: string;
    session: Relation<ChatHubSession>;
    type: ChatHubMessageType;
    name: string;
    content: string;
    provider: ChatHubProvider | null;
    model: string | null;
    workflowId: string | null;
    workflow?: Relation<WorkflowEntity> | null;
    agentId: string | null;
    executionId: number | null;
    execution?: Relation<ExecutionEntity> | null;
    previousMessageId: string | null;
    retryOfMessageId: string | null;
    revisionOfMessageId: string | null;
    status: ChatHubMessageStatus;
    attachments: IBinaryData[] | null;
}
