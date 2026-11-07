"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
const messages_1 = require("@langchain/core/messages");
const langgraph_1 = require("@langchain/langgraph");
function createSuccessResponse(config, message, stateUpdates) {
    const toolCallId = config.toolCall?.id;
    const messages = [
        new messages_1.ToolMessage({
            content: message,
            tool_call_id: toolCallId,
            name: config.toolCall?.name,
        }),
    ];
    const update = { messages };
    if (stateUpdates) {
        Object.assign(update, stateUpdates);
    }
    return new langgraph_1.Command({ update });
}
function createErrorResponse(config, error, stateUpdates) {
    const toolCallId = config.toolCall?.id;
    const messages = [
        new messages_1.ToolMessage({
            content: `Error: ${error.message}`,
            tool_call_id: toolCallId,
            name: config.toolCall?.name,
        }),
    ];
    const update = { messages };
    if (stateUpdates) {
        Object.assign(update, stateUpdates);
    }
    return new langgraph_1.Command({ update });
}
//# sourceMappingURL=response.js.map