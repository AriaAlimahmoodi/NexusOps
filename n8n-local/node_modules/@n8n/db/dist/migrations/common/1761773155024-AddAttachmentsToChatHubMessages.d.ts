import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddAttachmentsToChatHubMessages1761773155024 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns } }: MigrationContext): Promise<void>;
}
