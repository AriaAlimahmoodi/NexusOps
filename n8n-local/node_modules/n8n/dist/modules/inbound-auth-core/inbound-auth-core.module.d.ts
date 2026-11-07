import type { ModuleInterface } from '@n8n/decorators';
export declare class InboundAuthCoreModule implements ModuleInterface {
    init(): Promise<void>;
    context(): Promise<{
        trustedSourceDirectory: import("./trusted-source-directory.service.js").TrustedSourceDbDirectory;
    }>;
    systemTasks(): Promise<typeof import("./trusted-source-discovery.task.js").TrustedSourceDiscoveryTask[]>;
    entities(): Promise<(typeof import("./database/entities/trusted-source.entity.js").TrustedSourceEntity | typeof import("./database/entities/trusted-source-identity.entity.js").TrustedSourceIdentityEntity)[]>;
}
