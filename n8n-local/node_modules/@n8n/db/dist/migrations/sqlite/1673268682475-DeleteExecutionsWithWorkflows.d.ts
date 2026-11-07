import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class DeleteExecutionsWithWorkflows1673268682475 implements ReversibleMigration {
    withFKsDisabled: true;
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
