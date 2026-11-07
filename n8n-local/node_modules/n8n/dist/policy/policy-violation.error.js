"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyViolationError = exports.hasViolations = void 0;
exports.isPolicyRefusal = isPolicyRefusal;
exports.findPolicyViolations = findPolicyViolations;
const n8n_workflow_1 = require("n8n-workflow");
const hasViolations = (violations) => violations.length > 0;
exports.hasViolations = hasViolations;
function summarize(violations) {
    if (violations.length === 1)
        return violations[0].message;
    return `Blocked by policy: ${violations.map((v) => v.message).join('; ')}`;
}
class PolicyViolationError extends n8n_workflow_1.UserError {
    constructor(violations, message = summarize(violations)) {
        super(message, { level: 'warning' });
        this.httpStatusCode = 403;
        this.errorCode = 403;
        this.isPolicyRefusal = true;
        this.violations = [...violations];
        this.meta = { violations: this.violations };
    }
}
exports.PolicyViolationError = PolicyViolationError;
function isPolicyRefusal(error) {
    return error instanceof PolicyViolationError || (0, n8n_workflow_1.hasPolicyRefusalMarker)(error);
}
const MAX_CAUSE_DEPTH = 5;
function findPolicyViolations(error) {
    let current = error;
    for (let depth = 0; depth < MAX_CAUSE_DEPTH && current instanceof Error; depth++) {
        if (current instanceof PolicyViolationError && (0, exports.hasViolations)(current.violations)) {
            return current.violations;
        }
        current = current.cause;
    }
    return undefined;
}
//# sourceMappingURL=policy-violation.error.js.map