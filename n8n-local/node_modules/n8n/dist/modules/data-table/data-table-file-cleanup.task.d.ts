import { GlobalConfig } from '@n8n/config';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { DataTableFileCleanupService } from './data-table-file-cleanup.service';
export declare class DataTableFileCleanupTask implements SystemTask {
    private readonly globalConfig;
    private readonly fileCleanupService;
    readonly name = "data-table-file-cleanup";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").InstanceTarget;
    constructor(globalConfig: GlobalConfig, fileCleanupService: DataTableFileCleanupService);
    run(signal: AbortSignal): Promise<void>;
}
