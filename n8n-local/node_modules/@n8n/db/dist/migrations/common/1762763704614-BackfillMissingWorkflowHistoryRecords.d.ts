import type { IrreversibleMigration, MigrationContext } from '../migration-types';
export declare class BackfillMissingWorkflowHistoryRecords1762763704614 implements IrreversibleMigration {
    up({ escape, runQuery, schemaBuilder }: MigrationContext): Promise<void>;
}
