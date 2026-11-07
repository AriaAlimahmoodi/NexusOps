import type { EntityClass, ModuleInterface } from '@n8n/decorators';
export declare class CommunityPackagesModule implements ModuleInterface {
    init(): Promise<void>;
    commands(): Promise<void>;
    entities(): Promise<EntityClass[]>;
    settings(): Promise<{
        communityNodesEnabled: boolean;
        unverifiedCommunityNodesEnabled: boolean;
    }>;
    nodeLoaders(): Promise<import("n8n-workflow").NodeLoader[]>;
}
