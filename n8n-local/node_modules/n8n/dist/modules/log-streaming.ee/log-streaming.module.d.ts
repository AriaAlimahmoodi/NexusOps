import type { ModuleInterface } from '@n8n/decorators';
export declare class LogStreamingModule implements ModuleInterface {
    init(): Promise<void>;
    entities(): Promise<typeof import("./database/entities/event-destination.entity.js").EventDestinations[]>;
}
