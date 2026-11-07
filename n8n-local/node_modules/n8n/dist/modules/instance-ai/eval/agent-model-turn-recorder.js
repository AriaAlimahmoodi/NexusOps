"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentModelTurnRecorder = createAgentModelTurnRecorder;
const mock_utils_1 = require("./mock-utils");
const request_sanitizer_1 = require("./request-sanitizer");
const MAX_RECORDED_REQUEST_CHARS = 8_000;
const MAX_RECORDED_RESPONSE_CHARS = 16_000;
function providerFromUrl(url) {
    try {
        const host = new URL(url).hostname;
        if (host.endsWith('openai.com'))
            return 'openai';
        if (host.endsWith('anthropic.com'))
            return 'anthropic';
        if (host.endsWith('googleapis.com'))
            return 'google';
        if (host.endsWith('openai.azure.com'))
            return 'azure-openai';
        return host;
    }
    catch {
        return undefined;
    }
}
function tryParseJson(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return undefined;
    }
}
function recordableText(text, maxChars) {
    const parsed = tryParseJson(text);
    const serialized = parsed === undefined ? text : JSON.stringify((0, request_sanitizer_1.redactSecretKeys)(parsed));
    return (0, request_sanitizer_1.truncateForLlm)((0, request_sanitizer_1.redactSecretValuePatterns)(serialized), maxChars);
}
function recordableRequestBody(body) {
    if (typeof body !== 'string') {
        return body === undefined || body === null ? undefined : '[non-string request body]';
    }
    const parsed = tryParseJson(body);
    if (parsed === undefined)
        return (0, request_sanitizer_1.truncateForLlm)((0, request_sanitizer_1.redactSecretValuePatterns)(body), MAX_RECORDED_REQUEST_CHARS);
    const serialized = (0, request_sanitizer_1.redactSecretValuePatterns)(JSON.stringify((0, request_sanitizer_1.redactSecretKeys)(parsed)));
    if (serialized.length <= MAX_RECORDED_REQUEST_CHARS) {
        return tryParseJson(serialized) ?? serialized;
    }
    return (0, request_sanitizer_1.truncateForLlm)(serialized, MAX_RECORDED_REQUEST_CHARS);
}
function stripQuery(url) {
    const queryStart = url.indexOf('?');
    return queryStart === -1 ? url : `${url.slice(0, queryStart)}?[query redacted]`;
}
function createAgentModelTurnRecorder(baseFetch, logger) {
    const turns = [];
    const pendingReads = [];
    const recordingFetch = async (input, init) => {
        const url = (0, mock_utils_1.resolveUrl)(input);
        const turn = {
            url: stripQuery(url),
            provider: providerFromUrl(url),
            streamed: false,
            requestBody: recordableRequestBody(init?.body),
        };
        turns.push(turn);
        const startedAt = Date.now();
        let response;
        try {
            response = await baseFetch(input, init);
        }
        catch (error) {
            turn.durationMs = Date.now() - startedAt;
            turn.error = error instanceof Error ? error.message : String(error);
            throw error;
        }
        turn.durationMs = Date.now() - startedAt;
        turn.status = response.status;
        turn.streamed = (response.headers.get('content-type') ?? '').includes('text/event-stream');
        try {
            const teed = response.clone();
            pendingReads.push(teed
                .text()
                .then((text) => {
                turn.responseBody = recordableText(text, MAX_RECORDED_RESPONSE_CHARS);
            })
                .catch((error) => {
                logger.debug('[EvalAgentMock] Model turn tee failed', {
                    url: stripQuery(url),
                    error: error instanceof Error ? error.message : String(error),
                });
            }));
        }
        catch (error) {
            logger.debug('[EvalAgentMock] Model response clone failed', {
                url: stripQuery(url),
                error: error instanceof Error ? error.message : String(error),
            });
        }
        return response;
    };
    return {
        fetch: recordingFetch,
        turns,
        async flush() {
            await Promise.allSettled(pendingReads);
        },
    };
}
//# sourceMappingURL=agent-model-turn-recorder.js.map