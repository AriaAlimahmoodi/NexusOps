import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddToolsColumnToChatHubTables1761830340990 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns } }: MigrationContext): Promise<void>;
}
