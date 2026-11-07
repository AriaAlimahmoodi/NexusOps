export declare class CommunityPackagesConfig {
    enabled: boolean;
    registry: string;
    reinstallMissing: boolean;
    unverifiedEnabled: boolean;
    verifiedEnabled: boolean;
    preventLoading: boolean;
    authToken: string;
    readonly aiNodeSdkVersion: number;
    readonly nodesApiVersion: string;
    private disabledModules;
    sanitize(): void;
}
