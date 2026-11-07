"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLM_PROVIDER_PRIORITY = exports.LLM_PROVIDER_DEFAULTS = void 0;
exports.LLM_PROVIDER_DEFAULTS = {
    anthropicApi: {
        provider: 'anthropic',
        defaultModel: 'claude-sonnet-5',
    },
    openAiApi: {
        provider: 'openai',
        defaultModel: 'gpt-5.6-terra',
    },
    googlePalmApi: {
        provider: 'google',
        defaultModel: 'gemini-3.7-flash',
    },
    xAiApi: {
        provider: 'xai',
        defaultModel: 'grok-4.6',
    },
    groqApi: {
        provider: 'groq',
        defaultModel: 'openai/gpt-oss-120b',
    },
    mistralCloudApi: {
        provider: 'mistral',
        defaultModel: 'mistral-large-latest',
    },
    deepSeekApi: {
        provider: 'deepseek',
        defaultModel: 'deepseek-chat',
    },
    cohereApi: {
        provider: 'cohere',
        defaultModel: 'command-a-plus-05-2026',
    },
    openRouterApi: {
        provider: 'openrouter',
        defaultModel: 'anthropic/claude-sonnet-5',
    },
    nvidiaApi: {
        provider: 'nvidia',
        defaultModel: 'nvidia/llama-3.3-nemotron-super-49b-v1',
    },
    vercelAiGatewayApi: {
        provider: 'vercel',
        defaultModel: 'anthropic/claude-sonnet-5',
    },
    moonshotApi: {
        provider: 'moonshotai',
        defaultModel: 'kimi-k3',
    },
    alibabaCloudApi: {
        provider: 'alibaba',
        defaultModel: 'qwen-plus',
    },
    minimaxApi: {
        provider: 'minimax',
        defaultModel: 'MiniMax-M3',
    },
};
exports.LLM_PROVIDER_PRIORITY = [
    'anthropic',
    'openai',
    'google',
    'mistral',
    'xai',
    'groq',
    'deepseek',
    'cohere',
    'openrouter',
    'nvidia',
    'vercel',
    'moonshotai',
    'alibaba',
    'minimax',
];
//# sourceMappingURL=llm-provider-defaults.js.map