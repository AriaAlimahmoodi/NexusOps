import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddFilesColumnToChatHubAgents1771500000002 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns } }: MigrationContext): Promise<void>;
}
