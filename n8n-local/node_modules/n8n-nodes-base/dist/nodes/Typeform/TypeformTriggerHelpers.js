"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignature = verifySignature;
const crypto_1 = require("crypto");
const webhook_signature_verification_1 = require("../../utils/webhook-signature-verification");
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
function verifySignature() {
    const req = this.getRequestObject();
    const webhookData = this.getWorkflowStaticData('node');
    const secret = webhookData.webhookSecret;
    return (0, webhook_signature_verification_1.verifySignature)({
        getExpectedSignature: () => {
            if (!secret || typeof secret !== 'string' || !req.rawBody) {
                return null;
            }
            const hmac = (0, crypto_1.createHmac)('sha256', secret);
            const payload = Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody);
            hmac.update(payload);
            const hash = hmac.digest('base64');
            const computedSignature = `sha256=${hash}`;
            return computedSignature;
        },
        skipIfNoExpectedSignature: !secret || typeof secret !== 'string',
        getActualSignature: () => {
            const receivedSignature = req.header('typeform-signature');
            return typeof receivedSignature === 'string' ? receivedSignature : null;
        },
    });
}
//# sourceMappingURL=TypeformTriggerHelpers.js.map