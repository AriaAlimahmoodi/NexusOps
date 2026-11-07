"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExpression = void 0;
exports.asParameters = asParameters;
exports.readInteger = readInteger;
exports.readString = readString;
exports.readOptions = readOptions;
exports.pickDefined = pickDefined;
const n8n_workflow_1 = require("n8n-workflow");
function asParameters(value) {
    return (0, n8n_workflow_1.isNodeParameters)(value) ? value : undefined;
}
const isExpression = (value) => typeof value === 'string' && value.startsWith('=');
exports.isExpression = isExpression;
function readInteger(parameters, key, fallback, label, { min, max } = {}) {
    const value = parameters[key] ?? fallback;
    const parsed = typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))
        ? Number(value)
        : Number.NaN;
    if (!Number.isInteger(parsed) ||
        (min !== undefined && parsed < min) ||
        (max !== undefined && parsed > max)) {
        throw new Error(`"${label}" is an expression or has a value that has no exact replacement, so the node cannot be migrated automatically.`);
    }
    return parsed;
}
function readString(parameters, key, fallback, label) {
    const value = parameters[key] ?? fallback;
    if (typeof value !== 'string' || (0, exports.isExpression)(value)) {
        throw new Error(`"${label}" is an expression or has an unsupported value, so the node cannot be migrated automatically.`);
    }
    return value;
}
function readOptions(parameters) {
    if (parameters.options === undefined)
        return {};
    const options = asParameters(parameters.options);
    if (!options)
        throw new Error('The options of this node are not in a supported format.');
    return options;
}
function pickDefined(parameters, keys) {
    const picked = {};
    for (const key of keys) {
        const value = parameters[key];
        if (value !== undefined)
            picked[key] = value;
    }
    return picked;
}
//# sourceMappingURL=parameter-readers.js.map