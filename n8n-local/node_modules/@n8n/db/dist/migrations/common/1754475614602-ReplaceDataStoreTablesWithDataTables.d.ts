import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class ReplaceDataStoreTablesWithDataTables1754475614602 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column, dropTable } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { createTable, column, dropTable } }: MigrationContext): Promise<void>;
}
