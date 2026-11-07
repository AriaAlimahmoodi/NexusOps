"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderBySubWorkflowDependencies = orderBySubWorkflowDependencies;
const requirement_consumers_1 = require("../../spec/requirement-consumers");
function orderBySubWorkflowDependencies(workflows, requirements) {
    if (!requirements?.length)
        return workflows;
    const workflowsById = new Map(workflows.map((workflow) => [workflow.sourceWorkflowId, workflow]));
    const callers = new Map();
    const pendingDependencies = new Map(workflows.map((workflow) => [workflow.sourceWorkflowId, 0]));
    for (const requirement of requirements) {
        if (!workflowsById.has(requirement.id))
            continue;
        for (const callerId of (0, requirement_consumers_1.getWorkflowConsumerIds)(requirement)) {
            if (!workflowsById.has(callerId) || callerId === requirement.id)
                continue;
            const existing = callers.get(requirement.id);
            if (existing)
                existing.push(callerId);
            else
                callers.set(requirement.id, [callerId]);
            pendingDependencies.set(callerId, pendingDependencies.get(callerId) + 1);
        }
    }
    const queue = workflows.filter((workflow) => pendingDependencies.get(workflow.sourceWorkflowId) === 0);
    const ordered = [];
    for (let cursor = 0; cursor < queue.length; cursor++) {
        const workflow = queue[cursor];
        ordered.push(workflow);
        for (const callerId of callers.get(workflow.sourceWorkflowId) ?? []) {
            const pending = pendingDependencies.get(callerId) - 1;
            pendingDependencies.set(callerId, pending);
            if (pending === 0)
                queue.push(workflowsById.get(callerId));
        }
    }
    if (ordered.length < workflows.length) {
        const placed = new Set(ordered.map((workflow) => workflow.sourceWorkflowId));
        for (const workflow of workflows) {
            if (!placed.has(workflow.sourceWorkflowId))
                ordered.push(workflow);
        }
    }
    return ordered;
}
//# sourceMappingURL=sub-workflow-ordering.js.map