import type { FetchFn } from '@n8n/agents';
import type { Logger } from '@n8n/backend-common';
export interface McpMockServerInfo {
    name: string;
    url: string;
    description?: string;
}
export interface McpMockToolCall {
    serverName: string;
    toolName: string;
    args: unknown;
    result: unknown;
}
export interface McpMockCanonicalTool {
    name: string;
    description: string;
}
export interface McpMockFetchOptions {
    servers: McpMockServerInfo[];
    agentInstructions: string;
    scenarioHints?: string;
    globalContext?: string;
    serverHints?: Record<string, string>;
    knownToolsByServer?: Record<string, McpMockCanonicalTool[]>;
    onToolCall: (call: McpMockToolCall) => void;
    logger: Logger;
}
export declare function createMcpMockFetch(options: McpMockFetchOptions): FetchFn;
