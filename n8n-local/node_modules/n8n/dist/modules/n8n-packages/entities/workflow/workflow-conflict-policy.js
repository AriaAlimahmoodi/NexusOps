"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideWorkflowConflictAction = decideWorkflowConflictAction;
const WORKFLOW_CONFLICT_POLICIES = {
    'new-version': (existing) => ({ action: existing ? 'update' : 'create', blocked: false }),
    fail: (existing) => ({ action: 'create', blocked: existing !== null }),
    skip: (existing) => ({ action: existing ? 'skip' : 'create', blocked: false }),
};
function decideWorkflowConflictAction(policy, existing) {
    return WORKFLOW_CONFLICT_POLICIES[policy](existing);
}
//# sourceMappingURL=workflow-conflict-policy.js.map