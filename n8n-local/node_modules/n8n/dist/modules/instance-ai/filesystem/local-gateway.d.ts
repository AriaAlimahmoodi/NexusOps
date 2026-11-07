import type { McpToolCallRequest, McpToolCallResult, McpTool, InstanceAiGatewayCapabilities, ToolCategory } from '@n8n/api-types';
export interface LocalGatewayRequestEvent {
    type: 'filesystem-request';
    payload: {
        requestId: string;
        toolCall: McpToolCallRequest;
    };
}
export interface LocalGatewayDisconnectEvent {
    type: 'gateway-disconnect';
}
export type LocalGatewayEvent = LocalGatewayRequestEvent | LocalGatewayDisconnectEvent;
export declare class LocalGateway {
    private readonly pendingRequests;
    private readonly emitter;
    private _connected;
    private _connectedAt;
    private _rootPath;
    private _hostIdentifier;
    private _toolCategories;
    private _availableTools;
    private _excludedToolCategories;
    get isConnected(): boolean;
    get connectedAt(): string | null;
    get rootPath(): string | null;
    setExcludedToolCategories(categories: string[]): void;
    private isExcluded;
    getAvailableTools(): McpTool[];
    getToolsByCategory(category: string): McpTool[];
    onRequest(listener: (event: LocalGatewayRequestEvent) => void): () => void;
    onDisconnect(listener: (event: LocalGatewayDisconnectEvent) => void): () => void;
    init(data: InstanceAiGatewayCapabilities): void;
    resolveRequest(requestId: string, result?: McpToolCallResult, error?: string): boolean;
    disconnect(): void;
    getStatus(): {
        connected: boolean;
        connectedAt: string | null;
        directory: string | null;
        hostIdentifier: string | null;
        toolCategories: ToolCategory[];
    };
    callTool(toolCall: McpToolCallRequest, options?: {
        abortSignal?: AbortSignal;
    }): Promise<McpToolCallResult>;
}
