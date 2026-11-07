import { Logger } from '@n8n/backend-common';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { InstanceRegistryService } from './instance-registry.service';
export declare class StaleMemberCleanupTask implements SystemTask {
    private readonly instanceRegistryService;
    readonly name = "instance-registry-stale-member-cleanup";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    private readonly logger;
    constructor(logger: Logger, instanceRegistryService: InstanceRegistryService);
    run(): Promise<void>;
}
