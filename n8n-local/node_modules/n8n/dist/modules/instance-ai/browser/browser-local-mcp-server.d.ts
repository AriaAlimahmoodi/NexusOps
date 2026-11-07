import type { InstanceAiPermissionMode, McpTool, McpToolCallRequest, McpToolCallResult } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
import type { DomainAccessTracker, LocalMcpServer } from '@n8n/instance-ai';
import type { BrowserToolkit, ToolContext } from '@n8n/mcp-browser';
export interface BrowserDomainGate {
    tracker: DomainAccessTracker;
    runId: string;
    permissionMode?: InstanceAiPermissionMode;
    createCredentialPermissionMode?: InstanceAiPermissionMode;
}
export declare class BrowserLocalMcpServer implements LocalMcpServer {
    private readonly toolContext;
    private readonly logger;
    private readonly toolsByName;
    private readonly mcpTools;
    private gate?;
    constructor(toolkit: BrowserToolkit, toolContext: ToolContext, logger: Logger);
    setDomainGate(gate: BrowserDomainGate | undefined): void;
    getAvailableTools(): McpTool[];
    getToolsByCategory(category: string): McpTool[];
    callTool(req: McpToolCallRequest): Promise<McpToolCallResult>;
    private gateAccess;
    private affectedResource;
}
