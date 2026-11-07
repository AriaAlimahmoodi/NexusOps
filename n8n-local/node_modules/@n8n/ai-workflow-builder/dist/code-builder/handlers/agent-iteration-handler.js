"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentIterationHandler = void 0;
const helpers_1 = require("../../utils/cache-control/helpers");
const content_extractors_1 = require("../utils/content-extractors");
function hasUsageMetadata(metadata) {
    return (typeof metadata === 'object' &&
        metadata !== null &&
        'usage' in metadata &&
        typeof metadata.usage === 'object');
}
class AgentIterationHandler {
    onTokenUsage;
    callbacks;
    runMetadata;
    constructor(config = {}) {
        this.onTokenUsage = config.onTokenUsage;
        this.callbacks = config.callbacks;
        this.runMetadata = config.runMetadata;
    }
    getCallbacks() {
        return this.callbacks;
    }
    getRunMetadata() {
        return this.runMetadata;
    }
    async *invokeLlm(params) {
        const { llmWithTools, messages, abortSignal, callbacks: iterationCallbacks } = params;
        if (abortSignal?.aborted) {
            throw new Error('Aborted');
        }
        (0, helpers_1.applySubgraphCacheMarkers)(messages);
        const llmStartTime = Date.now();
        const response = await llmWithTools.invoke(messages, {
            signal: abortSignal,
            callbacks: iterationCallbacks ?? this.callbacks,
            metadata: this.runMetadata,
        });
        const llmDurationMs = Date.now() - llmStartTime;
        const responseMetadata = response.response_metadata;
        const inputTokens = hasUsageMetadata(responseMetadata)
            ? (responseMetadata.usage.input_tokens ?? 0)
            : 0;
        const outputTokens = hasUsageMetadata(responseMetadata)
            ? (responseMetadata.usage.output_tokens ?? 0)
            : 0;
        const thinkingTokens = hasUsageMetadata(responseMetadata)
            ? (responseMetadata.usage.thinking_tokens ?? 0)
            : 0;
        if (this.onTokenUsage && (inputTokens > 0 || outputTokens > 0)) {
            this.onTokenUsage({ inputTokens, outputTokens, thinkingTokens });
        }
        const thinkingContent = (0, content_extractors_1.extractThinkingContent)(response);
        const textContent = (0, content_extractors_1.extractTextContent)(response);
        if (textContent) {
            const messageChunk = {
                role: 'assistant',
                type: 'message',
                text: textContent,
            };
            yield {
                messages: [messageChunk],
            };
        }
        messages.push(response);
        return {
            response,
            inputTokens,
            outputTokens,
            llmDurationMs,
            textContent,
            thinkingContent,
            hasToolCalls: !!(response.tool_calls && response.tool_calls.length > 0),
        };
    }
}
exports.AgentIterationHandler = AgentIterationHandler;
//# sourceMappingURL=agent-iteration-handler.js.map