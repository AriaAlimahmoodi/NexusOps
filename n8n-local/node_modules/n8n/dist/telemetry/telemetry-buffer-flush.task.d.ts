import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { Telemetry } from '../telemetry';
export declare class TelemetryBufferFlushTask implements SystemTask {
    private readonly telemetry;
    readonly name = "telemetry-buffer-flush";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").InstanceTarget;
    constructor(telemetry: Telemetry);
    run(): Promise<void>;
}
