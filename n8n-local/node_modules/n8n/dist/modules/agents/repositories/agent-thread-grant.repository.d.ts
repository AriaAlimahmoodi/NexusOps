import { BaseRepository, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentThreadGrant } from '../entities/agent-thread-grant.entity';
export declare class AgentThreadGrantRepository extends BaseRepository<AgentThreadGrant> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    grant(threadId: string, grantKey: string): Promise<void>;
    revoke(threadId: string, grantKey: string): Promise<void>;
    findKeys(threadId: string): Promise<Set<string>>;
}
