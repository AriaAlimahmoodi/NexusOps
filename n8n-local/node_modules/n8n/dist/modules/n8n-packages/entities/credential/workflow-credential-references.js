"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitWorkflowCredentials = visitWorkflowCredentials;
const n8n_workflow_1 = require("n8n-workflow");
function visitWorkflowCredentials(nodes, visitor) {
    if (!nodes)
        return false;
    let changed = false;
    for (const node of nodes) {
        for (const [credentialType, details] of Object.entries(node.credentials ?? {})) {
            changed = visitor(credentialType, details) || changed;
        }
        if (!(0, n8n_workflow_1.isNodeWithWorkflowSelector)(node))
            continue;
        const workflowJson = node.parameters.workflowJson;
        if (typeof workflowJson !== 'string')
            continue;
        let inlineWorkflow;
        try {
            inlineWorkflow = (0, n8n_workflow_1.jsonParse)(workflowJson);
        }
        catch {
            continue;
        }
        if (!inlineWorkflow || !Array.isArray(inlineWorkflow.nodes))
            continue;
        if (visitWorkflowCredentials(inlineWorkflow.nodes, visitor)) {
            node.parameters.workflowJson = JSON.stringify(inlineWorkflow);
            changed = true;
        }
    }
    return changed;
}
//# sourceMappingURL=workflow-credential-references.js.map