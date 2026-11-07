"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UninspectableSubworkflowSourceError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class UninspectableSubworkflowSourceError extends n8n_workflow_1.NodeOperationError {
    constructor(node) {
        super(node, `The '${node.name}' node loads its sub-workflow from a source that is resolved only when the workflow runs, so its credential access cannot be checked on save. Use the "Database" source, or enter fixed JSON in the "Define Below" source.`);
    }
}
exports.UninspectableSubworkflowSourceError = UninspectableSubworkflowSourceError;
//# sourceMappingURL=uninspectable-subworkflow-source.error.js.map