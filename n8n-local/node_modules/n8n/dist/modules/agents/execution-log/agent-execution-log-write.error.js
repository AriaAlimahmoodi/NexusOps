"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentExecutionLogWriteError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class AgentExecutionLogWriteError extends n8n_workflow_1.UnexpectedError {
    constructor(ref, cause) {
        super('Failed to write agent execution log', { extra: { ...ref }, cause });
    }
}
exports.AgentExecutionLogWriteError = AgentExecutionLogWriteError;
//# sourceMappingURL=agent-execution-log-write.error.js.map