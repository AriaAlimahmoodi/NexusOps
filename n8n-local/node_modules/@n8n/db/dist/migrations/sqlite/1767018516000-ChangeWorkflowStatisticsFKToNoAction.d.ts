import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class ChangeWorkflowStatisticsFKToNoAction1767018516000 implements ReversibleMigration {
    withFKsDisabled: true;
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
