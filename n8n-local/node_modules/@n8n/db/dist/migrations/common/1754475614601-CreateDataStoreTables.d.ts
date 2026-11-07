import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class CreateDataStoreTables1754475614601 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
