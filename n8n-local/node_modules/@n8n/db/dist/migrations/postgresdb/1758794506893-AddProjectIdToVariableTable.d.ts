import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddProjectIdToVariableTable1758794506893 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, column, addForeignKey }, queryRunner, tablePrefix, escape, }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns, dropIndex, dropForeignKey }, queryRunner, tablePrefix, escape, }: MigrationContext): Promise<void>;
}
