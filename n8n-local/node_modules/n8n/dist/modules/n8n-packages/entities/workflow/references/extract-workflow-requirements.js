"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractWorkflowRequirements = extractWorkflowRequirements;
const workflow_references_1 = require("./workflow-references");
function extractWorkflowRequirements(workflow) {
    const byId = new Map();
    for (const reference of workflow_references_1.workflowReferences) {
        for (const requirement of reference.extract(workflow)) {
            if (!byId.has(requirement.referencedWorkflowId)) {
                byId.set(requirement.referencedWorkflowId, requirement);
            }
        }
    }
    return [...byId.values()];
}
//# sourceMappingURL=extract-workflow-requirements.js.map