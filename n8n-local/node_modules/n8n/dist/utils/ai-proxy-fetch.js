"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_REQUEST_TIMEOUT_MS = void 0;
exports.createAiProxyFetch = createAiProxyFetch;
exports.createAiMcpFetch = createAiMcpFetch;
exports.createWebSearchFetch = createWebSearchFetch;
const constants_1 = require("@n8n/constants");
const DEFAULT_AI_REQUEST_TIMEOUT_MS = constants_1.Time.hours.toMilliseconds;
exports.AI_REQUEST_TIMEOUT_MS = resolveTimeoutMs(process.env.N8N_AI_TIMEOUT_MAX);
function resolveTimeoutMs(raw) {
    if (raw === undefined) {
        return DEFAULT_AI_REQUEST_TIMEOUT_MS;
    }
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_AI_REQUEST_TIMEOUT_MS;
}
function createAiProxyFetch(outboundHttp) {
    return outboundHttp
        .transport({
        proxy: 'env',
        timeouts: {
            headersTimeout: exports.AI_REQUEST_TIMEOUT_MS,
            bodyTimeout: exports.AI_REQUEST_TIMEOUT_MS,
        },
    })
        .asCustomFetch();
}
function createAiMcpFetch(outboundHttp) {
    return outboundHttp
        .transport({
        proxy: 'env',
        timeouts: {
            headersTimeout: exports.AI_REQUEST_TIMEOUT_MS,
            bodyTimeout: exports.AI_REQUEST_TIMEOUT_MS,
        },
    })
        .asCustomFetch();
}
function createWebSearchFetch(outboundHttp) {
    return outboundHttp
        .transport({
        proxy: 'env',
    })
        .asCustomFetch();
}
//# sourceMappingURL=ai-proxy-fetch.js.map