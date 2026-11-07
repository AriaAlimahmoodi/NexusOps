import { DatabaseConfig, ExecutionsConfig } from '@n8n/config';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { ExecutionsPruningService } from './executions-pruning.service';
export declare class ExecutionPruningSoftDeleteTask implements SystemTask {
    private readonly executionsConfig;
    private readonly databaseConfig;
    private readonly pruningService;
    readonly name = "execution-pruning-soft-delete";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(executionsConfig: ExecutionsConfig, databaseConfig: DatabaseConfig, pruningService: ExecutionsPruningService);
    run(): Promise<void>;
}
