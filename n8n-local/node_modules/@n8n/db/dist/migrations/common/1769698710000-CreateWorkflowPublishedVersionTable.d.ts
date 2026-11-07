import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class CreateWorkflowPublishedVersionTable1769698710000 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
