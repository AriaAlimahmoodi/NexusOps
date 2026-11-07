import type { MigrationContext, IrreversibleMigration } from '../migration-types';
export declare class MigrateTestDefinitionKeyToString1731582748663 implements IrreversibleMigration {
    withFKsDisabled: true;
    up(context: MigrationContext): Promise<void>;
}
