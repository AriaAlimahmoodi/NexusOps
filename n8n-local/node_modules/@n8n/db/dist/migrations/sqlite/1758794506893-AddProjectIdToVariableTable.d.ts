import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddProjectIdToVariableTable1758794506893 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column, createIndex, dropTable }, queryRunner, escape, copyTable, }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { createTable, column, createIndex, dropTable }, queryRunner, escape, }: MigrationContext): Promise<void>;
}
