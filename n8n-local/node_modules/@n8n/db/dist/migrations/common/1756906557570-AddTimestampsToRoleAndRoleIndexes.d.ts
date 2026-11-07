import type { IrreversibleMigration, MigrationContext } from '../migration-types';
export declare class AddTimestampsToRoleAndRoleIndexes1756906557570 implements IrreversibleMigration {
    up({ schemaBuilder, queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
