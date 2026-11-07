import type { BreakingChangeVersion } from '@n8n/api-types';
import { BaseRepository, type OperationContext, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { MigrationFindingSync } from '../entities/migration-finding-sync.entity';
export type MigrationFindingSyncRecord = Pick<MigrationFindingSync, 'targetVersion' | 'syncedAt' | 'ruleSetFingerprint'>;
export declare class MigrationFindingSyncRepository extends BaseRepository<MigrationFindingSync> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    getForVersion(targetVersion: BreakingChangeVersion, ctx: OperationContext): Promise<MigrationFindingSync | null>;
    upsertForVersion(record: MigrationFindingSyncRecord, ctx: OperationContext): Promise<void>;
    deleteForVersion(targetVersion: BreakingChangeVersion, ctx: OperationContext): Promise<void>;
}
