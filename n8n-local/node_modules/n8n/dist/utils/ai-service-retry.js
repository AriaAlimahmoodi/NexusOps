"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAiServiceWithRetry = callAiServiceWithRetry;
const backend_network_1 = require("@n8n/backend-network");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_workflow_1 = require("n8n-workflow");
const AI_SERVICE_MAX_ATTEMPTS = 3;
const AI_SERVICE_RETRY_BACKOFF_BASE_MS = 1_000;
const AI_SERVICE_RETRY_BACKOFF_CAP_MS = 5_000;
const AI_SERVICE_CALL_TIMEOUT_MS = 30_000;
const AI_SERVICE_UNAVAILABLE_MESSAGE = 'The AI assistant service is temporarily unavailable. Please try again in a few minutes.';
class AiServiceCallTimeoutError extends Error {
}
async function callWithTimeout(call, label) {
    let timer;
    const pending = call();
    pending.catch(() => { });
    try {
        return await Promise.race([
            pending,
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(new AiServiceCallTimeoutError(`${label} timed out after ${AI_SERVICE_CALL_TIMEOUT_MS}ms`)), AI_SERVICE_CALL_TIMEOUT_MS);
            }),
        ]);
    }
    finally {
        if (timer)
            clearTimeout(timer);
    }
}
function isTransientAiServiceError(error) {
    if (typeof error !== 'object' || error === null)
        return false;
    const { retryable, status } = (0, backend_network_1.retryabilityFromError)(error);
    return retryable === 'yes' || (retryable === 'unknown' && status === undefined);
}
async function callAiServiceWithRetry(label, call, logger, errorReporter, options = {}) {
    for (let attempt = 1;; attempt++) {
        try {
            return await callWithTimeout(call, label);
        }
        catch (error) {
            if (error instanceof AiServiceCallTimeoutError && options.retryOnTimeout === false) {
                errorReporter?.warn(new Error(`${label} failed after ${attempt} ${attempt === 1 ? 'attempt' : 'attempts'}`, {
                    cause: error,
                }));
                throw new n8n_workflow_1.OperationalError(AI_SERVICE_UNAVAILABLE_MESSAGE, { cause: error });
            }
            if (!isTransientAiServiceError(error))
                throw error;
            if (attempt >= AI_SERVICE_MAX_ATTEMPTS) {
                errorReporter?.warn(new Error(`${label} failed after ${AI_SERVICE_MAX_ATTEMPTS} attempts`, {
                    cause: error,
                }));
                throw new n8n_workflow_1.OperationalError(AI_SERVICE_UNAVAILABLE_MESSAGE, { cause: error });
            }
            logger?.warn(`${label} hit a transient AI assistant service error; retrying`, {
                attempt,
                error: error instanceof Error ? error.message : String(error),
            });
            await (0, sleep_1.sleep)(Math.min(AI_SERVICE_RETRY_BACKOFF_BASE_MS * 2 ** (attempt - 1), AI_SERVICE_RETRY_BACKOFF_CAP_MS));
        }
    }
}
//# sourceMappingURL=ai-service-retry.js.map