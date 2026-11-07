"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDanglingToolCallMessages = cleanupDanglingToolCallMessages;
const messages_1 = require("@langchain/core/messages");
function cleanupDanglingToolCallMessages(messages) {
    const toolCallIds = new Set(messages.filter((m) => m instanceof messages_1.ToolMessage).map((m) => m.tool_call_id));
    const danglingToolCalls = messages.filter((m) => m instanceof messages_1.AIMessage && m.tool_calls?.some(({ id }) => id && !toolCallIds.has(id)));
    return danglingToolCalls.map((m) => new messages_1.RemoveMessage({ id: m.id }));
}
//# sourceMappingURL=cleanup-dangling-tool-call-messages.js.map