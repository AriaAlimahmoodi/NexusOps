"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInputs = getInputs;
function getInputs(hasMainInput, hasOutputParser, needsFallback) {
    const getInputData = (inputs) => {
        return inputs.map(({ type, filter, displayName, required }) => {
            const input = {
                type,
                displayName,
                required,
                maxConnections: ['ai_languageModel', 'ai_memory', 'ai_outputParser'].includes(type)
                    ? 1
                    : undefined,
            };
            if (filter) {
                input.filter = filter;
            }
            return input;
        });
    };
    let specialInputs = [
        {
            type: 'ai_languageModel',
            displayName: 'Chat Model',
            required: true,
            filter: {
                excludedNodes: [
                    '@n8n/n8n-nodes-langchain.lmCohere',
                    '@n8n/n8n-nodes-langchain.lmOllama',
                    'n8n/n8n-nodes-langchain.lmOpenAi',
                    '@n8n/n8n-nodes-langchain.lmOpenHuggingFaceInference',
                ],
            },
        },
        {
            type: 'ai_languageModel',
            displayName: 'Fallback Model',
            required: true,
            filter: {
                excludedNodes: [
                    '@n8n/n8n-nodes-langchain.lmCohere',
                    '@n8n/n8n-nodes-langchain.lmOllama',
                    'n8n/n8n-nodes-langchain.lmOpenAi',
                    '@n8n/n8n-nodes-langchain.lmOpenHuggingFaceInference',
                ],
            },
        },
        {
            displayName: 'Memory',
            type: 'ai_memory',
        },
        {
            displayName: 'Tool',
            type: 'ai_tool',
        },
        {
            displayName: 'Output Parser',
            type: 'ai_outputParser',
        },
    ];
    if (hasOutputParser === false) {
        specialInputs = specialInputs.filter((input) => input.type !== 'ai_outputParser');
    }
    if (needsFallback === false) {
        specialInputs = specialInputs.filter((input) => input.displayName !== 'Fallback Model');
    }
    const mainInputs = hasMainInput ? ['main'] : [];
    return [...mainInputs, ...getInputData(specialInputs)];
}
//# sourceMappingURL=utils.js.map