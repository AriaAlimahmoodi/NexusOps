import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class CreateWorkflowPublishHistoryTable1764167920585 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column }, escape, runQuery }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
