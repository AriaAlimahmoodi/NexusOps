import { Project, WithTimestampsAndStringId } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { Agent } from './agent.entity';
export declare class AgentChatAttachment extends WithTimestampsAndStringId {
    agent: Relation<Agent> | null;
    agentId: string | null;
    project: Relation<Project>;
    projectId: string;
    threadId: string;
    resourceId: string | null;
    binaryDataId: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    source: string;
}
