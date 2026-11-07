import type { ReversibleMigration, MigrationContext } from '../migration-types';
export declare class CreateChatHubToolsTable1770000000000 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column, dropColumns }, escape, isPostgres, runQuery, runInBatches, parseJson, logger, migrationName, }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { addColumns, column, dropTable } }: MigrationContext): Promise<void>;
}
