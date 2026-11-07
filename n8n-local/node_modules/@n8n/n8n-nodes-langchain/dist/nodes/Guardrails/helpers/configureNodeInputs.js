"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureNodeInputsV1 = exports.configureNodeInputsV2 = exports.hasLLMGuardrails = void 0;
const LLM_CHECKS = ['nsfw', 'topicalAlignment', 'custom', 'jailbreak'];
const hasLLMGuardrails = (guardrails) => {
    const checks = Object.keys(guardrails ?? {});
    return checks.some((check) => LLM_CHECKS.includes(check));
};
exports.hasLLMGuardrails = hasLLMGuardrails;
const configureNodeInputsV2 = (parameters) => {
    const CHECKS = ['nsfw', 'topicalAlignment', 'custom', 'jailbreak'];
    const checks = Object.keys(parameters?.guardrails ?? {});
    const hasLLMChecks = checks.some((check) => CHECKS.includes(check));
    if (!hasLLMChecks) {
        return ['main'];
    }
    return [
        'main',
        {
            type: 'ai_languageModel',
            displayName: 'Chat Model',
            maxConnections: 1,
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
    ];
};
exports.configureNodeInputsV2 = configureNodeInputsV2;
const configureNodeInputsV1 = (operation) => {
    if (operation === 'sanitize') {
        return ['main'];
    }
    return [
        'main',
        {
            type: 'ai_languageModel',
            displayName: 'Chat Model',
            maxConnections: 1,
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
    ];
};
exports.configureNodeInputsV1 = configureNodeInputsV1;
//# sourceMappingURL=configureNodeInputs.js.map