"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCredentialData = mergeCredentialData;
const is_record_1 = require("@n8n/utils/is-record");
const utils_1 = require("../utils");
function mergeValue(incoming, existing, arrays) {
    if (typeof incoming === 'string') {
        if ((0, utils_1.containsExpression)(incoming)) {
            return incoming;
        }
        else if (existing !== undefined && existing !== null) {
            return existing;
        }
        return '';
    }
    if (typeof incoming === 'number' || typeof incoming === 'boolean') {
        return incoming;
    }
    if (Array.isArray(incoming)) {
        if (arrays === 'keep-existing')
            return existing;
        if (Array.isArray(existing) && existing.length === incoming.length) {
            return incoming.map((item, index) => mergeValue(item, existing[index], arrays));
        }
        return incoming;
    }
    if ((0, is_record_1.isRecord)(incoming)) {
        const merged = mergeObjects(incoming, (0, is_record_1.isRecord)(existing) ? existing : {}, arrays);
        if (arrays === 'keep-existing' && !(0, is_record_1.isRecord)(existing) && Object.keys(merged).length === 0) {
            return existing;
        }
        return merged;
    }
    return existing;
}
function mergeObjects(incoming, existing, arrays) {
    const merged = {};
    for (const [key, incomingValue] of Object.entries(incoming)) {
        const existingValue = Object.hasOwn(existing, key) ? existing[key] : undefined;
        const mergedValue = mergeValue(incomingValue, existingValue, arrays);
        if (mergedValue !== undefined) {
            merged[key] = mergedValue;
        }
    }
    for (const [key, existingValue] of Object.entries(existing)) {
        if (!Object.hasOwn(incoming, key)) {
            merged[key] = existingValue;
        }
    }
    return merged;
}
function mergeCredentialData({ existing, incoming, arrays, }) {
    return mergeObjects(incoming, existing, arrays);
}
//# sourceMappingURL=credential-data-merge.js.map