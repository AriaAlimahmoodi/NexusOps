"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseTranslateOpenAiResponsesRequest = reverseTranslateOpenAiResponsesRequest;
exports.extractResponsesRequestModel = extractResponsesRequestModel;
exports.isResponsesStreamRequested = isResponsesStreamRequested;
exports.forwardTranslateToResponsesEnvelope = forwardTranslateToResponsesEnvelope;
exports.forwardTranslateToResponsesSseEvents = forwardTranslateToResponsesSseEvents;
exports.isOpenAiResponsesUrl = isOpenAiResponsesUrl;
exports.normalizeOpenAiResponsesMockResponse = normalizeOpenAiResponsesMockResponse;
exports.buildResponsesErrorEnvelope = buildResponsesErrorEnvelope;
const is_record_1 = require("@n8n/utils/is-record");
const node_crypto_1 = require("node:crypto");
const openai_envelope_1 = require("./openai-envelope");
const OPENAI_RESPONSES_SYNTHETIC_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-4o-mini';
function reverseTranslateOpenAiResponsesRequest(body) {
    return {
        url: OPENAI_RESPONSES_SYNTHETIC_URL,
        method: 'POST',
        body: body ?? {},
    };
}
function extractResponsesRequestModel(body) {
    if (typeof body !== 'object' || body === null)
        return DEFAULT_MODEL;
    const model = body.model;
    return typeof model === 'string' && model.length > 0 ? model : DEFAULT_MODEL;
}
function isResponsesStreamRequested(body) {
    if (typeof body !== 'object' || body === null)
        return false;
    return body.stream === true;
}
function forwardTranslateToResponsesEnvelope(mockResponse, model) {
    const toolCalls = (0, openai_envelope_1.extractToolCalls)(mockResponse?.body);
    const responseId = `resp_${(0, node_crypto_1.randomUUID)().replace(/-/g, '').slice(0, 32)}`;
    const now = Math.floor(Date.now() / 1000);
    const output = toolCalls.length > 0
        ? toolCallsToResponsesOutput(toolCalls)
        : [buildAssistantMessage(extractResponsesContent(mockResponse?.body))];
    return {
        id: responseId,
        object: 'response',
        created_at: now,
        status: 'completed',
        model,
        output,
        usage: {
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
        },
    };
}
function forwardTranslateToResponsesSseEvents(mockResponse, model) {
    const responseId = `resp_${(0, node_crypto_1.randomUUID)().replace(/-/g, '').slice(0, 32)}`;
    const createdAt = Math.floor(Date.now() / 1000);
    const toolCalls = (0, openai_envelope_1.extractToolCalls)(mockResponse?.body);
    const baseResponse = (status, output) => ({
        id: responseId,
        object: 'response',
        created_at: createdAt,
        status,
        model,
        output,
        usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    });
    const events = [];
    events.push({ event: 'response.created', data: { response: baseResponse('in_progress', []) } });
    events.push({
        event: 'response.in_progress',
        data: { response: baseResponse('in_progress', []) },
    });
    if (toolCalls.length > 0) {
        const finalItems = toolCallsToResponsesOutput(toolCalls);
        toolCalls.forEach((tc, callIndex) => {
            const finalItem = finalItems[callIndex];
            const itemId = finalItem.id;
            const initialItem = { ...finalItem, arguments: '' };
            events.push({
                event: 'response.output_item.added',
                data: { output_index: callIndex, item: initialItem },
            });
            if (tc.arguments.length > 0) {
                events.push({
                    event: 'response.function_call_arguments.delta',
                    data: {
                        item_id: itemId,
                        output_index: callIndex,
                        delta: tc.arguments,
                    },
                });
            }
            events.push({
                event: 'response.function_call_arguments.done',
                data: {
                    item_id: itemId,
                    output_index: callIndex,
                    arguments: tc.arguments,
                },
            });
            events.push({
                event: 'response.output_item.done',
                data: { output_index: callIndex, item: finalItem },
            });
        });
        events.push({
            event: 'response.completed',
            data: { response: baseResponse('completed', finalItems) },
        });
        return events;
    }
    const content = extractResponsesContent(mockResponse?.body);
    const messageId = `msg_${(0, node_crypto_1.randomUUID)().replace(/-/g, '').slice(0, 16)}`;
    const messageItem = {
        id: messageId,
        type: 'message',
        role: 'assistant',
        content: [{ type: 'output_text', text: content, annotations: [] }],
        status: 'completed',
    };
    events.push({
        event: 'response.output_item.added',
        data: {
            output_index: 0,
            item: {
                ...messageItem,
                content: [{ type: 'output_text', text: '', annotations: [] }],
                status: 'in_progress',
            },
        },
    });
    events.push({
        event: 'response.content_part.added',
        data: {
            item_id: messageId,
            output_index: 0,
            content_index: 0,
            part: { type: 'output_text', text: '', annotations: [] },
        },
    });
    if (content.length > 0) {
        events.push({
            event: 'response.output_text.delta',
            data: {
                item_id: messageId,
                output_index: 0,
                content_index: 0,
                delta: content,
            },
        });
    }
    events.push({
        event: 'response.output_text.done',
        data: {
            item_id: messageId,
            output_index: 0,
            content_index: 0,
            text: content,
        },
    });
    events.push({
        event: 'response.content_part.done',
        data: {
            item_id: messageId,
            output_index: 0,
            content_index: 0,
            part: { type: 'output_text', text: content, annotations: [] },
        },
    });
    events.push({
        event: 'response.output_item.done',
        data: { output_index: 0, item: messageItem },
    });
    events.push({
        event: 'response.completed',
        data: { response: baseResponse('completed', [messageItem]) },
    });
    return events;
}
function isOpenAiResponsesUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.hostname === 'api.openai.com' && /^\/v\d+\/responses\/?$/.test(parsed.pathname);
    }
    catch {
        return false;
    }
}
function normalizeContentPart(part) {
    if (typeof part === 'string')
        return { type: 'output_text', text: part, annotations: [] };
    if (!(0, is_record_1.isRecord)(part))
        return undefined;
    const text = typeof part.text === 'string'
        ? part.text
        : (0, is_record_1.isRecord)(part.text) || Array.isArray(part.text)
            ? JSON.stringify(part.text)
            : undefined;
    if (text === undefined)
        return undefined;
    return {
        ...part,
        type: 'output_text',
        text,
        annotations: Array.isArray(part.annotations) ? part.annotations : [],
    };
}
function normalizeOutputItem(item, index) {
    if (!(0, is_record_1.isRecord)(item))
        return undefined;
    if (item.type === 'function_call') {
        if (typeof item.name !== 'string' || typeof item.arguments !== 'string')
            return undefined;
        return {
            ...item,
            id: typeof item.id === 'string' ? item.id : `fc_norm_${String(index)}`,
            call_id: typeof item.call_id === 'string' ? item.call_id : `call_norm_${String(index)}`,
        };
    }
    const content = item.content;
    if (Array.isArray(content)) {
        const parts = content
            .map(normalizeContentPart)
            .filter((part) => part !== undefined);
        if (parts.length === 0)
            return undefined;
        return {
            id: typeof item.id === 'string' ? item.id : `msg_norm_${String(index)}`,
            type: 'message',
            role: 'assistant',
            status: 'completed',
            content: parts,
        };
    }
    if (typeof item.type === 'string')
        return { ...item };
    return undefined;
}
function normalizeOpenAiResponsesMockResponse(mockResponse, model) {
    const body = mockResponse.body;
    if ((0, is_record_1.isRecord)(body) &&
        ('_evalMockError' in body || (body.error !== null && body.error !== undefined))) {
        return mockResponse;
    }
    if ((0, is_record_1.isRecord)(body) && Array.isArray(body.output)) {
        const output = body.output
            .map(normalizeOutputItem)
            .filter((item) => item !== undefined);
        if (output.length > 0) {
            return {
                ...mockResponse,
                body: {
                    ...body,
                    id: typeof body.id === 'string'
                        ? body.id
                        : `resp_${(0, node_crypto_1.randomUUID)().replace(/-/g, '').slice(0, 32)}`,
                    object: 'response',
                    status: 'completed',
                    model: typeof body.model === 'string' && body.model.length > 0 ? body.model : model,
                    created_at: typeof body.created_at === 'number' ? body.created_at : Math.floor(Date.now() / 1000),
                    output,
                    usage: (0, is_record_1.isRecord)(body.usage)
                        ? body.usage
                        : { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
                },
            };
        }
    }
    return { ...mockResponse, body: forwardTranslateToResponsesEnvelope(mockResponse, model) };
}
function buildResponsesErrorEnvelope(message) {
    return {
        error: {
            message,
            type: 'eval_wire_server_error',
            code: 'eval_mock_generation_failed',
            param: null,
        },
    };
}
function toolCallsToResponsesOutput(toolCalls) {
    return toolCalls.map((tc) => ({
        id: `fc_${(0, node_crypto_1.randomUUID)().replace(/-/g, '').slice(0, 16)}`,
        type: 'function_call',
        call_id: tc.id,
        name: tc.name,
        arguments: tc.arguments,
    }));
}
function buildAssistantMessage(text) {
    return {
        id: `msg_${(0, node_crypto_1.randomUUID)().replace(/-/g, '').slice(0, 16)}`,
        type: 'message',
        role: 'assistant',
        status: 'completed',
        content: [{ type: 'output_text', text, annotations: [] }],
    };
}
function extractResponsesContent(body) {
    if (body === null || body === undefined)
        return '';
    if (typeof body === 'string')
        return body;
    if (typeof body !== 'object')
        return String(body);
    const obj = body;
    if (typeof obj.output_text === 'string')
        return obj.output_text;
    if ((0, is_record_1.isRecord)(obj.output_text) || Array.isArray(obj.output_text)) {
        return JSON.stringify(obj.output_text);
    }
    const output = obj.output;
    if (Array.isArray(output) && output.length > 0) {
        for (const item of output) {
            if (typeof item !== 'object' || item === null)
                continue;
            const content = item.content;
            if (!Array.isArray(content) || content.length === 0)
                continue;
            const first = content[0];
            if (typeof first === 'object' && first !== null) {
                const text = first.text;
                if (typeof text === 'string')
                    return text;
                if ((0, is_record_1.isRecord)(text) || Array.isArray(text))
                    return JSON.stringify(text);
            }
        }
    }
    if (typeof obj.content === 'string')
        return obj.content;
    if (typeof obj.message === 'string')
        return obj.message;
    return JSON.stringify(body);
}
//# sourceMappingURL=openai-responses-envelope.js.map