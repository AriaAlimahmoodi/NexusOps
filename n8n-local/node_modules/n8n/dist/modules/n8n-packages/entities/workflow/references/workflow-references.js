"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowReferences = void 0;
const caller_ids_reference_1 = require("./caller-ids.reference");
const error_workflow_reference_1 = require("./error-workflow.reference");
const sub_workflow_node_reference_1 = require("./sub-workflow-node.reference");
exports.workflowReferences = [
    sub_workflow_node_reference_1.subWorkflowNodeReference,
    error_workflow_reference_1.errorWorkflowReference,
    caller_ids_reference_1.callerIdsReference,
];
//# sourceMappingURL=workflow-references.js.map