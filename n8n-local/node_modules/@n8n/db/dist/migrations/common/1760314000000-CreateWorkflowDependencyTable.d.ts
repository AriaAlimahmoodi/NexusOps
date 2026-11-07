import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class CreateWorkflowDependencyTable1760314000000 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
