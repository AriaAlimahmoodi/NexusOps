"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SEMANTIC_SEARCH_SETTINGS = exports.EMBEDDINGS_NODE_TYPE_MAP = exports.DEFAULT_CONTEXT_WINDOW_LENGTH = void 0;
const api_types_1 = require("@n8n/api-types");
exports.DEFAULT_CONTEXT_WINDOW_LENGTH = 20;
exports.EMBEDDINGS_NODE_TYPE_MAP = {
    openai: {
        name: '@n8n/n8n-nodes-langchain.embeddingsOpenAi',
        version: 1.2,
    },
    google: {
        name: '@n8n/n8n-nodes-langchain.embeddingsGoogleGemini',
        version: 1,
    },
    azureOpenAi: {
        name: '@n8n/n8n-nodes-langchain.embeddingsAzureOpenAi',
        version: 1,
    },
    azureEntraId: {
        name: '@n8n/n8n-nodes-langchain.embeddingsAzureOpenAi',
        version: 1,
    },
    ollama: {
        name: '@n8n/n8n-nodes-langchain.embeddingsOllama',
        version: 1,
    },
    awsBedrock: {
        name: '@n8n/n8n-nodes-langchain.embeddingsAwsBedrock',
        version: 1,
    },
    cohere: {
        name: '@n8n/n8n-nodes-langchain.embeddingsCohere',
        version: 1,
    },
    mistralCloud: {
        name: '@n8n/n8n-nodes-langchain.embeddingsMistralCloud',
        version: 1,
    },
};
exports.DEFAULT_SEMANTIC_SEARCH_SETTINGS = {
    embeddingModel: {
        credentialId: null,
        provider: api_types_1.chatHubLLMProviderSchema.options.filter((provider) => provider in exports.EMBEDDINGS_NODE_TYPE_MAP)[0],
    },
    vectorStore: { credentialId: null, provider: api_types_1.chatHubVectorStoreProviderSchema.options[0] },
};
//# sourceMappingURL=constants.js.map