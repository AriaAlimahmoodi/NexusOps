"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETRY_AFTER_MAX_MS = exports.MAX_BACKOFF_MS = void 0;
exports.pollFailureFromError = pollFailureFromError;
exports.computeBackoffDelayMs = computeBackoffDelayMs;
const backend_network_1 = require("@n8n/backend-network");
const constants_1 = require("@n8n/constants");
const scheduler_1 = require("@n8n/scheduler");
const error_chain_1 = require("@n8n/utils/errors/error-chain");
const n8n_workflow_1 = require("n8n-workflow");
exports.MAX_BACKOFF_MS = 30 * constants_1.Time.minutes.toMilliseconds;
exports.RETRY_AFTER_MAX_MS = 1 * constants_1.Time.hours.toMilliseconds;
function pollFailureFromError(error, now) {
    return pollFailureDeclaredByNode(error, now) ?? pollFailureFromNetwork(error, now);
}
const TIMED = new Set(n8n_workflow_1.TIMED_CAUSES);
const ACTIONABLE = new Set(n8n_workflow_1.ACTIONABLE_CAUSES);
const isTimedCause = (value) => typeof value === 'string' && TIMED.has(value);
const isActionableCause = (value) => typeof value === 'string' && ACTIONABLE.has(value);
function pollFailureDeclaredByNode(error, now) {
    for (const level of (0, error_chain_1.errorChain)(error)) {
        const failure = level.failure;
        if ((0, error_chain_1.isObjectLike)(failure)) {
            if (isActionableCause(failure.cause)) {
                return { type: 'permanent', retryAfterMs: null, cause: failure.cause };
            }
            if (isTimedCause(failure.cause)) {
                return {
                    type: 'transient',
                    retryAfterMs: declaredWaitMs(failure, now),
                    cause: failure.cause,
                };
            }
        }
    }
    return undefined;
}
function declaredWaitMs(failure, now) {
    const { retryAfterMs, resetsAtEpochMs } = failure;
    if (typeof retryAfterMs === 'number' && Number.isFinite(retryAfterMs) && retryAfterMs > 0) {
        return retryAfterMs;
    }
    if (typeof resetsAtEpochMs === 'number' && Number.isFinite(resetsAtEpochMs)) {
        const waitMs = resetsAtEpochMs - now.getTime();
        if (waitMs > 0) {
            return waitMs;
        }
    }
    return null;
}
function pollFailureFromNetwork(error, now) {
    const { retryable, status, retryAfterMs } = (0, backend_network_1.retryabilityFromError)(error, now);
    if (retryable === 'no') {
        return { type: 'permanent', retryAfterMs: null };
    }
    const throttled = retryAfterMs !== undefined;
    const waitMs = throttled && retryAfterMs > 0 ? retryAfterMs : null;
    if (status === 429 || throttled) {
        return { type: 'transient', retryAfterMs: waitMs, cause: 'rate-limited' };
    }
    if (status === 401) {
        return { type: 'permanent', retryAfterMs: null, cause: 'credential-invalid' };
    }
    if (status === 403) {
        return { type: 'permanent', retryAfterMs: null };
    }
    if (retryable === 'yes') {
        return { type: 'transient', retryAfterMs: null, cause: 'temporarily-unavailable' };
    }
    return { type: 'transient', retryAfterMs: null };
}
function computeBackoffDelayMs(args) {
    const { type, consecutiveErrors, retryAfterMs: retryAfter } = args;
    const curveMs = (0, scheduler_1.backoff)(consecutiveErrors, { maxMs: exports.MAX_BACKOFF_MS });
    const floorMs = Math.min(retryAfter ?? 0, exports.RETRY_AFTER_MAX_MS);
    return type === 'permanent' ? exports.MAX_BACKOFF_MS : Math.max(curveMs, floorMs);
}
//# sourceMappingURL=poll-backoff-policy.js.map