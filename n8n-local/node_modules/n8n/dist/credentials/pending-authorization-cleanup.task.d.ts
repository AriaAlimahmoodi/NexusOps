import { Logger } from '@n8n/backend-common';
import { CredentialsRepository } from '@n8n/db';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
export declare class PendingAuthorizationCleanupTask implements SystemTask {
    private readonly logger;
    private readonly credentialsRepository;
    name: string;
    schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(logger: Logger, credentialsRepository: CredentialsRepository);
    run(): Promise<void>;
}
