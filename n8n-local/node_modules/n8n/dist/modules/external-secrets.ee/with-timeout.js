"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = void 0;
exports.withTimeout = withTimeout;
const n8n_workflow_1 = require("n8n-workflow");
class TimeoutError extends n8n_workflow_1.OperationalError {
}
exports.TimeoutError = TimeoutError;
async function withTimeout(work, ms, message) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new TimeoutError(message)), ms);
    });
    try {
        return await Promise.race([work, timeout]);
    }
    finally {
        clearTimeout(timeoutId);
    }
}
//# sourceMappingURL=with-timeout.js.map