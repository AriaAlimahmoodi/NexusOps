import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class CreateOAuthEntities1760116750277 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
