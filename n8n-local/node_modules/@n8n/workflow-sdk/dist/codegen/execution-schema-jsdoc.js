"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaToOutputSample = schemaToOutputSample;
exports.generateSchemaJSDoc = generateSchemaJSDoc;
function schemaToOutputSample(schema, excludeValues) {
    if (schema.type !== 'object' || !Array.isArray(schema.value)) {
        return null;
    }
    const shouldRedact = excludeValues !== false;
    const sample = {};
    for (const field of schema.value) {
        if (!field.key)
            continue;
        if (field.type === 'object' && Array.isArray(field.value)) {
            const nestedSample = schemaToOutputSample(field, excludeValues);
            sample[field.key] = nestedSample ?? {};
        }
        else if (field.type === 'array' && Array.isArray(field.value)) {
            sample[field.key] = [];
        }
        else if (shouldRedact) {
            sample[field.key] = getDefaultForType(field.type);
        }
        else {
            sample[field.key] = parseSchemaValue(field);
        }
    }
    return sample;
}
const MAX_OUTPUT_VALUE_LENGTH = 200;
function parseSchemaValue(field) {
    const value = typeof field.value === 'string' ? field.value : undefined;
    if (value === undefined)
        return null;
    if (value === '[null]')
        return null;
    if (value === '<EMPTY>')
        return undefined;
    switch (field.type) {
        case 'string': {
            if (value.length > MAX_OUTPUT_VALUE_LENGTH) {
                return value.slice(0, MAX_OUTPUT_VALUE_LENGTH) + '... [truncated]';
            }
            return value;
        }
        case 'number': {
            const num = Number(value);
            return Number.isNaN(num) ? 0 : num;
        }
        case 'boolean':
            return value === 'true';
        case 'null':
            return null;
        default:
            return null;
    }
}
function getDefaultForType(type) {
    switch (type) {
        case 'string':
            return '';
        case 'number':
            return 0;
        case 'boolean':
            return false;
        case 'object':
            return {};
        case 'array':
            return [];
        case 'null':
            return null;
        default:
            return null;
    }
}
function generateSchemaJSDoc(nodeName, schema) {
    const lines = [];
    lines.push(`@output - access via $('${nodeName}').item.json`);
    if (schema.type === 'object' && Array.isArray(schema.value)) {
        for (const field of schema.value) {
            const tsType = schemaTypeToTs(field.type);
            const example = typeof field.value === 'string' ? `  // @example ${formatSampleValue(field.value)}` : '';
            lines.push(`  ${field.key}: ${tsType}${example}`);
        }
    }
    return lines.join('\n');
}
function schemaTypeToTs(type) {
    const typeMap = {
        string: 'string',
        number: 'number',
        boolean: 'boolean',
        object: 'Record<string, unknown>',
        array: 'unknown[]',
        null: 'null',
        undefined: 'undefined',
    };
    return typeMap[type] ?? 'unknown';
}
function formatSampleValue(value) {
    if (value === '[null]')
        return 'null';
    if (value === '<EMPTY>')
        return 'undefined';
    const maxLen = 40;
    const escaped = value.replace(/\n/g, '\\n');
    return escaped.length > maxLen ? `"${escaped.slice(0, maxLen)}..."` : `"${escaped}"`;
}
//# sourceMappingURL=execution-schema-jsdoc.js.map