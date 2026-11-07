"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignature = verifySignature;
const crypto_1 = require("crypto");
/**
 * Maximum allowed age for a webhook request timestamp (5 minutes).
 * Requests older than this are considered potential replay attacks.
 */
const MAX_TIMESTAMP_AGE_SECONDS = 300;
/**
 * Verifies webhook signatures and prevents replay attacks.
 *
 * Features:
 * - Signature verification using constant-time comparison (prevents timing attacks)
 * - Optional timestamp validation (prevents replay attacks)
 * - Supports HMAC-based and simple secret comparison patterns
 *
 * @param options - Configuration options
 * @returns `true` if valid, `false` otherwise. Never throws.
 *
 * @example
 * verifySignature({
 *   getExpectedSignature: () => {
 *     const hmac = createHmac('sha256', secret);
 *     hmac.update(rawBody);
 *     return `sha256=${hmac.digest('base64')}`;
 *   },
 *   getActualSignature: () => req.header('x-signature'),
 *   getTimestamp: () => req.header('x-timestamp'),
 * });
 */
function verifySignature(options) {
    const { getExpectedSignature, getActualSignature, getTimestamp, maxTimestampAgeSeconds } = options;
    try {
        // Validate timestamp if provided (replay attack prevention)
        if (getTimestamp) {
            const timestamp = getTimestamp();
            const shouldSkip = options.skipIfNoTimestamp && timestamp === null;
            if (!shouldSkip && !isTimestampValid(timestamp, maxTimestampAgeSeconds)) {
                return false;
            }
        }
        // Get expected signature
        const expectedSignature = getExpectedSignature();
        if (!expectedSignature || typeof expectedSignature !== 'string') {
            if (options.skipIfNoExpectedSignature) {
                return true;
            }
            return false;
        }
        // Get actual signature
        const actualSignature = getActualSignature();
        if (!actualSignature || typeof actualSignature !== 'string') {
            return false;
        }
        const expectedBuffer = Buffer.from(expectedSignature);
        const actualBuffer = Buffer.from(actualSignature);
        // Perform constant-time comparison to prevent timing attacks
        return (expectedBuffer.length === actualBuffer.length && (0, crypto_1.timingSafeEqual)(expectedBuffer, actualBuffer));
    }
    catch (error) {
        return false;
    }
}
/**
 * Validates timestamp is within acceptable window (auto-detects seconds/milliseconds).
 */
function isTimestampValid(timestamp, maxTimestampAgeSeconds) {
    if (timestamp === null) {
        return false;
    }
    const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : Math.floor(timestamp);
    if (isNaN(timestampNum)) {
        return false;
    }
    // Convert to seconds if timestamp is in milliseconds
    const timestampSec = timestampNum > 1e10 ? Math.floor(timestampNum / 1000) : timestampNum;
    const currentTimeSec = Math.floor(Date.now() / 1000);
    const maxAge = maxTimestampAgeSeconds ?? MAX_TIMESTAMP_AGE_SECONDS;
    const age = Math.abs(currentTimeSec - timestampSec);
    return age <= maxAge;
}
//# sourceMappingURL=webhook-signature-verification.js.map