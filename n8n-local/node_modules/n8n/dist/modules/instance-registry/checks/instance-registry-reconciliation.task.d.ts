import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { CheckService } from './check.service';
export declare class InstanceRegistryReconciliationTask implements SystemTask {
    private readonly checkService;
    readonly name = "instance-registry-reconciliation";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(checkService: CheckService);
    run(signal: AbortSignal): Promise<void>;
}
