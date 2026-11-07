"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxyLanguageModel = createProxyLanguageModel;
const api_types_1 = require("@n8n/api-types");
const ai_proxy_fetch_1 = require("../utils/ai-proxy-fetch");
const ANTHROPIC_PROXY_PATH = '/anthropic/v1';
const KIMI_PROXY_PATH = '/kimi/v1';
async function createProxyLanguageModel(options) {
    const proxyBaseUrl = options.proxyBaseUrl.replace(/\/$/, '');
    const proxyHeaders = (0, api_types_1.buildProxyHeaders)({
        feature: options.feature,
        n8nVersion: options.n8nVersion,
        runId: options.runId,
        threadId: options.threadId,
    });
    const modelFetch = (0, ai_proxy_fetch_1.createAiProxyFetch)(options.outboundHttp);
    const fetch = async (input, init) => {
        const headers = new Headers(init?.headers);
        const auth = await options.tokenManager.getAuthHeaders();
        for (const [k, v] of Object.entries(auth)) {
            headers.set(k, v);
        }
        for (const [k, v] of Object.entries(proxyHeaders)) {
            headers.set(k, v);
        }
        return await modelFetch(input, { ...init, headers });
    };
    if ((0, api_types_1.isMoonshotaiKimiK3ModelId)(options.modelId)) {
        const openaiCompatible = await import('@ai-sdk/openai-compatible');
        return openaiCompatible.createOpenAICompatible({
            name: api_types_1.MOONSHOTAI_KIMI_K3_PROVIDER,
            baseURL: proxyBaseUrl + KIMI_PROXY_PATH,
            apiKey: 'proxy-managed',
            fetch,
            supportsStructuredOutputs: true,
            includeUsage: true,
        })(api_types_1.MOONSHOTAI_KIMI_K3_MODEL_NAME);
    }
    const { createAnthropic } = await import('@ai-sdk/anthropic');
    const slash = options.modelId.indexOf('/');
    const modelName = slash >= 0 ? options.modelId.slice(slash + 1) : options.modelId;
    return createAnthropic({
        baseURL: proxyBaseUrl + ANTHROPIC_PROXY_PATH,
        apiKey: 'proxy-managed',
        fetch,
    })(modelName);
}
//# sourceMappingURL=ai-proxy-language-model.js.map