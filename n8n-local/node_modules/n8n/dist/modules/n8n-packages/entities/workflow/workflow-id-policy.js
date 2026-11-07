"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideWorkflowId = decideWorkflowId;
const db_1 = require("@n8n/db");
const WORKFLOW_ID_POLICIES = {
    new: () => (0, db_1.generateNanoId)(),
    source: (sourceWorkflowId) => sourceWorkflowId,
};
function decideWorkflowId(policy, sourceWorkflowId) {
    return WORKFLOW_ID_POLICIES[policy](sourceWorkflowId);
}
//# sourceMappingURL=workflow-id-policy.js.map