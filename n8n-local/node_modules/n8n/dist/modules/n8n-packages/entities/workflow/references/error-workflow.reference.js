"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorWorkflowReference = void 0;
exports.errorWorkflowReference = {
    extract(workflow) {
        const referencedWorkflowId = staticErrorWorkflowId(workflow);
        return referencedWorkflowId ? [{ workflowId: workflow.id, referencedWorkflowId }] : [];
    },
    apply(workflow, bindings) {
        const currentId = staticErrorWorkflowId(workflow);
        if (!currentId || !workflow.settings)
            return;
        workflow.settings.errorWorkflow = bindings.workflows.get(currentId) ?? currentId;
    },
};
function staticErrorWorkflowId(workflow) {
    const errorWorkflow = workflow.settings?.errorWorkflow;
    if (typeof errorWorkflow !== 'string' ||
        errorWorkflow === 'DEFAULT' ||
        errorWorkflow.startsWith('=')) {
        return undefined;
    }
    return errorWorkflow;
}
//# sourceMappingURL=error-workflow.reference.js.map