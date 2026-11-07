import type { ModuleInterface } from '@n8n/decorators';
export declare class McpModule implements ModuleInterface {
    init(): Promise<void>;
    settings(): Promise<{
        mcpAccessEnabled: boolean;
        mcpManagedByEnv: boolean;
        serverUrl: string;
        autoExposeNewWorkflows: boolean;
    }>;
    shutdown(): Promise<void>;
}
