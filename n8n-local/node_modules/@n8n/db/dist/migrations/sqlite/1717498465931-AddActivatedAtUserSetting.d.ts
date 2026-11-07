import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddActivatedAtUserSetting1717498465931 implements ReversibleMigration {
    withFKsDisabled: true;
    up({ queryRunner, escape }: MigrationContext): Promise<void>;
    down({ queryRunner, escape }: MigrationContext): Promise<void>;
}
