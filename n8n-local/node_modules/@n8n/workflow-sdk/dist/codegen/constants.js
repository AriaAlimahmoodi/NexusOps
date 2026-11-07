"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_OPTIONAL_ARRAY_TYPES = exports.AI_ALWAYS_ARRAY_TYPES = exports.AI_CONNECTION_TO_BUILDER = exports.AI_CONNECTION_TO_CONFIG_KEY = void 0;
exports.AI_CONNECTION_TO_CONFIG_KEY = {
    ai_languageModel: 'model',
    ai_memory: 'memory',
    ai_tool: 'tools',
    ai_outputParser: 'outputParser',
    ai_embedding: 'embedding',
    ai_vectorStore: 'vectorStore',
    ai_retriever: 'retriever',
    ai_document: 'documentLoader',
    ai_textSplitter: 'textSplitter',
    ai_reranker: 'reranker',
};
exports.AI_CONNECTION_TO_BUILDER = {
    ai_languageModel: 'languageModel',
    ai_memory: 'memory',
    ai_tool: 'tool',
    ai_outputParser: 'outputParser',
    ai_embedding: 'embedding',
    ai_vectorStore: 'vectorStore',
    ai_retriever: 'retriever',
    ai_document: 'documentLoader',
    ai_textSplitter: 'textSplitter',
    ai_reranker: 'reranker',
};
exports.AI_ALWAYS_ARRAY_TYPES = new Set(['ai_tool']);
exports.AI_OPTIONAL_ARRAY_TYPES = new Set([
    'ai_languageModel',
    'ai_document',
    'ai_embedding',
    'ai_reranker',
]);
//# sourceMappingURL=constants.js.map