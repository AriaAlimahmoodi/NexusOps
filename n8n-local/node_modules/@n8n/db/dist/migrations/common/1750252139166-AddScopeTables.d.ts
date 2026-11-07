import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddScopeTables1750252139166 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
