"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorruptedAgentExecutionLogError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class CorruptedAgentExecutionLogError extends n8n_workflow_1.UnexpectedError {
    constructor(ref, cause) {
        super('Found corrupted agent execution log', { extra: { ...ref }, cause });
    }
}
exports.CorruptedAgentExecutionLogError = CorruptedAgentExecutionLogError;
//# sourceMappingURL=corrupted-agent-execution-log.error.js.map