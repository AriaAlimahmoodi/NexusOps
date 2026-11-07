import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { License } from '../license';
export declare class LicenseRenewalTask implements SystemTask {
    private readonly license;
    readonly name = "license-renewal";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(license: License);
    run(): Promise<void>;
}
