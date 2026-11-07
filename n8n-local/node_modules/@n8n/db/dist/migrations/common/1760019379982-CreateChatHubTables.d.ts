import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class CreateChatHubTables1760019379982 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
