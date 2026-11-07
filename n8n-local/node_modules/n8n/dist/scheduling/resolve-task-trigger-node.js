"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTaskTriggerNode = resolveTaskTriggerNode;
const n8n_workflow_1 = require("n8n-workflow");
function resolveTaskTriggerNode(workflowData, nodeId, task, errorMessage) {
    const node = workflowData.nodes.find((candidate) => candidate.id === nodeId);
    if (!node || node.disabled) {
        throw new n8n_workflow_1.UnexpectedError(errorMessage, {
            extra: { taskId: task.id, jobId: task.jobId, workflowId: workflowData.id, nodeId },
        });
    }
    return node;
}
//# sourceMappingURL=resolve-task-trigger-node.js.map