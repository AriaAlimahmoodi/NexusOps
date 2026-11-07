"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJweToken = isJweToken;
exports.decryptJweToken = decryptJweToken;
exports.decryptJweTokenData = decryptJweTokenData;
const jose_1 = require("jose");
const n8n_workflow_1 = require("n8n-workflow");
const JWE_SEGMENT_COUNT = 5;
function isJweToken(token) {
    if (typeof token !== 'string' || token.length === 0)
        return false;
    return token.split('.').length === JWE_SEGMENT_COUNT;
}
async function decryptJweToken(token, privateKey) {
    try {
        const { plaintext } = await (0, jose_1.compactDecrypt)(token, privateKey);
        return new TextDecoder().decode(plaintext);
    }
    catch (error) {
        if (error instanceof jose_1.errors.JOSENotSupported) {
            throw new n8n_workflow_1.UserError(`Cannot decrypt token: ${error.message}${formatHeaderHint(token)}. Re-register the client at the IdP with a standard JWE algorithm (RFC 7518).`);
        }
        throw error;
    }
}
function formatHeaderHint(token) {
    const [headerSegment] = token.split('.');
    let header;
    try {
        header = JSON.parse(Buffer.from(headerSegment, 'base64url').toString('utf8'));
    }
    catch {
        return '';
    }
    const parts = [];
    if (typeof header.alg === 'string')
        parts.push(`alg="${header.alg}"`);
    if (typeof header.enc === 'string')
        parts.push(`enc="${header.enc}"`);
    return parts.length ? ` (${parts.join(', ')})` : '';
}
async function decryptJweTokenData(data, privateKey) {
    const result = { ...data };
    for (const field of ['access_token', 'id_token']) {
        const value = result[field];
        if (isJweToken(value)) {
            result[field] = await decryptJweToken(value, privateKey);
        }
    }
    return result;
}
//# sourceMappingURL=oauth-jwe.utils.js.map