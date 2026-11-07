"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectCredentialDataForExport = selectCredentialDataForExport;
const utils_1 = require("../../../../utils");
const NEVER_EXPORTED_KEYS = new Set(['oauthTokenData']);
function isExpressionOnly(value) {
    if (typeof value === 'string')
        return (0, utils_1.containsExpression)(value);
    if (Array.isArray(value))
        return value.length > 0 && value.every(isExpressionOnly);
    if ((0, utils_1.isObject)(value)) {
        const values = Object.entries(value)
            .filter(([key]) => !NEVER_EXPORTED_KEYS.has(key))
            .map(([, entry]) => entry);
        return values.length > 0 && values.every(isExpressionOnly);
    }
    return false;
}
function filterValue(value) {
    if (typeof value === 'string') {
        return (0, utils_1.containsExpression)(value) ? value : undefined;
    }
    if (Array.isArray(value)) {
        if (!isExpressionOnly(value))
            return undefined;
        return value
            .map(filterValue)
            .filter((entry) => entry !== undefined);
    }
    if ((0, utils_1.isObject)(value)) {
        const kept = filterObject(value);
        return Object.keys(kept).length > 0 ? kept : undefined;
    }
    return undefined;
}
function filterObject(value) {
    const kept = {};
    for (const [key, entry] of Object.entries(value)) {
        if (NEVER_EXPORTED_KEYS.has(key))
            continue;
        const filtered = filterValue(entry);
        if (filtered !== undefined)
            kept[key] = filtered;
    }
    return kept;
}
const SELECT_EXPORTED_DATA = {
    'expression-values-only': async (getDecryptedData) => {
        const filtered = filterObject(await getDecryptedData());
        return Object.keys(filtered).length > 0 ? filtered : undefined;
    },
    'no-values': async () => undefined,
};
async function selectCredentialDataForExport(policy, getDecryptedData) {
    return await SELECT_EXPORTED_DATA[policy](getDecryptedData);
}
//# sourceMappingURL=credential-export-policy.js.map