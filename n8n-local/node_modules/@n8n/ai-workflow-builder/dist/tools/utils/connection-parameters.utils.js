"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONNECTION_AFFECTING_PARAMETERS = void 0;
exports.validateConnectionParameters = validateConnectionParameters;
exports.extractConnectionParameters = extractConnectionParameters;
exports.CONNECTION_AFFECTING_PARAMETERS = new Set([
    'mode',
    'operation',
    'resource',
    'action',
    'method',
    'textSplittingMode',
    'useReranker',
    'outputFormat',
    'inputType',
    'outputType',
    'connectionMode',
    'dataType',
    'triggerMode',
]);
function validateConnectionParameters(parameters) {
    const filtered = {};
    const warnings = [];
    for (const [key, value] of Object.entries(parameters)) {
        if (exports.CONNECTION_AFFECTING_PARAMETERS.has(key)) {
            filtered[key] = value;
        }
        else {
            warnings.push(`Parameter "${key}" is not a connection-affecting parameter and will be ignored`);
        }
    }
    return {
        valid: Object.keys(filtered).length > 0,
        filtered,
        warnings,
    };
}
function extractConnectionParameters(parameters) {
    const connectionParams = {};
    for (const [key, value] of Object.entries(parameters)) {
        if (exports.CONNECTION_AFFECTING_PARAMETERS.has(key)) {
            connectionParams[key] = value;
        }
    }
    return connectionParams;
}
//# sourceMappingURL=connection-parameters.utils.js.map