"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemPromptOption = exports.INPUT_TEMPLATE_KEY = exports.LEGACY_INPUT_TEMPLATE_KEY = exports.SYSTEM_PROMPT_TEMPLATE = void 0;
exports.SYSTEM_PROMPT_TEMPLATE = `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
----------------
Context: {context}`;
exports.LEGACY_INPUT_TEMPLATE_KEY = 'question';
exports.INPUT_TEMPLATE_KEY = 'input';
exports.systemPromptOption = {
    displayName: 'System Prompt Template',
    name: 'systemPromptTemplate',
    type: 'string',
    default: exports.SYSTEM_PROMPT_TEMPLATE,
    typeOptions: {
        rows: 6,
    },
};
//# sourceMappingURL=constants.js.map