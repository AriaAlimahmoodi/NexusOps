export interface VerifySignatureOptions {
    /**
     * Returns the expected signature/secret. For HMAC, compute using the same algorithm.
     * Return `null` if signature cannot be computed (missing secret/body).
     */
    getExpectedSignature: () => string | null;
    /**
     * If true, skip validation when `getExpectedSignature()` returns `null`.
     * Use for backward compatibility with unsigned webhooks.
     * @default false
     */
    skipIfNoExpectedSignature?: boolean;
    /**
     * Returns the actual signature from request headers, or `null` if not present.
     */
    getActualSignature: () => string | null;
    /**
     * Optional. Returns timestamp from request (seconds or milliseconds, auto-converted).
     * Enables replay attack prevention (default: 5 minute window).
     */
    getTimestamp?: () => number | string | null;
    /**
     * If true, skip timestamp validation when `getTimestamp()` returns `null`.
     * @default false
     */
    skipIfNoTimestamp?: boolean;
    /**
     * Maximum allowed timestamp age in seconds.
     * @default 300 (5 minutes)
     */
    maxTimestampAgeSeconds?: number;
}
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
export declare function verifySignature(options: VerifySignatureOptions): boolean;
//# sourceMappingURL=webhook-signature-verification.d.ts.map