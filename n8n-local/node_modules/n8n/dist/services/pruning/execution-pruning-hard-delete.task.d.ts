import { ExecutionsConfig } from '@n8n/config';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { ExecutionsPruningService } from './executions-pruning.service';
export declare class ExecutionPruningHardDeleteTask implements SystemTask {
    private readonly executionsConfig;
    private readonly pruningService;
    readonly name = "execution-pruning-hard-delete";
    private readonly intervalSeconds;
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(executionsConfig: ExecutionsConfig, pruningService: ExecutionsPruningService);
    run(signal: AbortSignal): Promise<void>;
}
