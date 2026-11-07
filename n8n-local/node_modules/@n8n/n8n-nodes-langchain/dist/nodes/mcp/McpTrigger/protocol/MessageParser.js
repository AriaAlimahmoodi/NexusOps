"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageParser = void 0;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
class MessageParser {
    static parse(body) {
        try {
            const message = JSON.parse(body);
            return types_js_1.JSONRPCMessageSchema.parse(message);
        }
        catch {
            return undefined;
        }
    }
    static isToolCall(body) {
        const message = this.parse(body);
        if (!message)
            return false;
        return ('method' in message &&
            'id' in message &&
            message.method === types_js_1.CallToolRequestSchema.shape.method.value);
    }
    static isListToolsRequest(body) {
        const message = this.parse(body);
        if (!message)
            return false;
        return ('method' in message &&
            'id' in message &&
            message.method === types_js_1.ListToolsRequestSchema.shape.method.value);
    }
    static getRequestId(message) {
        try {
            const parsed = types_js_1.JSONRPCMessageSchema.parse(message);
            return 'id' in parsed ? String(parsed.id) : undefined;
        }
        catch {
            return undefined;
        }
    }
    static extractToolCallInfo(body) {
        const message = this.parse(body);
        if (!message)
            return undefined;
        if ('method' in message &&
            'params' in message &&
            message.method === types_js_1.CallToolRequestSchema.shape.method.value) {
            const params = message.params;
            if (typeof params === 'object' &&
                params !== null &&
                'name' in params &&
                typeof params.name === 'string' &&
                'arguments' in params &&
                typeof params.arguments === 'object' &&
                params.arguments !== null) {
                return {
                    toolName: params.name,
                    arguments: params.arguments,
                };
            }
        }
        return undefined;
    }
}
exports.MessageParser = MessageParser;
//# sourceMappingURL=MessageParser.js.map