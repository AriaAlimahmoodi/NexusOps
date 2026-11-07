import { Logger } from '@n8n/backend-common';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { IdempotencyKeyService } from '../public-api/idempotency-key.service';
export declare class IdempotencyKeyCleanupTask implements SystemTask {
    private readonly logger;
    private readonly idempotencyKeyService;
    readonly name = "idempotency-key-cleanup";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(logger: Logger, idempotencyKeyService: IdempotencyKeyService);
    run(signal: AbortSignal): Promise<void>;
}
