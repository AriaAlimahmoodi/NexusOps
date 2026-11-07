import type { IrreversibleMigration, MigrationContext } from '../migration-types';
export declare class ChangeOAuthStateColumnToUnboundedVarchar1763572724000 implements IrreversibleMigration {
    up({ isSqlite, isPostgres, escape, copyTable, queryRunner, schemaBuilder: { createTable, column, dropTable }, }: MigrationContext): Promise<void>;
}
