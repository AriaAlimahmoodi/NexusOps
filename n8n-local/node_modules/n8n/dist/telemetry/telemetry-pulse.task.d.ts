import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { Telemetry } from '../telemetry';
export declare class TelemetryPulseTask implements SystemTask {
    private readonly telemetry;
    readonly name = "telemetry-pulse";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(telemetry: Telemetry);
    run(): Promise<void>;
}
