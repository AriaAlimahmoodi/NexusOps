import type { ModuleInterface, SystemTaskClass } from '@n8n/decorators';
export declare class InstanceRegistryModule implements ModuleInterface {
    init(): Promise<void>;
    systemTasks(): Promise<SystemTaskClass[]>;
    shutdown(): Promise<void>;
}
