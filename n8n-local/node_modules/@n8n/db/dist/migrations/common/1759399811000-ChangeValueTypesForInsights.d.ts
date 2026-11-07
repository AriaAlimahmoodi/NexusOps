import type { IrreversibleMigration, MigrationContext } from '../migration-types';
export declare class ChangeValueTypesForInsights1759399811000 implements IrreversibleMigration {
    up({ isSqlite, isPostgres, escape, copyTable, queryRunner, schemaBuilder: { createTable, column, dropTable }, }: MigrationContext): Promise<void>;
}
