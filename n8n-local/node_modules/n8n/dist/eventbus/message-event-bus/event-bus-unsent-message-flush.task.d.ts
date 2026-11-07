import { GlobalConfig } from '@n8n/config';
import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { MessageEventBus } from './message-event-bus';
export declare class EventBusUnsentMessageFlushTask implements SystemTask {
    private readonly globalConfig;
    private readonly eventBus;
    readonly name = "event-bus-unsent-message-flush";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").InstanceTarget;
    constructor(globalConfig: GlobalConfig, eventBus: MessageEventBus);
    run(): Promise<void>;
}
