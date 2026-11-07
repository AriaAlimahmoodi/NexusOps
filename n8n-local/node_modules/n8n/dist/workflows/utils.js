"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequiredRedactionScopes = getRequiredRedactionScopes;
exports.getErrorNodeId = getErrorNodeId;
exports.getErrorDescription = getErrorDescription;
exports.dropRedactionPolicy = dropRedactionPolicy;
exports.getWorkflowProjectDetailsSafe = getWorkflowProjectDetailsSafe;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const REDACTED_MODES = {
    none: new Set(),
    'manual-only': new Set(['manual']),
    'non-manual': new Set(['nonManual']),
    all: new Set(['manual', 'nonManual']),
};
function getRequiredRedactionScopes(oldPolicy, newPolicy) {
    const oldSet = REDACTED_MODES[oldPolicy ?? 'none'];
    const newSet = REDACTED_MODES[newPolicy];
    const turnsOn = [...newSet].some((m) => !oldSet.has(m));
    const turnsOff = [...oldSet].some((m) => !newSet.has(m));
    const scopes = [];
    if (turnsOn)
        scopes.push('workflow:enableRedaction');
    if (turnsOff)
        scopes.push('workflow:disableRedaction');
    return scopes;
}
function getErrorNodeId(error) {
    if (error instanceof n8n_workflow_1.NodeError)
        return error.node.id;
    if (error instanceof n8n_workflow_1.WorkflowActivationError)
        return error.node?.id;
    return undefined;
}
function getErrorDescription(error) {
    if (error instanceof n8n_workflow_1.NodeApiError)
        return error.description ?? undefined;
    return undefined;
}
function dropRedactionPolicy(newWorkflow) {
    if (newWorkflow.settings?.redactionPolicy !== undefined) {
        delete newWorkflow.settings.redactionPolicy;
    }
}
async function getWorkflowProjectDetailsSafe(ownershipService, workflowId) {
    try {
        const project = await ownershipService.getWorkflowProjectCached(workflowId);
        return { projectId: project.id, projectName: project.name };
    }
    catch (error) {
        di_1.Container.get(backend_common_1.Logger).warn('Failed to resolve owning project for workflow', {
            workflowId,
            error,
        });
        return { projectId: '', projectName: '' };
    }
}
//# sourceMappingURL=utils.js.map