"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowAccessError = exports.McpExecutionTimeoutError = void 0;
const constants_1 = require("@n8n/constants");
const n8n_workflow_1 = require("n8n-workflow");
class McpExecutionTimeoutError extends n8n_workflow_1.UserError {
    constructor(executionId, timeoutMs) {
        const timeoutSeconds = timeoutMs * constants_1.Time.milliseconds.toSeconds;
        super(`Workflow execution timed out after ${timeoutSeconds} seconds`);
        this.name = 'McpExecutionTimeoutError';
        this.executionId = executionId;
        this.timeoutMs = timeoutMs;
    }
}
exports.McpExecutionTimeoutError = McpExecutionTimeoutError;
class WorkflowAccessError extends n8n_workflow_1.UserError {
    constructor(message, reason) {
        super(message);
        this.name = 'WorkflowAccessError';
        this.reason = reason;
    }
}
exports.WorkflowAccessError = WorkflowAccessError;
//# sourceMappingURL=mcp.errors.js.map