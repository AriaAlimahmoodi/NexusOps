import { WorkflowHistoryCompactionConfig } from '@n8n/config';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { WorkflowHistoryCompactionService } from './workflow-history-compaction.service';
export declare class WorkflowHistoryCompactionOptimizeTask implements SystemTask {
    private readonly config;
    private readonly compactionService;
    readonly name = "workflow-history-compaction-optimize";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(config: WorkflowHistoryCompactionConfig, compactionService: WorkflowHistoryCompactionService);
    run(signal: AbortSignal): Promise<void>;
}
