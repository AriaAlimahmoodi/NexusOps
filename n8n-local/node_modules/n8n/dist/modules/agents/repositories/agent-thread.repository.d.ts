import { BaseRepository, TransactionRunner } from '@n8n/db';
import type { OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentThreadEntity } from '../entities/agent-thread.entity';
export interface AgentThreadRowPatch {
    title?: string | null;
    metadata?: string | null;
}
export declare class AgentThreadRepository extends BaseRepository<AgentThreadEntity> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    patchThread(threadId: string, update: (row: Readonly<AgentThreadEntity>) => AgentThreadRowPatch | null | undefined, ctx: OperationContext): Promise<AgentThreadEntity | null>;
}
