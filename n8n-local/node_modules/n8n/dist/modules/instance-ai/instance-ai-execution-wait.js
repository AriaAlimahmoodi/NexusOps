"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForInstanceAiExecution = waitForInstanceAiExecution;
const n8n_workflow_1 = require("n8n-workflow");
async function waitForInstanceAiExecution(args) {
    const { activeExecutions, executionId, timeoutMs, abortSignal } = args;
    if (!activeExecutions.has(executionId))
        return { kind: 'completed' };
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`Execution timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    let onAbort;
    const abortPromise = abortSignal === undefined
        ? undefined
        : new Promise((_, reject) => {
            onAbort = () => {
                const error = new Error(typeof abortSignal.reason === 'string'
                    ? abortSignal.reason
                    : 'This operation was aborted');
                error.name = 'AbortError';
                reject(error);
            };
            if (abortSignal.aborted) {
                onAbort();
                return;
            }
            abortSignal.addEventListener('abort', onAbort, { once: true });
        });
    try {
        await Promise.race([
            activeExecutions.getPostExecutePromise(executionId),
            timeoutPromise,
            ...(abortPromise ? [abortPromise] : []),
        ]);
        return { kind: 'completed' };
    }
    catch (error) {
        const isTimeout = error instanceof Error && error.message.includes('timed out');
        const isAbort = error instanceof Error && (error.name === 'AbortError' || abortSignal?.aborted === true);
        if (!isTimeout && !isAbort)
            throw error;
        try {
            activeExecutions.stopExecution(executionId, isAbort
                ? new n8n_workflow_1.ManualExecutionCancelledError(executionId)
                : new n8n_workflow_1.TimeoutExecutionCancelledError(executionId));
        }
        catch {
        }
        return {
            kind: 'cancelled',
            reason: isAbort ? 'abort' : 'timeout',
            message: isAbort
                ? 'Execution was cancelled'
                : `Execution timed out after ${timeoutMs}ms and was cancelled`,
        };
    }
    finally {
        clearTimeout(timeoutId);
        if (onAbort)
            abortSignal?.removeEventListener('abort', onAbort);
    }
}
//# sourceMappingURL=instance-ai-execution-wait.js.map