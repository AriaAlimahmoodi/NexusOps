import { Logger } from '@n8n/backend-common';
import { ActivityLogConfig } from '@n8n/config';
import { ActivityEventRepository } from '@n8n/db';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
export declare class ActivityPruningTask implements SystemTask {
    private readonly logger;
    private readonly activityEventRepository;
    private readonly activityLogConfig;
    name: string;
    schedule: SystemTaskSchedule;
    target: import("@n8n/decorators").ClusterTarget;
    constructor(logger: Logger, activityEventRepository: ActivityEventRepository, activityLogConfig: ActivityLogConfig);
    run(signal: AbortSignal): Promise<void>;
}
