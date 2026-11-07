import type { Thread } from '@n8n/agents';
import { BaseRepository, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { InstanceAiThread } from '../entities/instance-ai-thread.entity';
export declare class InstanceAiThreadRepository extends BaseRepository<InstanceAiThread> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    updateThread(args: {
        threadId: string;
        update: (current: Thread) => Partial<Pick<Thread, 'title' | 'metadata' | 'resourceId'>> | null | undefined;
    }): Promise<Thread | null>;
    listHistoryPage(resourceId: string, limit: number, search?: string, before?: {
        updatedAt: Date;
        id: string;
    }): Promise<InstanceAiThread[]>;
}
