import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { InstanceRegistryService } from './instance-registry.service';
export declare class InstanceRegistryHeartbeatTask implements SystemTask {
    private readonly instanceRegistryService;
    readonly name = "instance-registry-heartbeat";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").InstanceTarget;
    constructor(instanceRegistryService: InstanceRegistryService);
    run(): Promise<void>;
}
