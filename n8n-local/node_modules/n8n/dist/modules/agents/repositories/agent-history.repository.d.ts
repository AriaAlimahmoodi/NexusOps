import type { StoredAgentConfig } from '@n8n/api-types';
import { BaseRepository, TransactionRunner, User, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentHistory } from '../entities/agent-history.entity';
import type { Agent } from '../entities/agent.entity';
export declare function renderAuthor(user: User): string;
export declare class AgentHistoryRepository extends BaseRepository<AgentHistory> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    saveVersion(data: {
        versionId: string;
        agentId: string;
        schema: StoredAgentConfig | null;
        tools: Agent['tools'] | null;
        skills?: Agent['skills'] | null;
        publishedBy: User | string;
    }, ctx?: OperationContext): Promise<AgentHistory>;
    findByVersionAndAgentId(versionId: string, agentId: string, ctx?: OperationContext): Promise<AgentHistory | null>;
    findByAgentId(agentId: string, take: number, skip: number): Promise<AgentHistory[]>;
    existsForAgent(agentId: string): Promise<boolean>;
}
