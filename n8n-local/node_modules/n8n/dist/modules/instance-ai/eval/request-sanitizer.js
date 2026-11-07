"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactSecretKeys = redactSecretKeys;
exports.redactSecretValuePatterns = redactSecretValuePatterns;
exports.truncateForLlm = truncateForLlm;
exports.isSecretKey = isSecretKey;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const MAX_BODY_LENGTH = 4096;
const SECRET_KEY_PATTERN = /key|secret|token|password|credential|auth|bearer|cookie|session|ssn|connectionString|private|proxy-auth/i;
const SAFE_KEY_PATTERN = /keyword|primary.?key|foreign.?key|sort.?key|partition.?key|group.?key|key.?name|key.?type|key.?field|key.?column|authentication$|author(?!.*(key|token|secret|password|credential))/i;
const SECRET_HEADER_PATTERN = /^(authorization|x-api-key|proxy-authorization|cookie|set-cookie)$/i;
const REDACTED = '<redacted>';
const SECRET_VALUE_PATTERNS = [
    { pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g, replacement: REDACTED },
    { pattern: /\bxox[a-z]-[A-Za-z0-9-]{10,}\b/g, replacement: REDACTED },
    { pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, replacement: REDACTED },
    { pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, replacement: REDACTED },
    { pattern: /\bAKIA[0-9A-Z]{16}\b/g, replacement: REDACTED },
    { pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g, replacement: REDACTED },
    { pattern: /\bya29\.[0-9A-Za-z_-]{20,}\b/g, replacement: REDACTED },
    { pattern: /\bbearer\s+[A-Za-z0-9._~+/-]{20,}=*/gi, replacement: REDACTED },
    {
        pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/g,
        replacement: REDACTED,
    },
    {
        pattern: /\b(api[\s_-]?key|access[\s_-]?token|refresh[\s_-]?token|client[\s_-]?secret|secret|password|passwd)\b(["']?\s*[=:]\s*["']?)[^\s"',;]{6,}/gi,
        replacement: `$1$2${REDACTED}`,
    },
];
function redactSecretKeys(value) {
    if (value === null || value === undefined)
        return value;
    if (Array.isArray(value))
        return value.map((item) => redactSecretKeys(item));
    if (typeof value !== 'object')
        return value;
    const result = {};
    for (const [key, val] of Object.entries(value)) {
        if (isSecretKey(key)) {
            result[key] = REDACTED;
        }
        else if (typeof val === 'object' && val !== null) {
            result[key] = redactSecretKeys(val);
        }
        else {
            result[key] = val;
        }
    }
    return result;
}
function redactSecretValuePatterns(text) {
    let result = text;
    for (const { pattern, replacement } of SECRET_VALUE_PATTERNS) {
        result = result.replace(pattern, replacement);
    }
    return result;
}
function truncateForLlm(serialized, maxLength = MAX_BODY_LENGTH) {
    if (serialized.length <= maxLength)
        return serialized;
    di_1.Container.get(backend_common_1.Logger).warn(`[EvalMock] Request body truncated from ${serialized.length} to ${maxLength} chars — ` +
        'large bodies may indicate non-synthetic data flowing through the eval handler');
    return serialized.slice(0, maxLength) + '... [truncated]';
}
function isSecretKey(key) {
    if (SECRET_HEADER_PATTERN.test(key))
        return true;
    if (SAFE_KEY_PATTERN.test(key))
        return false;
    if (SECRET_KEY_PATTERN.test(key))
        return true;
    return false;
}
//# sourceMappingURL=request-sanitizer.js.map