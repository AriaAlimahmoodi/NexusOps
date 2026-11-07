"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHANNEL_RATE_LIMIT_COOLDOWN_MS = void 0;
exports.rateLimitMessageFromError = rateLimitMessageFromError;
exports.isRateLimitedToolOutput = isRateLimitedToolOutput;
exports.isHttp429 = isHttp429;
exports.channelRateLimitMessage = channelRateLimitMessage;
exports.caughtIntegrationError = caughtIntegrationError;
const constants_1 = require("@n8n/constants");
const backend_network_1 = require("@n8n/backend-network");
const is_record_1 = require("@n8n/utils/is-record");
const integration_error_codes_1 = require("./integration-error-codes");
const integration_helpers_1 = require("./integration-helpers");
exports.CHANNEL_RATE_LIMIT_COOLDOWN_MS = 15 * constants_1.Time.minutes.toMilliseconds;
function isRateLimitExceededResult(value) {
    return ((0, is_record_1.isRecord)(value) &&
        value.ok === false &&
        (0, is_record_1.isRecord)(value.error) &&
        value.error.code === integration_error_codes_1.INTEGRATION_ERROR_CODES.RATE_LIMIT_EXCEEDED);
}
function rateLimitMessageFromResult(value) {
    if ((0, is_record_1.isRecord)(value) &&
        value.ok === false &&
        (0, is_record_1.isRecord)(value.error) &&
        value.error.code === integration_error_codes_1.INTEGRATION_ERROR_CODES.RATE_LIMIT_EXCEEDED &&
        typeof value.error.message === 'string') {
        return value.error.message;
    }
    return undefined;
}
function rateLimitMessageFromError(error) {
    if (!isRateLimitedToolOutput(error))
        return undefined;
    const single = rateLimitMessageFromResult(error);
    if (single !== undefined)
        return single;
    if ((0, is_record_1.isRecord)(error) && Array.isArray(error.results)) {
        for (const entry of error.results) {
            if (!(0, is_record_1.isRecord)(entry))
                continue;
            const message = rateLimitMessageFromResult(entry.result);
            if (message !== undefined)
                return message;
        }
    }
    return undefined;
}
function isRateLimitedToolOutput(output) {
    if (isRateLimitExceededResult(output))
        return true;
    if (!(0, is_record_1.isRecord)(output) || !Array.isArray(output.results))
        return false;
    return output.results.some((entry) => (0, is_record_1.isRecord)(entry) && isRateLimitExceededResult(entry.result));
}
function isHttp429(error) {
    return (0, backend_network_1.httpStatusFromError)(error) === 429;
}
const PLATFORM_DISPLAY_LABEL_OVERRIDES = {
    whatsapp: 'WhatsApp',
};
function channelRateLimitMessage(platform) {
    const label = PLATFORM_DISPLAY_LABEL_OVERRIDES[platform] ??
        `${platform.charAt(0).toUpperCase()}${platform.slice(1)}`;
    return `The ${label} integration has exceeded its rate limit. Please wait a few minutes before trying again.`;
}
function isRecipientScopedRateLimit(error) {
    return (0, is_record_1.isRecord)(error) && error.rateLimitScope === 'recipient';
}
function caughtIntegrationError(error, params) {
    if (isHttp429(error)) {
        if (isRecipientScopedRateLimit(error) && error instanceof Error) {
            return (0, integration_helpers_1.rateLimitExceeded)(error.message);
        }
        params.guard?.record(params.connectionId);
        return (0, integration_helpers_1.rateLimitExceeded)(channelRateLimitMessage(params.platform));
    }
    return (0, integration_helpers_1.integrationError)(params.failedCode, error instanceof Error ? error.message : String(error));
}
//# sourceMappingURL=channel-rate-limit.js.map