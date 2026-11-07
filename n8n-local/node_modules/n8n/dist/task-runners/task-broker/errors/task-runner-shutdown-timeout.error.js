"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRunnerShutdownTimeoutError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class TaskRunnerShutdownTimeoutError extends n8n_workflow_1.OperationalError {
    constructor() {
        super('Task aborted because the n8n instance was shutting down');
        this.description = 'The n8n instance began shutting down while the task was still running, so n8n stopped the task to finish shutting down in time. Retry the execution, or catch this error in an error workflow.';
    }
}
exports.TaskRunnerShutdownTimeoutError = TaskRunnerShutdownTimeoutError;
//# sourceMappingURL=task-runner-shutdown-timeout.error.js.map