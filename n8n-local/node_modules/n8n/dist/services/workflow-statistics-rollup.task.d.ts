import { SchedulerConfig } from '@n8n/config';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { WorkflowStatisticsRollupService } from './workflow-statistics-rollup.service';
export declare class WorkflowStatisticsRollupTask implements SystemTask {
    private readonly rollupService;
    readonly name = "workflow-statistics-rollup";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    private readonly runBudgetMs;
    constructor(rollupService: WorkflowStatisticsRollupService, schedulerConfig: SchedulerConfig);
    run(signal: AbortSignal): Promise<void>;
}
