import { McpRegistryServerRepository } from './registry/mcp-registry-server.repository';
import { McpRegistryService } from './registry/mcp-registry.service';
export declare class McpRegistryTestController {
    private readonly repository;
    private readonly service;
    constructor(repository: McpRegistryServerRepository, service: McpRegistryService);
    seed(): Promise<{
        ok: boolean;
        count: number;
    }>;
    private assertE2ETestsEnabled;
}
