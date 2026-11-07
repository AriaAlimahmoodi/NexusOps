import { DatabaseConfig, InstanceAiConfig } from '@n8n/config';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { InstanceAiService } from './instance-ai.service';
export declare class InstanceAiCheckpointPruningTask implements SystemTask {
    private readonly instanceAiConfig;
    private readonly databaseConfig;
    private readonly instanceAiService;
    readonly name = "instance-ai-checkpoint-pruning";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(instanceAiConfig: InstanceAiConfig, databaseConfig: DatabaseConfig, instanceAiService: InstanceAiService);
    run(signal: AbortSignal): Promise<void>;
}
