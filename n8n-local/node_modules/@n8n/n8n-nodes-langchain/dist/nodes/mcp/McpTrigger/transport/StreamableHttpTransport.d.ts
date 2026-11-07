import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { StreamableHTTPServerTransportOptions } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import type { IncomingMessage, ServerResponse } from 'http';
import type { CompressionResponse, McpTransport, TransportType } from './Transport';
export declare class StreamableHttpTransport extends StreamableHTTPServerTransport implements McpTransport {
    readonly transportType: TransportType;
    private response;
    constructor(options: StreamableHTTPServerTransportOptions, response: CompressionResponse);
    markAsInitialized(sessionId: string): void;
    send(message: JSONRPCMessage): Promise<void>;
    handleRequest(req: IncomingMessage, resp: ServerResponse, parsedBody?: unknown): Promise<void>;
}
