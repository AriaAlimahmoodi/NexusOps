import type { MigrationContext, IrreversibleMigration } from '../migration-types';
export declare class ClearEvaluation1745322634000 implements IrreversibleMigration {
    up({ schemaBuilder: { dropTable, column, createTable }, queryRunner, tablePrefix, isSqlite, isPostgres, }: MigrationContext): Promise<void>;
}
