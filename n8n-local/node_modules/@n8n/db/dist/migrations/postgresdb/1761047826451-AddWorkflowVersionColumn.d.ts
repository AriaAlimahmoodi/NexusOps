import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddWorkflowVersionColumn1761047826451 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
