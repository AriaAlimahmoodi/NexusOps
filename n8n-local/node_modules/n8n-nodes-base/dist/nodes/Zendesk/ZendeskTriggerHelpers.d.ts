import type { IWebhookFunctions } from 'n8n-workflow';
/**
 * Verifies the Zendesk webhook signature using HMAC-SHA256.
 *
 * Zendesk sends a signature in the `X-Zendesk-Webhook-Signature` header
 * which is a base64-encoded HMAC-SHA256 digest of (timestamp + body).
 *
 * The timestamp is provided in the `X-Zendesk-Webhook-Signature-Timestamp` header.
 *
 * This function computes the expected signature using the stored webhook secret
 * and compares it with the provided signature using a constant-time comparison.
 *
 * @returns true if signature is valid or no secret is configured, false otherwise
 */
export declare function verifySignature(this: IWebhookFunctions): boolean;
//# sourceMappingURL=ZendeskTriggerHelpers.d.ts.map