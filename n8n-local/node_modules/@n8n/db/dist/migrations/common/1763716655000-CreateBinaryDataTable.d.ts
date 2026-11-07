import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class CreateBinaryDataTable1763716655000 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
