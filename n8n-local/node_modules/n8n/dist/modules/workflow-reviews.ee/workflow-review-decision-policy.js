"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDecisionCapability = resolveDecisionCapability;
const ALLOWED = { allowed: true };
function resolveDecisionCapability(facts) {
    if (!facts.canReadEveryWorkflow) {
        return { allowed: false, reason: 'missing_permission' };
    }
    if (facts.hasAdminOverride || facts.isAssignedReviewer) {
        return ALLOWED;
    }
    if (facts.isAuthor) {
        return { allowed: false, reason: 'author' };
    }
    return { allowed: false, reason: 'missing_reviewer_permission' };
}
//# sourceMappingURL=workflow-review-decision-policy.js.map