import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { TrustedSourceDiscoveryService } from './trusted-source-discovery.service';
export declare class TrustedSourceDiscoveryTask implements SystemTask {
    private readonly discovery;
    readonly name = "trusted-source-discovery";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(discovery: TrustedSourceDiscoveryService);
    run(signal: AbortSignal): Promise<void>;
}
