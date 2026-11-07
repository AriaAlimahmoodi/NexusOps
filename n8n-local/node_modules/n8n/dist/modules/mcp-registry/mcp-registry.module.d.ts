import type { ModuleInterface } from '@n8n/decorators';
export declare class McpRegistryModule implements ModuleInterface {
    init(): Promise<void>;
    systemTasks(): Promise<typeof import("./mcp-registry-refresh.task.js").McpRegistryRefreshTask[]>;
    entities(): Promise<typeof import("./registry/mcp-registry-server.entity.js").McpRegistryServerEntity[]>;
    nodeLoaders(): Promise<import("./mcp-registry-node-loader.js").McpRegistryNodeLoader[]>;
}
