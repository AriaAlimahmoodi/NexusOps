"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForExecutionResult = exports.WORKFLOW_EXECUTION_TIMEOUT_MAX_SECONDS = exports.WORKFLOW_EXECUTION_TIMEOUT_DEFAULT_SECONDS = exports.WORKFLOW_EXECUTION_TIMEOUT_MS = void 0;
const constants_1 = require("@n8n/constants");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const mcp_errors_1 = require("../mcp.errors");
exports.WORKFLOW_EXECUTION_TIMEOUT_MS = 5 * constants_1.Time.minutes.toMilliseconds;
exports.WORKFLOW_EXECUTION_TIMEOUT_DEFAULT_SECONDS = exports.WORKFLOW_EXECUTION_TIMEOUT_MS * constants_1.Time.milliseconds.toSeconds;
exports.WORKFLOW_EXECUTION_TIMEOUT_MAX_SECONDS = 60 * constants_1.Time.minutes.toSeconds;
const waitForExecutionResult = async (executionId, activeExecutions, mcpService, timeoutMs = exports.WORKFLOW_EXECUTION_TIMEOUT_MS) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new mcp_errors_1.McpExecutionTimeoutError(executionId, timeoutMs));
        }, timeoutMs);
    });
    const resultPromise = mcpService.isQueueMode
        ? mcpService.createPendingResponse(executionId).promise
        : activeExecutions.getPostExecutePromise(executionId);
    try {
        const data = await Promise.race([resultPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        if (data === undefined) {
            throw new n8n_workflow_1.UnexpectedError('Workflow did not return any data');
        }
        return data;
    }
    catch (error) {
        if (timeoutId)
            clearTimeout(timeoutId);
        if (mcpService.isQueueMode) {
            mcpService.removePendingResponse(executionId);
        }
        if (error instanceof mcp_errors_1.McpExecutionTimeoutError) {
            try {
                const cancellationError = new n8n_workflow_1.TimeoutExecutionCancelledError(error.executionId);
                activeExecutions.stopExecution(error.executionId, cancellationError);
            }
            catch (stopError) {
                throw new n8n_workflow_1.UnexpectedError(`Failed to stop timed-out execution [id: ${error.executionId}]: ${(0, ensure_error_1.ensureError)(stopError).message}`);
            }
        }
        throw error;
    }
};
exports.waitForExecutionResult = waitForExecutionResult;
//# sourceMappingURL=execution-utils.js.map