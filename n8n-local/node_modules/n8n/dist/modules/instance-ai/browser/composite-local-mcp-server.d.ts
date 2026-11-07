import type { McpTool, McpToolCallRequest, McpToolCallResult } from '@n8n/api-types';
import type { LocalMcpServer } from '@n8n/instance-ai';
export declare function composeLocalMcpServers(...servers: Array<LocalMcpServer | undefined>): LocalMcpServer | undefined;
export declare class CompositeLocalMcpServer implements LocalMcpServer {
    private readonly servers;
    private availableTools;
    private availableToolsByCategory;
    constructor(servers: LocalMcpServer[]);
    getAvailableTools(): McpTool[];
    getToolsByCategory(category: string): McpTool[];
    callTool(req: McpToolCallRequest, options?: {
        abortSignal?: AbortSignal;
    }): Promise<McpToolCallResult>;
    private unwrapTools;
    private dedupe;
}
