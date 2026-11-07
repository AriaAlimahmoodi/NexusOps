"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExpressionAnnotations = buildExpressionAnnotations;
function buildExpressionAnnotations(expressionValues) {
    const annotations = new Map();
    if (!expressionValues)
        return annotations;
    for (const [nodeName, expressions] of Object.entries(expressionValues)) {
        for (const { expression, resolvedValue, parameterPath } of expressions) {
            const formattedValue = formatResolvedValue(resolvedValue);
            annotations.set(expression, formattedValue);
            if (parameterPath) {
                annotations.set(`${nodeName}::${parameterPath}`, formattedValue);
            }
        }
    }
    return annotations;
}
function formatResolvedValue(value) {
    if (value === undefined || value === '<EMPTY>') {
        return 'undefined';
    }
    if (value === null || value === '[null]') {
        return 'null';
    }
    if (typeof value === 'string') {
        const maxLen = 250;
        return value.length > maxLen ? `"${value.slice(0, maxLen)}..."` : `"${value}"`;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return `[Array with ${value.length} items]`;
    }
    return '[Object]';
}
//# sourceMappingURL=expression-annotator.js.map