import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import type { McpToolCallInfo } from './types';
export declare class MessageParser {
    static parse(body: string): JSONRPCMessage | undefined;
    static isToolCall(body: string): boolean;
    static isListToolsRequest(body: string): boolean;
    static getRequestId(message: unknown): string | undefined;
    static extractToolCallInfo(body: string): McpToolCallInfo | undefined;
}
