import { SystemTask } from '@n8n/decorators';
import type { SystemTaskSchedule } from '@n8n/decorators';
import { McpRegistryService } from './registry/mcp-registry.service';
export declare class McpRegistryRefreshTask implements SystemTask {
    private readonly mcpRegistryService;
    readonly name = "mcp-registry-refresh";
    readonly schedule: SystemTaskSchedule;
    readonly target: import("@n8n/decorators").ClusterTarget;
    constructor(mcpRegistryService: McpRegistryService);
    run(signal: AbortSignal): Promise<void>;
}
