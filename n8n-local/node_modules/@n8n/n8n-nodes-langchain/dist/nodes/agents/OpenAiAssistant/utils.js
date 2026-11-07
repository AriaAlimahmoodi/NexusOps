"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatToOpenAIFunction = formatToOpenAIFunction;
exports.formatToOpenAITool = formatToOpenAITool;
exports.formatToOpenAIAssistantTool = formatToOpenAIAssistantTool;
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
//# sourceMappingURL=utils.js.map