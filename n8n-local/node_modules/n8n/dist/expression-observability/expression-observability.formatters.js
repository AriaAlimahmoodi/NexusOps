"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPromName = toPromName;
exports.normalizeAttributes = normalizeAttributes;
exports.normalizeAttributeValue = normalizeAttributeValue;
const MAX_EXPRESSION_TEXT_LENGTH = 256;
function toPromName(name, kind, prefix) {
    const base = prefix + name.replace(/\./g, '_');
    return kind === 'counter' && !base.endsWith('_total') ? base + '_total' : base;
}
function normalizeAttributes(attributes) {
    if (!attributes)
        return undefined;
    const entries = Object.entries(attributes);
    if (entries.length === 0)
        return undefined;
    const result = {};
    for (const [key, value] of entries) {
        const normalized = normalizeAttributeValue(value);
        if (normalized !== undefined)
            result[key] = normalized;
    }
    return result;
}
function normalizeAttributeValue(value) {
    if (value === undefined || value === null)
        return undefined;
    if (typeof value === 'string')
        return value.length > MAX_EXPRESSION_TEXT_LENGTH
            ? value.slice(0, MAX_EXPRESSION_TEXT_LENGTH)
            : value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return value;
    return String(value);
}
//# sourceMappingURL=expression-observability.formatters.js.map