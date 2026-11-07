import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddTypeToChatHubSessions1772700000000 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns } }: MigrationContext): Promise<void>;
}
