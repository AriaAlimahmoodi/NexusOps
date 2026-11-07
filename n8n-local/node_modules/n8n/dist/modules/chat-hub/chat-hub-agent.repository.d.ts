import { BaseRepository, TransactionRunner } from '@n8n/db';
import { DataSource, EntityManager } from '@n8n/typeorm';
import { ChatHubAgent, IChatHubAgent } from './chat-hub-agent.entity';
export declare class ChatHubAgentRepository extends BaseRepository<ChatHubAgent> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    createAgent(agent: Partial<IChatHubAgent> & Pick<IChatHubAgent, 'id'>, trx?: EntityManager): Promise<ChatHubAgent>;
    updateAgent(id: string, updates: Partial<IChatHubAgent>, trx?: EntityManager): Promise<ChatHubAgent>;
    deleteAgent(id: string, trx?: EntityManager): Promise<import("@n8n/typeorm").DeleteResult>;
    getManyByUserId(userId: string): Promise<ChatHubAgent[]>;
    getManyByUserIdWithToolIds(userId: string): Promise<ChatHubAgent[]>;
    getOneById(id: string, userId: string, trx?: EntityManager): Promise<ChatHubAgent | null>;
}
