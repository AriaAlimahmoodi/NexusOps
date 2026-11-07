import type { McpRegistryServer } from './mcp-registry.types';
export interface McpRegistrySearchResult {
    slug: string;
    name: string;
    title: string;
    description: string;
    url: string;
    transport: 'streamableHttp' | 'sse';
    authentication: string;
    credentialType: string;
    tools: Array<{
        name: string;
        title?: string;
    }>;
    metadata: {
        nodeTypeName: string;
    };
    isTemplated: boolean;
}
export declare function listMcpRegistryServers(servers: McpRegistryServer[]): McpRegistrySearchResult[];
export declare function searchMcpRegistryServers(servers: McpRegistryServer[], queries: string[]): McpRegistrySearchResult[];
