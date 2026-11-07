import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddRolesTables1750252139167 implements ReversibleMigration {
    up({ schemaBuilder: { createTable, column, createIndex }, queryRunner, tablePrefix, }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropTable } }: MigrationContext): Promise<void>;
}
