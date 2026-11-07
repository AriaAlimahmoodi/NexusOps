"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideMatchedProject = decideMatchedProject;
const PROJECT_CONFLICT_POLICIES = {
    merge: { action: 'skip', blocked: false },
    fail: { action: 'skip', blocked: true },
    overwrite: { action: 'update', blocked: false },
};
function decideMatchedProject(policy) {
    return PROJECT_CONFLICT_POLICIES[policy];
}
//# sourceMappingURL=project-conflict-policy.js.map