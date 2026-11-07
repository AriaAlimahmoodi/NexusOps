import type { ModuleInterface } from '@n8n/decorators';
export declare class ExternalSecretsModule implements ModuleInterface {
    init(): Promise<void>;
    systemTasks(): Promise<typeof import("./external-secrets-refresh.task.js").ExternalSecretsRefreshTask[]>;
    settings(): Promise<{
        multipleConnections: boolean;
        forProjects: boolean;
        roleBasedAccess: boolean;
        systemRolesEnabled: boolean;
    }>;
    shutdown(): Promise<void>;
}
