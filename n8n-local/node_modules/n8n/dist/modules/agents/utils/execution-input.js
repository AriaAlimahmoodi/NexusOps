"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindExecutionInput = bindExecutionInput;
const n8n_workflow_1 = require("n8n-workflow");
function bindExecutionInput(input, messageIds) {
    if (messageIds.length === 0)
        return input;
    const messages = typeof input === 'string'
        ? [{ role: 'user', content: [{ type: 'text', text: input }] }]
        : input;
    if (messages.length !== messageIds.length) {
        throw new n8n_workflow_1.UnexpectedError('Runtime input does not match the reserved messages');
    }
    return messages.map((message, index) => ({ ...message, id: messageIds[index] }));
}
//# sourceMappingURL=execution-input.js.map