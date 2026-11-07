import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { InstanceReportingService } from './instance-reporting.service';
export declare class InstanceReportingTask implements SystemTask {
    private readonly reportingService;
    readonly name = "instance-reporting";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(reportingService: InstanceReportingService);
    run(): Promise<void>;
}
