"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyCheckFailedError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class PolicyCheckFailedError extends n8n_workflow_1.OperationalError {
    constructor(point, correlationIds) {
        super(`Could not verify policy for ${point}, so the action was blocked`);
        this.httpStatusCode = 503;
        this.errorCode = 503;
        this.meta = { correlationIds };
    }
}
exports.PolicyCheckFailedError = PolicyCheckFailedError;
//# sourceMappingURL=policy-check-failed.error.js.map