import { BaseRepository, TransactionRunner } from '@n8n/db';
import { DataSource, EntityManager } from '@n8n/typeorm';
import { ChatHubSession, IChatHubSession } from './chat-hub-session.entity';
export declare class ChatHubSessionRepository extends BaseRepository<ChatHubSession> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    createChatSession(session: Partial<IChatHubSession> & Pick<IChatHubSession, 'id'>, trx?: EntityManager): Promise<ChatHubSession>;
    updateChatSession(id: string, updates: Partial<IChatHubSession>, trx?: EntityManager): Promise<void>;
    deleteChatHubSession(id: string, trx?: EntityManager): Promise<import("@n8n/typeorm").DeleteResult>;
    getManyByUserId(userId: string, limit: number, cursor?: string, type?: string): Promise<ChatHubSession[]>;
    existsById(id: string, userId: string, trx?: EntityManager): Promise<boolean>;
    getOneById(id: string, userId: string, trx?: EntityManager): Promise<ChatHubSession | null>;
    deleteAll(trx?: EntityManager): Promise<import("@n8n/typeorm").DeleteResult>;
}
