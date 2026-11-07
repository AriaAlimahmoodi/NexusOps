import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddWorkflowDescriptionColumn1762177736257 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns } }: MigrationContext): Promise<void>;
}
