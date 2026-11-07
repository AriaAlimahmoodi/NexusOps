import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddWorkflowHistoryAutoSaveFields1762847206508 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns } }: MigrationContext): Promise<void>;
}
