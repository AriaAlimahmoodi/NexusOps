import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddPublishedVersionIdToWorkflowDependency1769000000000 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, column, createIndex } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns, dropIndex } }: MigrationContext): Promise<void>;
}
