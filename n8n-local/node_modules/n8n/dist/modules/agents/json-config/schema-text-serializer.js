"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonSchemaToCompactText = jsonSchemaToCompactText;
function jsonSchemaToCompactText(schema, indent = 0) {
    return serializeSchema(schema, '', false, indent).join('\n');
}
function pad(level) {
    return '  '.repeat(level);
}
function fieldPrefix(name, optional) {
    return `${name}${optional ? '?' : ''}: `;
}
function buildRangeLabel(min, max, unit = '') {
    const suffix = unit ? ` ${unit}` : '';
    if (min !== undefined && max !== undefined)
        return `${min}..${max}${suffix}`;
    if (min !== undefined)
        return `min ${min}${suffix}`;
    if (max !== undefined)
        return `max ${max}${suffix}`;
    return undefined;
}
function typeLabel(schema) {
    if (schema.enum)
        return schema.enum.map((v) => JSON.stringify(v)).join(' | ');
    if (schema.const !== undefined)
        return JSON.stringify(schema.const);
    const unionBranches = schema.anyOf ?? schema.oneOf;
    if (unionBranches) {
        return unionBranches
            .filter((b) => typeof b === 'object' && b !== null)
            .map((b) => typeLabel(b))
            .join(' | ');
    }
    const { type } = schema;
    if (type === 'string')
        return stringTypeLabel(schema);
    if (type === 'integer' || type === 'number')
        return numericTypeLabel(type, schema);
    if (type === 'boolean')
        return 'boolean';
    if (type === 'array')
        return arrayTypeLabel(schema);
    if (type === 'object')
        return objectTypeLabel(schema);
    return 'unknown';
}
function stringTypeLabel(schema) {
    const constraints = [];
    const rangeLabel = buildRangeLabel(schema.minLength, schema.maxLength, 'chars');
    if (rangeLabel)
        constraints.push(rangeLabel);
    if (schema.pattern)
        constraints.push(`pattern: ${schema.pattern}`);
    return constraints.length > 0 ? `string [${constraints.join(', ')}]` : 'string';
}
function numericTypeLabel(type, schema) {
    const rangeLabel = buildRangeLabel(schema.minimum, schema.maximum);
    return rangeLabel ? `${type} [${rangeLabel}]` : type;
}
function arrayTypeLabel(schema) {
    if (schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
        return `array of <${typeLabel(schema.items)}>`;
    }
    return 'array';
}
function objectTypeLabel(schema) {
    if (schema.properties) {
        const required = new Set(schema.required ?? []);
        const parts = Object.entries(schema.properties)
            .filter((entry) => typeof entry[1] === 'object' && entry[1] !== null)
            .map(([k, v]) => `${k}${required.has(k) ? '' : '?'}: ${typeLabel(v)}`);
        return `{ ${parts.join(', ')} }`;
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        return `Record<string, ${typeLabel(schema.additionalProperties)}>`;
    }
    return 'object';
}
function serializeSchema(schema, fieldName, optional, level) {
    const unionBranches = schema.anyOf ?? schema.oneOf;
    if (unionBranches?.length)
        return serializeUnion(schema, fieldName, optional, level);
    if (schema.type === 'object')
        return serializeObject(schema, fieldName, optional, level);
    if (schema.type === 'array' && hasUnionItems(schema)) {
        return serializeArrayUnion(schema, fieldName, optional, level);
    }
    return serializeLeaf(schema, fieldName, optional, level);
}
function serializeLeaf(schema, fieldName, optional, level) {
    if (!fieldName)
        return [];
    const requiredSuffix = optional ? '' : ' (required)';
    const defaultSuffix = schema.default !== undefined ? ` (default: ${JSON.stringify(schema.default)})` : '';
    const descriptionSuffix = schema.description ? ` — ${schema.description}` : '';
    return [
        `${pad(level)}${fieldPrefix(fieldName, optional)}${typeLabel(schema)}${requiredSuffix}${defaultSuffix}${descriptionSuffix}`,
    ];
}
function serializeObject(schema, fieldName, optional, level) {
    const requiredSuffix = optional ? '' : ' (required)';
    if (schema.properties) {
        const header = fieldName
            ? [`${pad(level)}${fieldPrefix(fieldName, optional)}object${requiredSuffix}`]
            : [];
        const required = new Set(schema.required ?? []);
        const propertyLines = Object.entries(schema.properties).flatMap(([propName, propSchema]) => {
            if (typeof propSchema !== 'object' || propSchema === null)
                return [];
            return serializeSchema(propSchema, propName, !required.has(propName), level + 1);
        });
        const catchAll = schema.additionalProperties && typeof schema.additionalProperties === 'object'
            ? [`${pad(level + 1)}[key: string]: ${typeLabel(schema.additionalProperties)}`]
            : [];
        return [...header, ...propertyLines, ...catchAll];
    }
    if (schema.additionalProperties) {
        const valType = typeof schema.additionalProperties === 'object' && schema.additionalProperties !== null
            ? typeLabel(schema.additionalProperties)
            : 'unknown';
        return [
            `${pad(level)}${fieldPrefix(fieldName, optional)}Record<string, ${valType}>${requiredSuffix}`,
        ];
    }
    return [];
}
function serializeUnion(schema, fieldName, optional, level) {
    if (!fieldName)
        return [];
    const branches = (schema.anyOf ?? schema.oneOf ?? []).filter((b) => typeof b === 'object' && b !== null);
    if (!isObjectUnion(branches))
        return serializeLeaf(schema, fieldName, optional, level);
    const objectBranches = branches;
    const discriminator = detectDiscriminator(objectBranches);
    const requiredSuffix = optional ? '' : ' (required)';
    const defaultSuffix = schema.default !== undefined ? ` (default: ${JSON.stringify(schema.default)})` : '';
    const descriptionSuffix = schema.description ? ` — ${schema.description}` : '';
    const header = `${pad(level)}${fieldPrefix(fieldName, optional)}one of <discriminated by "${discriminator ?? 'type'}">${requiredSuffix}${defaultSuffix}${descriptionSuffix}`;
    const branchLines = objectBranches.map((branch) => {
        const constProp = discriminator ? getConstValue(branch.properties?.[discriminator]) : undefined;
        const branchLabel = constProp !== undefined ? `${discriminator} = ${JSON.stringify(constProp)}` : '?';
        const fields = serializeBranchFields(branch);
        return `${pad(level)}  | ${branchLabel}: { ${fields.join(', ')} }`;
    });
    return [header, ...branchLines];
}
function isObjectUnion(branches) {
    return (branches.length > 0 &&
        branches.every((branch) => branch.type === 'object' ||
            branch.properties !== undefined ||
            branch.additionalProperties !== undefined));
}
function serializeArrayUnion(schema, fieldName, optional, level) {
    if (!fieldName)
        return [];
    const items = schema.items;
    const branches = (items.anyOf ?? items.oneOf ?? []).filter((b) => typeof b === 'object' && b !== null);
    const discriminator = detectDiscriminator(branches);
    const requiredSuffix = optional ? '' : ' (required)';
    const defaultSuffix = schema.default !== undefined ? ` (default: ${JSON.stringify(schema.default)})` : '';
    const header = `${pad(level)}${fieldPrefix(fieldName, optional)}array with items any of:${requiredSuffix}${defaultSuffix}`;
    const branchLines = branches.flatMap((branch) => serializeArrayUnionBranch(branch, discriminator, level));
    return [header, ...branchLines];
}
function serializeArrayUnionBranch(branch, discriminator, level) {
    if (!branch.properties) {
        return [`${pad(level)}  | ${typeLabel(branch)}`];
    }
    const constProp = discriminator ? getConstValue(branch.properties[discriminator]) : undefined;
    const branchLabel = constProp !== undefined ? `${discriminator} = ${JSON.stringify(constProp)}` : '?';
    const required = new Set(branch.required ?? []);
    const fieldLines = Object.entries(branch.properties).flatMap(([propName, propSchema]) => {
        if (typeof propSchema !== 'object' || propSchema === null)
            return [];
        if (propName === discriminator)
            return [];
        return serializeSchema(propSchema, propName, !required.has(propName), level + 2);
    });
    return [`${pad(level)}  | (${branchLabel})`, ...fieldLines];
}
function hasUnionItems(schema) {
    const { items } = schema;
    if (!items || typeof items !== 'object' || Array.isArray(items))
        return false;
    return !!(items.anyOf?.length ?? items.oneOf?.length);
}
function detectDiscriminator(branches) {
    const [first] = branches;
    const { properties } = first ?? {};
    if (!properties)
        return undefined;
    return Object.keys(properties).find((propName) => {
        if (getConstValue(properties[propName]) === undefined)
            return false;
        return branches.every((b) => b.properties && getConstValue(b.properties[propName]) !== undefined);
    });
}
function getConstValue(schema) {
    if (typeof schema !== 'object' || schema === null)
        return undefined;
    if (schema.const !== undefined)
        return schema.const;
    if (schema.enum && schema.enum.length === 1)
        return schema.enum[0];
    return undefined;
}
function serializeBranchFields(schema) {
    if (!schema.properties)
        return [];
    const required = new Set(schema.required ?? []);
    return Object.entries(schema.properties)
        .filter((entry) => typeof entry[1] === 'object' && entry[1] !== null)
        .map(([propName, propSchema]) => `${propName}${required.has(propName) ? '' : '?'}: ${typeLabel(propSchema)}`);
}
//# sourceMappingURL=schema-text-serializer.js.map