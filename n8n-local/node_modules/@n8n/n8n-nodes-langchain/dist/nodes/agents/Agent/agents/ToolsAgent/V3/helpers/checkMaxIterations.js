"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMaxIterations = checkMaxIterations;
const n8n_workflow_1 = require("n8n-workflow");
function checkMaxIterations(response, maxIterations, node) {
    if (response?.metadata?.iterationCount === undefined) {
        return;
    }
    if (response.metadata.iterationCount >= maxIterations) {
        throw new n8n_workflow_1.NodeOperationError(node, `Max iterations (${maxIterations}) reached. The agent could not complete the task within the allowed number of iterations.`);
    }
}
//# sourceMappingURL=checkMaxIterations.js.map