import type { ModuleContext, ModuleInterface } from '@n8n/decorators';
export declare class OtelModule implements ModuleInterface {
    init(): Promise<void>;
    settings(): Promise<{
        enabled: boolean;
    }>;
    context(): Promise<ModuleContext>;
    shutdown(): Promise<void>;
}
