import { DatabaseConfig } from '@n8n/config';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { N8NCheckpointStorage } from './integrations/n8n-checkpoint-storage';
import { AgentBackgroundJobService } from './background/agent-background-job.service';
export declare class AgentCheckpointPruningTask implements SystemTask {
    private readonly databaseConfig;
    private readonly checkpointStorage;
    private readonly backgroundJobs;
    readonly name = "agent-checkpoint-pruning";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(databaseConfig: DatabaseConfig, checkpointStorage: N8NCheckpointStorage, backgroundJobs: AgentBackgroundJobService);
    run(signal: AbortSignal): Promise<void>;
}
