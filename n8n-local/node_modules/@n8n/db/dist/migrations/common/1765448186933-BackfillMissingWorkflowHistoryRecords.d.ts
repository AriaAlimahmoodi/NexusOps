import type { IrreversibleMigration, MigrationContext } from '../migration-types';
export declare class BackfillMissingWorkflowHistoryRecords1765448186933 implements IrreversibleMigration {
    up({ escape, runQuery }: MigrationContext): Promise<void>;
}
