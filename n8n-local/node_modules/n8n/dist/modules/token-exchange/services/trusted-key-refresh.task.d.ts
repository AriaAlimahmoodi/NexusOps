import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { TrustedKeyService } from './trusted-key.service';
export declare class TrustedKeyRefreshTask implements SystemTask {
    private readonly trustedKeyService;
    readonly name = "trusted-key-refresh";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(trustedKeyService: TrustedKeyService);
    run(signal: AbortSignal): Promise<void>;
}
