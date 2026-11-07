import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class CreateDynamicCredentialResolverTable1764682447000 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
