import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class CreateSecretsProviderConnectionTables1769433700000 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column, createIndex } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
