"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExecutionRef = createExecutionRef;
exports.toWorkflowSnapshot = toWorkflowSnapshot;
exports.toWorkflowDocument = toWorkflowDocument;
exports.isExecutionDataPayload = isExecutionDataPayload;
function createExecutionRef(workflowId, executionId) {
    return { workflowId, executionId };
}
function toWorkflowSnapshot(workflow) {
    const { id, name, nodes, connections, settings, nodeGroups } = workflow;
    return { id, name, nodes, connections, settings, nodeGroups };
}
function toWorkflowDocument(workflow) {
    return toWorkflowSnapshot(workflow);
}
function isExecutionDataPayload(x) {
    return 'data' in x && typeof x.data === 'string';
}
//# sourceMappingURL=types.js.map