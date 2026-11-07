import type { IrreversibleMigration, MigrationContext } from '../migration-types';
export declare class ActivateExecuteWorkflowTriggerWorkflows1763048000000 implements IrreversibleMigration {
    private findExecuteWfAndErrorTriggers;
    up({ escape, runQuery, runInBatches, parseJson, isPostgres, logger, migrationName, }: MigrationContext): Promise<void>;
    private isTriggerNode;
    private hasValidWorkflowInputs;
}
