import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddUserSettings1652367743993 implements ReversibleMigration {
    withFKsDisabled: true;
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
