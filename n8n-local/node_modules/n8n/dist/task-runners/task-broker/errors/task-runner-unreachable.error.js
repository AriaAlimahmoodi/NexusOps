"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRunnerUnreachableError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class TaskRunnerUnreachableError extends n8n_workflow_1.OperationalError {
    constructor(taskId, runnerId) {
        super(`Runner (${runnerId}) became unreachable while processing task (${taskId})`);
    }
}
exports.TaskRunnerUnreachableError = TaskRunnerUnreachableError;
//# sourceMappingURL=task-runner-unreachable.error.js.map