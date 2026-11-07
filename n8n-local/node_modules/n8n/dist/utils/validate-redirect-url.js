"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRedirectUrl = validateRedirectUrl;
const PLACEHOLDER_ORIGIN = 'https://n8n.invalid';
function validateRedirectUrl(redirectUrl) {
    if (typeof redirectUrl !== 'string' || redirectUrl.trim() === '') {
        return '/';
    }
    const trimmed = redirectUrl.trim();
    if (!trimmed.startsWith('/')) {
        return '/';
    }
    if (trimmed.startsWith('//')) {
        return '/';
    }
    if (/[\\\t\n\r]/.test(trimmed)) {
        return '/';
    }
    try {
        if (new URL(trimmed, PLACEHOLDER_ORIGIN).origin !== PLACEHOLDER_ORIGIN) {
            return '/';
        }
    }
    catch {
        return '/';
    }
    return trimmed;
}
//# sourceMappingURL=validate-redirect-url.js.map