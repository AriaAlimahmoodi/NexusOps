import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { McpDiscoveryActivityService } from './activity.service';
export declare class McpDiscoveryActivityEvents {
    private readonly events;
    private readonly activity;
    private readonly logger;
    private readonly pending;
    private initialized;
    constructor(events: EventService, activity: McpDiscoveryActivityService, logger: Logger);
    init(): void;
    flush(userId: string): Promise<void>;
    private on;
}
