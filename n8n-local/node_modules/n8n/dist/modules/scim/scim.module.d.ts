import type { ModuleInterface } from '@n8n/decorators';
export declare class ScimModule implements ModuleInterface {
    init(): Promise<void>;
    settings(): Promise<{
        scimEnabled: boolean;
    }>;
    shutdown(): Promise<void>;
}
