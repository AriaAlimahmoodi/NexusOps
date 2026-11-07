import type { InstanceAiThreadTabsState } from '@n8n/api-types';
import { BaseRepository, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { InstanceAiThreadTabs } from '../entities/instance-ai-thread-tabs.entity';
export declare class InstanceAiThreadTabsRepository extends BaseRepository<InstanceAiThreadTabs> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    findState(threadId: string, userId: string): Promise<unknown>;
    saveState(threadId: string, userId: string, state: InstanceAiThreadTabsState): Promise<void>;
    updateState(threadId: string, userId: string, update: (stored: unknown) => InstanceAiThreadTabsState | null): Promise<void>;
}
