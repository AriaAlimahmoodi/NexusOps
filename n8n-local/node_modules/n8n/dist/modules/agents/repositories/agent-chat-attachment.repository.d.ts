import { DataSource, Repository } from '@n8n/typeorm';
import { AgentChatAttachment } from '../entities/agent-chat-attachment.entity';
export declare class AgentChatAttachmentRepository extends Repository<AgentChatAttachment> {
    constructor(dataSource: DataSource);
    findByIdInThread(id: string, scope: {
        projectId: string;
        threadId: string;
    }): Promise<AgentChatAttachment | null>;
    findByIdForAgent(id: string, scope: {
        agentId: string;
        projectId: string;
    }): Promise<AgentChatAttachment | null>;
    findByThread(threadId: string, scope: {
        projectId: string;
    } | {
        agentId: string;
    }): Promise<AgentChatAttachment[]>;
    findByIds(ids: string[]): Promise<AgentChatAttachment[]>;
    findFromSourceCreatedBefore(scope: {
        agentId: string;
        source: string;
    }, before: Date, limit: number): Promise<AgentChatAttachment[]>;
}
