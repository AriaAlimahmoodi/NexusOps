"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatToOpenAIFunction = formatToOpenAIFunction;
exports.formatToOpenAITool = formatToOpenAITool;
exports.formatToOpenAIAssistantTool = formatToOpenAIAssistantTool;
exports.formatToOpenAIResponsesTool = formatToOpenAIResponsesTool;
exports.getChatMessages = getChatMessages;
const n8n_workflow_1 = require("n8n-workflow");
const zod_to_json_schema_1 = require("zod-to-json-schema");
function formatToOpenAIFunction(tool) {
    return {
        name: tool.name,
        description: tool.description,
        parameters: (0, zod_to_json_schema_1.zodToJsonSchema)(tool.schema),
    };
}
function formatToOpenAITool(tool) {
    const schema = (0, zod_to_json_schema_1.zodToJsonSchema)(tool.schema);
    return {
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: schema,
        },
    };
}
function formatToOpenAIAssistantTool(tool) {
    return {
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: (0, zod_to_json_schema_1.zodToJsonSchema)(tool.schema),
        },
    };
}
const requireStrict = (schema) => {
    if (!schema.required) {
        return false;
    }
    if (schema.properties) {
        const propertyNames = Object.keys(schema.properties);
        const somePropertyMissingFromRequired = propertyNames.some((propertyName) => !schema.required.includes(propertyName));
        const requireStrict = !somePropertyMissingFromRequired;
        return requireStrict;
    }
    return false;
};
function formatToOpenAIResponsesTool(tool) {
    const schema = (0, zod_to_json_schema_1.zodToJsonSchema)(tool.schema);
    const strict = requireStrict(schema);
    const isAdditionalPropertiesEmpty = schema.additionalProperties &&
        typeof schema.additionalProperties === 'object' &&
        (0, n8n_workflow_1.isObjectEmpty)(schema.additionalProperties);
    if (isAdditionalPropertiesEmpty && strict) {
        schema.additionalProperties = false;
    }
    return {
        type: 'function',
        name: tool.name,
        parameters: schema,
        strict,
        description: tool.description,
    };
}
async function getChatMessages(memory) {
    return (await memory.loadMemoryVariables({}))[memory.memoryKey];
}
//# sourceMappingURL=utils.js.map