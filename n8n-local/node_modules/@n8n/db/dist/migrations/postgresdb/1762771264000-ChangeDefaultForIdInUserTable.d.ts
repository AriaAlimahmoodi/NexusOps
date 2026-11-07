import type { IrreversibleMigration, MigrationContext } from '../migration-types';
export declare class ChangeDefaultForIdInUserTable1762771264000 implements IrreversibleMigration {
    up({ queryRunner, escape }: MigrationContext): Promise<void>;
}
