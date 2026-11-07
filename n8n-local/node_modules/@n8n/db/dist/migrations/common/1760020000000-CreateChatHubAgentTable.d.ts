import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class CreateChatHubAgentTable1760020000000 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, addColumns, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable, dropColumns } }: MigrationContext): Promise<void>;
}
