import type { IrreversibleMigration, MigrationContext } from '../migration-types';
export declare class ChangeDependencyInfoToJson1761655473000 implements IrreversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
