import type { IWebhookFunctions } from 'n8n-workflow';
/**
 * Verifies the Typeform webhook signature.
 *
 * Typeform signs webhooks using HMAC SHA-256:
 * 1. Create HMAC SHA-256 hash of the entire payload (as binary) using the secret as key
 * 2. Encode the hash in base64 format
 * 3. Add prefix `sha256=` to the hash
 * 4. Compare with the signature in the `Typeform-Signature` header
 *
 * @returns true if the signature is valid, false otherwise
 * @returns true if no secret is configured (backward compatibility with old triggers)
 */
export declare function verifySignature(this: IWebhookFunctions): boolean;
//# sourceMappingURL=TypeformTriggerHelpers.d.ts.map