import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddAudienceColumnToApiKeys1758731786132 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns } }: MigrationContext): Promise<void>;
}
