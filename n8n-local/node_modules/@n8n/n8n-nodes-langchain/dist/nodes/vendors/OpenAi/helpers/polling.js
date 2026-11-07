"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollUntilAvailable = pollUntilAvailable;
const n8n_workflow_1 = require("n8n-workflow");
async function pollUntilAvailable(ctx, request, check, timeoutSeconds, intervalSeconds = 5) {
    const abortSignal = ctx.getExecutionCancelSignal();
    let response;
    const startTime = Date.now();
    while (!response || !check(response)) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= timeoutSeconds * 1000) {
            throw new n8n_workflow_1.NodeApiError(ctx.getNode(), {
                message: 'Timeout reached',
                code: 500,
            });
        }
        if (abortSignal?.aborted) {
            throw new n8n_workflow_1.NodeApiError(ctx.getNode(), {
                message: 'Execution was cancelled',
                code: 500,
            });
        }
        response = await request();
        await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
    }
    return response;
}
//# sourceMappingURL=polling.js.map