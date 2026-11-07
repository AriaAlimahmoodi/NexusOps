"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeLlmErrorMessage = sanitizeLlmErrorMessage;
function sanitizeLlmErrorMessage(error) {
    const statusCode = extractStatusCode(error);
    const rawMessage = error instanceof Error ? error.message : String(error);
    if (statusCode === 429 || containsHtml(rawMessage) || rawMessage.length > 500) {
        return buildUserFriendlyMessage(statusCode);
    }
    return rawMessage;
}
function containsHtml(message) {
    return message.includes('<!DOCTYPE') || message.includes('<html') || message.includes('<HTML');
}
function extractStatusCode(error) {
    if (error !== null &&
        typeof error === 'object' &&
        'status' in error &&
        typeof error.status === 'number') {
        return error.status;
    }
    return undefined;
}
function buildUserFriendlyMessage(statusCode) {
    if (statusCode === 403) {
        return 'Your request was blocked by the API provider. This may be caused by content in the request that was flagged by the security filter. Please try rephrasing your request.';
    }
    if (statusCode === 429) {
        return 'Rate limit exceeded. Please wait a moment and try again.';
    }
    if (statusCode === 502 || statusCode === 503) {
        return 'The AI service is temporarily unavailable. Please try again in a moment.';
    }
    if (statusCode !== undefined && statusCode >= 500) {
        return 'The AI service encountered an internal error. Please try again.';
    }
    return 'An unexpected error occurred while communicating with the AI service. Please try again.';
}
//# sourceMappingURL=error-sanitizer.js.map