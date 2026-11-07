import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import type { IncomingMessage, ServerResponse } from 'http';
import type { CompressionResponse, McpTransport, TransportType } from './Transport';
export declare class SSETransport extends SSEServerTransport implements McpTransport {
    private response;
    readonly transportType: TransportType;
    constructor(endpoint: string, response: CompressionResponse);
    send(message: JSONRPCMessage): Promise<void>;
    handleRequest(req: IncomingMessage, resp: ServerResponse, body: IncomingMessage): Promise<void>;
}
