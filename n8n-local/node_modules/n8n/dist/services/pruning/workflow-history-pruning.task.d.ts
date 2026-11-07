import { DatabaseConfig } from '@n8n/config';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { WorkflowHistoryManager } from '../../workflows/workflow-history/workflow-history-manager';
export declare class WorkflowHistoryPruningTask implements SystemTask {
    private readonly databaseConfig;
    private readonly workflowHistoryManager;
    readonly name = "workflow-history-pruning";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(databaseConfig: DatabaseConfig, workflowHistoryManager: WorkflowHistoryManager);
    run(): Promise<void>;
}
