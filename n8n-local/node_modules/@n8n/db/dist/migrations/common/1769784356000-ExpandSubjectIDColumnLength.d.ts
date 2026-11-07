import type { MigrationContext, IrreversibleMigration } from '../migration-types';
export declare class ExpandSubjectIDColumnLength1769784356000 implements IrreversibleMigration {
    up({ copyTable, escape, queryRunner, schemaBuilder: { createTable, column, dropTable }, }: MigrationContext): Promise<void>;
}
