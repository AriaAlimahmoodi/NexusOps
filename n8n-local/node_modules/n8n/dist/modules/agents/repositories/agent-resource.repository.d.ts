import { DataSource, Repository } from '@n8n/typeorm';
import { AgentResourceEntity } from '../entities/agent-resource.entity';
export interface ChatSessionGeneration {
    generation: number;
    lastActivityAt: number;
}
export declare class AgentResourceRepository extends Repository<AgentResourceEntity> {
    constructor(dataSource: DataSource);
    ensureExists(resourceId: string): Promise<void>;
    findChatSessionGeneration(baseThreadId: string): Promise<ChatSessionGeneration | null>;
    saveChatSessionGeneration(baseThreadId: string, session: ChatSessionGeneration): Promise<void>;
}
