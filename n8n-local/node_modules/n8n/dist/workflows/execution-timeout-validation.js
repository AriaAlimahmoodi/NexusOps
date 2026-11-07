"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exceedsMaxExecutionTimeout = exceedsMaxExecutionTimeout;
exports.assertExecutionTimeoutWithinMax = assertExecutionTimeoutWithinMax;
const n8n_workflow_1 = require("n8n-workflow");
function exceedsMaxExecutionTimeout(executionTimeout, maxTimeout) {
    if (executionTimeout === undefined || executionTimeout <= 0 || maxTimeout <= 0)
        return false;
    return executionTimeout > maxTimeout;
}
function assertExecutionTimeoutWithinMax(executionTimeout, maxTimeout) {
    if (!exceedsMaxExecutionTimeout(executionTimeout, maxTimeout))
        return;
    throw new n8n_workflow_1.UserError(`executionTimeout (${executionTimeout}s) exceeds this instance's maximum of ${maxTimeout}s. Set executionTimeout to ${maxTimeout} or less.`);
}
//# sourceMappingURL=execution-timeout-validation.js.map