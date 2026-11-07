"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseTranslateOpenAiRequest = reverseTranslateOpenAiRequest;
exports.extractRequestModel = extractRequestModel;
exports.isStreamRequested = isStreamRequested;
exports.forwardTranslateToChatCompletion = forwardTranslateToChatCompletion;
exports.forwardTranslateToSseChunks = forwardTranslateToSseChunks;
exports.buildOpenAiErrorEnvelope = buildOpenAiErrorEnvelope;
exports.extractToolCalls = extractToolCalls;
const node_crypto_1 = require("node:crypto");
const OPENAI_SYNTHETIC_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';
function reverseTranslateOpenAiRequest(body) {
    return {
        url: OPENAI_SYNTHETIC_URL,
        method: 'POST',
        body: body ?? {},
    };
}
function extractRequestModel(body) {
    if (typeof body !== 'object' || body === null)
        return DEFAULT_MODEL;
    const model = body.model;
    return typeof model === 'string' && model.length > 0 ? model : DEFAULT_MODEL;
}
function isStreamRequested(body) {
    if (typeof body !== 'object' || body === null)
        return false;
    return body.stream === true;
}
function forwardTranslateToChatCompletion(mockResponse, model) {
    const toolCalls = extractToolCalls(mockResponse?.body);
    const content = toolCalls.length > 0 ? null : extractAssistantContent(mockResponse?.body);
    const finishReason = toolCalls.length > 0 ? 'tool_calls' : extractFinishReason(mockResponse?.body);
    const message = {
        role: 'assistant',
        content,
    };
    if (toolCalls.length > 0) {
        message.tool_calls = toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: tc.arguments },
        }));
    }
    return {
        id: `chatcmpl-${(0, node_crypto_1.randomUUID)()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
            {
                index: 0,
                message,
                finish_reason: finishReason,
            },
        ],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        system_fingerprint: 'eval-wire-server',
    };
}
function forwardTranslateToSseChunks(mockResponse, model) {
    const id = `chatcmpl-${(0, node_crypto_1.randomUUID)()}`;
    const created = Math.floor(Date.now() / 1000);
    const toolCalls = extractToolCalls(mockResponse?.body);
    const chunks = [];
    const baseChunk = (delta, finishReason = null) => ({
        id,
        object: 'chat.completion.chunk',
        created,
        model,
        choices: [{ index: 0, delta, finish_reason: finishReason }],
        system_fingerprint: 'eval-wire-server',
    });
    chunks.push(baseChunk({ role: 'assistant', content: toolCalls.length > 0 ? null : '' }));
    if (toolCalls.length > 0) {
        toolCalls.forEach((tc, callIndex) => {
            chunks.push(baseChunk({
                tool_calls: [
                    {
                        index: callIndex,
                        id: tc.id,
                        type: 'function',
                        function: { name: tc.name, arguments: '' },
                    },
                ],
            }));
            if (tc.arguments.length > 0) {
                chunks.push(baseChunk({
                    tool_calls: [{ index: callIndex, function: { arguments: tc.arguments } }],
                }));
            }
        });
        chunks.push(baseChunk({}, 'tool_calls'));
        return chunks;
    }
    const content = extractAssistantContent(mockResponse?.body);
    if (content.length > 0) {
        chunks.push(baseChunk({ content }));
    }
    const finishReason = extractFinishReason(mockResponse?.body);
    chunks.push(baseChunk({}, finishReason));
    return chunks;
}
function buildOpenAiErrorEnvelope(message) {
    return {
        error: {
            message,
            type: 'eval_wire_server_error',
            param: null,
            code: 'eval_mock_generation_failed',
        },
    };
}
function extractToolCalls(body) {
    if (typeof body !== 'object' || body === null)
        return [];
    const obj = body;
    const fromChoices = pickToolCallsFromChoices(obj);
    if (fromChoices.length > 0)
        return fromChoices;
    const fromTopLevel = normalizeToolCallList(obj.tool_calls);
    if (fromTopLevel.length > 0)
        return fromTopLevel;
    if (typeof obj.tool === 'object' && obj.tool !== null) {
        const single = normalizeToolCallList([obj.tool]);
        if (single.length > 0)
            return single;
    }
    return [];
}
function pickToolCallsFromChoices(obj) {
    const choices = obj.choices;
    if (!Array.isArray(choices) || choices.length === 0)
        return [];
    const first = choices[0];
    if (typeof first !== 'object' || first === null)
        return [];
    const message = first.message;
    if (typeof message !== 'object' || message === null)
        return [];
    return normalizeToolCallList(message.tool_calls);
}
function normalizeToolCallList(raw) {
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const entry of raw) {
        if (typeof entry !== 'object' || entry === null)
            continue;
        const e = entry;
        const fn = (e.function ?? e);
        const name = typeof fn.name === 'string' ? fn.name : undefined;
        if (!name)
            continue;
        const args = coerceArgumentsToString(fn.arguments);
        const id = typeof e.id === 'string' ? e.id : `call_${(0, node_crypto_1.randomUUID)().replace(/-/g, '').slice(0, 16)}`;
        out.push({ id, name, arguments: args });
    }
    return out;
}
function coerceArgumentsToString(args) {
    if (typeof args === 'string')
        return args;
    if (args === undefined || args === null)
        return '{}';
    return JSON.stringify(args);
}
function extractAssistantContent(body) {
    if (body === null || body === undefined)
        return '';
    if (typeof body === 'string')
        return body;
    if (typeof body !== 'object')
        return String(body);
    const obj = body;
    const choices = obj.choices;
    if (Array.isArray(choices) && choices.length > 0) {
        const first = choices[0];
        if (typeof first === 'object' && first !== null) {
            const message = first.message;
            if (typeof message === 'object' && message !== null) {
                const inner = message.content;
                if (typeof inner === 'string')
                    return inner;
            }
        }
    }
    if (typeof obj.content === 'string')
        return obj.content;
    if (typeof obj.message === 'string')
        return obj.message;
    return JSON.stringify(body);
}
function extractFinishReason(body) {
    if (typeof body !== 'object' || body === null)
        return 'stop';
    const choices = body.choices;
    if (Array.isArray(choices) && choices.length > 0) {
        const first = choices[0];
        if (typeof first === 'object' && first !== null) {
            const reason = first.finish_reason;
            if (typeof reason === 'string' && reason.length > 0)
                return reason;
        }
    }
    return 'stop';
}
//# sourceMappingURL=openai-envelope.js.map