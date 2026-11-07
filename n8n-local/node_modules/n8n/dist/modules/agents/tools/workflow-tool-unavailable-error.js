"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowToolUnavailableError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class WorkflowToolUnavailableError extends n8n_workflow_1.UserError {
    constructor(reason, message) {
        super(message);
        this.reason = reason;
    }
}
exports.WorkflowToolUnavailableError = WorkflowToolUnavailableError;
//# sourceMappingURL=workflow-tool-unavailable-error.js.map