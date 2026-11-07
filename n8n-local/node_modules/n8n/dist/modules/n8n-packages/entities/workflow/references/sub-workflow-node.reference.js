"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subWorkflowNodeReference = void 0;
exports.getStaticSubworkflowId = getStaticSubworkflowId;
exports.setStaticSubworkflowId = setStaticSubworkflowId;
const n8n_workflow_1 = require("n8n-workflow");
exports.subWorkflowNodeReference = {
    extract(workflow) {
        const requirements = [];
        for (const node of workflow.nodes ?? []) {
            const referencedWorkflowId = getStaticSubworkflowId(node);
            if (referencedWorkflowId) {
                requirements.push({ workflowId: workflow.id, referencedWorkflowId });
            }
        }
        return requirements;
    },
    apply(workflow, bindings) {
        for (const node of workflow.nodes ?? []) {
            const currentId = getStaticSubworkflowId(node);
            if (!currentId)
                continue;
            const targetId = bindings.workflows.get(currentId);
            if (targetId)
                setStaticSubworkflowId(node, targetId);
        }
    },
};
function getStaticSubworkflowId(node) {
    if (!(0, n8n_workflow_1.isNodeWithWorkflowSelector)(node))
        return undefined;
    const { source = 'database' } = node.parameters;
    if (source !== 'database')
        return undefined;
    const { workflowId: storedWorkflowId } = node.parameters;
    return toStaticId((0, n8n_workflow_1.getSubworkflowId)(node) ?? storedWorkflowId);
}
function setStaticSubworkflowId(node, workflowId) {
    const stored = node.parameters.workflowId;
    if ((0, n8n_workflow_1.isResourceLocatorValue)(stored)) {
        stored.value = workflowId;
    }
    else {
        node.parameters.workflowId = workflowId;
    }
}
function toStaticId(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    if (trimmed === '' || trimmed.startsWith('='))
        return undefined;
    return trimmed;
}
//# sourceMappingURL=sub-workflow-node.reference.js.map