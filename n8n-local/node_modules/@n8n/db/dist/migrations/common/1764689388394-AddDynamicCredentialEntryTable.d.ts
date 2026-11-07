import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddDynamicCredentialEntryTable1764689388394 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
