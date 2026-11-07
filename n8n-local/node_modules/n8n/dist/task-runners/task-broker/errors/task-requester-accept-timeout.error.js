"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRequesterAcceptTimeoutError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class TaskRequesterAcceptTimeoutError extends n8n_workflow_1.OperationalError {
    constructor(taskId, requesterId) {
        super(`Requester (${requesterId}) took too long to acknowledge task (${taskId})`);
    }
}
exports.TaskRequesterAcceptTimeoutError = TaskRequesterAcceptTimeoutError;
//# sourceMappingURL=task-requester-accept-timeout.error.js.map