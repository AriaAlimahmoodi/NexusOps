import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddWorkflowVersionIdToExecutionData1765892199653 implements ReversibleMigration {
    up({ runQuery, escape }: MigrationContext): Promise<void>;
    down({ runQuery, escape }: MigrationContext): Promise<void>;
}
