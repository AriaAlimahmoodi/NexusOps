"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processLlmResponse = processLlmResponse;
const content_extractors_1 = require("./content-extractors");
function hasUsageMetadata(metadata) {
    return (typeof metadata === 'object' &&
        metadata !== null &&
        'usage' in metadata &&
        typeof metadata.usage === 'object');
}
function processLlmResponse(response) {
    const responseMetadata = response.response_metadata;
    const inputTokens = hasUsageMetadata(responseMetadata)
        ? (responseMetadata.usage.input_tokens ?? 0)
        : 0;
    const outputTokens = hasUsageMetadata(responseMetadata)
        ? (responseMetadata.usage.output_tokens ?? 0)
        : 0;
    const thinkingContent = (0, content_extractors_1.extractThinkingContent)(response);
    const textContent = (0, content_extractors_1.extractTextContent)(response);
    const rawToolCalls = response.tool_calls ?? [];
    const toolCalls = rawToolCalls
        .filter((tc) => tc.id !== undefined)
        .map((tc) => ({
        id: tc.id,
        name: tc.name,
        args: tc.args,
    }));
    return {
        inputTokens,
        outputTokens,
        thinkingContent,
        textContent,
        hasToolCalls: toolCalls.length > 0,
        toolCalls,
    };
}
//# sourceMappingURL=llm-response-processor.js.map