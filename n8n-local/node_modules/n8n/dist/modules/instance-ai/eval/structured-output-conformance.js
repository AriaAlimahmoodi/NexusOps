"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverStructuredOutputSchema = discoverStructuredOutputSchema;
exports.conformContentToSchema = conformContentToSchema;
exports.applyStructuredOutputConformance = applyStructuredOutputConformance;
const is_record_1 = require("@n8n/utils/is-record");
function looksLikeJsonSchema(value) {
    return ((0, is_record_1.isRecord)(value) &&
        ('properties' in value || 'additionalProperties' in value || value.type === 'object'));
}
function contentToText(content) {
    if (typeof content === 'string')
        return content;
    if (Array.isArray(content)) {
        return content
            .map((part) => typeof part === 'string'
            ? part
            : (0, is_record_1.isRecord)(part) && typeof part.text === 'string'
                ? part.text
                : '')
            .join('\n');
    }
    return '';
}
const FENCED_JSON = /```(?:json)?\s*([\s\S]*?)```/gi;
function discoverStructuredOutputSchema(body) {
    if (!(0, is_record_1.isRecord)(body))
        return undefined;
    const text = body.text;
    if ((0, is_record_1.isRecord)(text) && (0, is_record_1.isRecord)(text.format) && looksLikeJsonSchema(text.format.schema)) {
        return text.format.schema;
    }
    const responseFormat = body.response_format;
    if ((0, is_record_1.isRecord)(responseFormat) &&
        (0, is_record_1.isRecord)(responseFormat.json_schema) &&
        looksLikeJsonSchema(responseFormat.json_schema.schema)) {
        return responseFormat.json_schema.schema;
    }
    const items = Array.isArray(body.input)
        ? body.input
        : Array.isArray(body.messages)
            ? body.messages
            : [];
    let found;
    for (const item of items) {
        if (!(0, is_record_1.isRecord)(item))
            continue;
        const itemText = contentToText(item.content);
        if (!itemText.includes('```'))
            continue;
        FENCED_JSON.lastIndex = 0;
        let match;
        while ((match = FENCED_JSON.exec(itemText)) !== null) {
            try {
                const parsed = JSON.parse(match[1].trim());
                if (looksLikeJsonSchema(parsed))
                    found = parsed;
            }
            catch {
            }
        }
    }
    return found;
}
function schemaProperties(schema) {
    return (0, is_record_1.isRecord)(schema) && (0, is_record_1.isRecord)(schema.properties) ? schema.properties : undefined;
}
function isStrictObject(schema) {
    return (0, is_record_1.isRecord)(schema) && schema.additionalProperties === false;
}
function pruneToSchema(value, schema) {
    if ((0, is_record_1.isRecord)(value)) {
        const props = schemaProperties(schema);
        if (!props)
            return value;
        const strict = isStrictObject(schema);
        const out = {};
        for (const [key, val] of Object.entries(value)) {
            const declared = key in props;
            if (strict && !declared)
                continue;
            out[key] = declared ? pruneToSchema(val, props[key]) : val;
        }
        return out;
    }
    if (Array.isArray(value) && (0, is_record_1.isRecord)(schema) && schema.type === 'array') {
        return value.map((element) => pruneToSchema(element, schema.items));
    }
    return value;
}
function conformContentToSchema(content, schema) {
    if (!schema)
        return content;
    const fenced = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(content.trim());
    const jsonText = fenced ? fenced[1].trim() : content.trim();
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    }
    catch {
        return content;
    }
    if ((0, is_record_1.isRecord)(parsed) && isStrictObject(schema)) {
        const keys = Object.keys(parsed);
        const props = schemaProperties(schema) ?? {};
        const soleKey = keys[0];
        if (keys.length === 1 && !(soleKey in props) && (0, is_record_1.isRecord)(parsed[soleKey])) {
            parsed = parsed[soleKey];
        }
    }
    const conformed = pruneToSchema(parsed, schema);
    const serialized = JSON.stringify(conformed);
    return fenced ? `\`\`\`json\n${serialized}\n\`\`\`` : serialized;
}
function applyStructuredOutputConformance(content, body) {
    return conformContentToSchema(content, discoverStructuredOutputSchema(body));
}
//# sourceMappingURL=structured-output-conformance.js.map