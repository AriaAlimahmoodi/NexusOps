"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolResult = toolResult;
function toolResult(data, isError = false) {
    return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
        structuredContent: data,
        ...(isError ? { isError: true } : {}),
    };
}
//# sourceMappingURL=tool-result.utils.js.map