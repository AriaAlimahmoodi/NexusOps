import { type McpRegistryDiscoveryResponse, type McpRegistryServerResponse } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import { McpConnectionDiscoveryService } from './mcp-connection-discovery.service';
import { McpRegistryService } from './registry/mcp-registry.service';
export declare class McpRegistryController {
    private readonly service;
    private readonly discoveryService;
    constructor(service: McpRegistryService, discoveryService: McpConnectionDiscoveryService);
    listServers(): Promise<McpRegistryServerResponse[]>;
    discover(req: AuthenticatedRequest): Promise<McpRegistryDiscoveryResponse>;
}
