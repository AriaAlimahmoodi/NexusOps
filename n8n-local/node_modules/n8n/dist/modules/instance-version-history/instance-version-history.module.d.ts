import type { ModuleInterface } from '@n8n/decorators';
export declare class InstanceVersionHistoryModule implements ModuleInterface {
    init(): Promise<void>;
    entities(): Promise<typeof import("./database/entities/instance-version-history.entity.js").InstanceVersionHistory[]>;
}
