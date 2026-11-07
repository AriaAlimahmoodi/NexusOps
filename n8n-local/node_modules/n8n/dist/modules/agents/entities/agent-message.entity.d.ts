import type { AgentMessage } from '@n8n/agents';
import type { AgentMessageAuthor } from '@n8n/api-types';
import { WithTimestampsAndStringId } from '@n8n/db';
import { AgentThreadEntity } from './agent-thread.entity';
export interface AgentMessageOrigin {
    source: string | null;
    hidden?: boolean;
    integrationConnectionId?: string;
    platformMessageId?: string;
    platformThreadId?: string;
}
export declare class AgentMessageEntity extends WithTimestampsAndStringId {
    threadId: string;
    resourceId: string;
    role: string;
    type: string | null;
    content: AgentMessage;
    author: AgentMessageAuthor | null;
    origin: AgentMessageOrigin | null;
    modelContent: AgentMessage | null;
    modelContextAt: Date | null;
    thread: AgentThreadEntity;
}
