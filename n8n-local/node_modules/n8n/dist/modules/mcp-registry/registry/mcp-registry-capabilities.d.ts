import { GlobalConfig } from '@n8n/config';
export declare class McpRegistryCapabilities {
    private readonly supportedCapabilities;
    constructor(globalConfig: GlobalConfig);
    supports(requiredCapabilities?: string[]): boolean;
}
