"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentN8nChatUnavailableError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class AgentN8nChatUnavailableError extends n8n_workflow_1.UserError {
    constructor() {
        super('This agent is not available in n8n Chat');
    }
}
exports.AgentN8nChatUnavailableError = AgentN8nChatUnavailableError;
//# sourceMappingURL=agent-n8n-chat-unavailable.error.js.map