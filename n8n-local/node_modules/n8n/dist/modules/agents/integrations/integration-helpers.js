"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationError = integrationError;
exports.rateLimitExceeded = rateLimitExceeded;
exports.connectionUnavailable = connectionUnavailable;
exports.unsupportedQuery = unsupportedQuery;
exports.unsupportedAction = unsupportedAction;
exports.normalizePlatformId = normalizePlatformId;
exports.stringValue = stringValue;
exports.stringProperty = stringProperty;
exports.numberProperty = numberProperty;
exports.booleanProperty = booleanProperty;
exports.isoDateProperty = isoDateProperty;
exports.removeUndefinedValues = removeUndefinedValues;
exports.isDefined = isDefined;
exports.deriveWhatsAppVerifyToken = deriveWhatsAppVerifyToken;
exports.hasUpdateIssueField = hasUpdateIssueField;
exports.sanitiseAppName = sanitiseAppName;
exports.truncateToCodePoints = truncateToCodePoints;
const is_record_1 = require("@n8n/utils/is-record");
const crypto_1 = require("crypto");
const integration_error_codes_1 = require("./integration-error-codes");
function integrationError(code, message) {
    return { ok: false, error: { code, message } };
}
function rateLimitExceeded(message) {
    return integrationError(integration_error_codes_1.INTEGRATION_ERROR_CODES.RATE_LIMIT_EXCEEDED, message);
}
function connectionUnavailable() {
    return integrationError(integration_error_codes_1.INTEGRATION_ERROR_CODES.CONNECTION_NOT_AVAILABLE, 'The integration connection is not currently available.');
}
function unsupportedQuery(platform, query) {
    return integrationError(integration_error_codes_1.INTEGRATION_ERROR_CODES.UNSUPPORTED_QUERY, `The active ${platform} connection does not support ${query}.`);
}
function unsupportedAction(platform, action) {
    return integrationError(integration_error_codes_1.INTEGRATION_ERROR_CODES.UNSUPPORTED_ACTION, `The active ${platform} connection does not support ${action}.`);
}
function normalizePlatformId(platform, id) {
    return id.includes(':') ? id : `${platform}:${id}`;
}
function stringValue(value) {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function stringProperty(value, key) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    return stringValue(value[key]);
}
function numberProperty(value, key) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    const property = value[key];
    return typeof property === 'number' ? property : undefined;
}
function booleanProperty(value, key) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    const property = value[key];
    return typeof property === 'boolean' ? property : undefined;
}
function isoDateProperty(value, key) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    const property = value[key];
    if (property instanceof Date)
        return property.toISOString();
    if (typeof property !== 'string' || property.length === 0)
        return undefined;
    const date = new Date(property);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
function removeUndefinedValues(value) {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}
function isDefined(value) {
    return value !== undefined;
}
function deriveWhatsAppVerifyToken(hmacSignatureSecret, agentId) {
    return (0, crypto_1.createHmac)('sha256', hmacSignatureSecret)
        .update(`whatsapp:verify:${agentId}`)
        .digest('hex');
}
function hasUpdateIssueField(input) {
    return (input.teamId !== undefined ||
        input.title !== undefined ||
        input.description !== undefined ||
        input.assigneeId !== undefined ||
        input.projectId !== undefined ||
        input.labelIds !== undefined ||
        input.priority !== undefined ||
        input.stateId !== undefined ||
        input.parentId !== undefined);
}
function isEmojiGlue(character) {
    const point = character.codePointAt(0) ?? 0;
    return point === 0x200d || (point >= 0xfe00 && point <= 0xfe0f);
}
const WHITESPACE_CONTROLS = /[\t\n\v\f\r\u0085\u2028\u2029]/gu;
const FORMATTING = /[\p{Cc}\p{Cf}]/gu;
const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
function sanitiseAppName(raw, maxLength, fallback) {
    const cleaned = raw
        .replace(WHITESPACE_CONTROLS, ' ')
        .replace(FORMATTING, (character) => (isEmojiGlue(character) ? character : ''))
        .replace(/\s+/g, ' ')
        .trim();
    const out = truncateToCodePoints(cleaned, maxLength);
    return out.length > 0 ? out : fallback;
}
function truncateToCodePoints(value, max) {
    if (Array.from(value).length <= max)
        return value.trim();
    let out = '';
    let points = 0;
    for (const { segment } of GRAPHEMES.segment(value)) {
        const size = Array.from(segment).length;
        if (points + size > max)
            break;
        out += segment;
        points += size;
    }
    return out.trim();
}
//# sourceMappingURL=integration-helpers.js.map