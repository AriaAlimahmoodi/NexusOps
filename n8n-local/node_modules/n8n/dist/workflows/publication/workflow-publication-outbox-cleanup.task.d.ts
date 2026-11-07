import { WorkflowsConfig } from '@n8n/config';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { WorkflowPublicationOutboxCleanupService } from './workflow-publication-outbox-cleanup.service';
export declare class WorkflowPublicationOutboxCleanupTask implements SystemTask {
    private readonly workflowsConfig;
    private readonly cleanupService;
    readonly name = "publication-outbox-cleanup";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(workflowsConfig: WorkflowsConfig, cleanupService: WorkflowPublicationOutboxCleanupService);
    run(signal: AbortSignal): Promise<void>;
}
