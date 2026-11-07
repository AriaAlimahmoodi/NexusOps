"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreSecretConfig = exports.redactSecretConfig = exports.collectSecretFieldNames = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const collectSecretFieldNames = (options) => {
    const names = new Set();
    for (const prop of options ?? []) {
        if (prop.typeOptions?.password === true) {
            names.add(prop.name);
        }
        for (const option of prop.options ?? []) {
            if ((0, n8n_workflow_1.isINodePropertyCollection)(option)) {
                for (const name of (0, exports.collectSecretFieldNames)(option.values))
                    names.add(name);
            }
            else if ('type' in option) {
                for (const name of (0, exports.collectSecretFieldNames)([option]))
                    names.add(name);
            }
        }
    }
    return names;
};
exports.collectSecretFieldNames = collectSecretFieldNames;
const redactValue = (value, secretNames) => {
    if (Array.isArray(value)) {
        return value.map((item) => redactValue(item, secretNames));
    }
    if (isRecord(value)) {
        const result = {};
        for (const [key, val] of Object.entries(value)) {
            result[key] = secretNames.has(key)
                ? n8n_workflow_1.CREDENTIAL_BLANKING_VALUE
                : redactValue(val, secretNames);
        }
        return result;
    }
    return value;
};
const redactSecretConfig = (config, secretNames) => {
    const result = {};
    for (const [key, val] of Object.entries(config ?? {})) {
        result[key] = secretNames.has(key) ? n8n_workflow_1.CREDENTIAL_BLANKING_VALUE : redactValue(val, secretNames);
    }
    return result;
};
exports.redactSecretConfig = redactSecretConfig;
const restoreValue = (incoming, stored, secretNames) => {
    if (Array.isArray(incoming)) {
        return incoming.map((item, index) => restoreValue(item, Array.isArray(stored) ? stored[index] : undefined, secretNames));
    }
    if (isRecord(incoming)) {
        const storedObj = isRecord(stored) ? stored : undefined;
        const result = {};
        for (const [key, val] of Object.entries(incoming)) {
            if (secretNames.has(key) && val === n8n_workflow_1.CREDENTIAL_BLANKING_VALUE) {
                result[key] = storedObj && key in storedObj ? storedObj[key] : val;
            }
            else {
                result[key] = restoreValue(val, storedObj?.[key], secretNames);
            }
        }
        return result;
    }
    return incoming;
};
const restoreSecretConfig = (incoming, stored, secretNames) => {
    const result = {};
    for (const [key, val] of Object.entries(incoming)) {
        if (secretNames.has(key) && val === n8n_workflow_1.CREDENTIAL_BLANKING_VALUE) {
            result[key] = key in stored ? stored[key] : val;
        }
        else {
            result[key] = restoreValue(val, stored[key], secretNames);
        }
    }
    return result;
};
exports.restoreSecretConfig = restoreSecretConfig;
//# sourceMappingURL=config-redaction.js.map