import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { WorkflowHistoryCompactionService } from './workflow-history-compaction.service';
export declare class WorkflowHistoryCompactionTrimTask implements SystemTask {
    private readonly compactionService;
    readonly name = "workflow-history-compaction-trim";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(compactionService: WorkflowHistoryCompactionService);
    run(signal: AbortSignal): Promise<void>;
}
