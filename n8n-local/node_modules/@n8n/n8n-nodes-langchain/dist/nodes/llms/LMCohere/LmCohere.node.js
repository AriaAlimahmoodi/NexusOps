"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LmCohere = void 0;
const cohere_1 = require("@langchain/cohere");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
class LmCohere {
    constructor() {
        this.description = {
            displayName: 'Cohere Model',
            name: 'lmCohere',
            icon: { light: 'file:cohere.svg', dark: 'file:cohere.dark.svg' },
            group: ['transform'],
            version: 1,
            description: 'Language Model Cohere',
            defaults: {
                name: 'Cohere Model',
            },
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Language Models', 'Root Nodes'],
                    'Language Models': ['Text Completion Models'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmcohere/',
                        },
                    ],
                },
            },
            inputs: [],
            outputs: [n8n_workflow_1.NodeConnectionTypes.AiLanguageModel],
            outputNames: ['Model'],
            credentials: [
                {
                    name: 'cohereApi',
                    required: true,
                },
            ],
            properties: [
                (0, ai_utilities_1.getConnectionHintNoticeField)([n8n_workflow_1.NodeConnectionTypes.AiChain, n8n_workflow_1.NodeConnectionTypes.AiAgent]),
                {
                    displayName: 'Options',
                    name: 'options',
                    placeholder: 'Add Option',
                    description: 'Additional options to add',
                    type: 'collection',
                    default: {},
                    options: [
                        {
                            displayName: 'Maximum Number of Tokens',
                            name: 'maxTokens',
                            default: 250,
                            description: 'The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 32,768).',
                            type: 'number',
                            typeOptions: {
                                maxValue: 32768,
                            },
                        },
                        {
                            displayName: 'Model',
                            name: 'model',
                            type: 'string',
                            description: 'The name of the model to use',
                            default: '',
                        },
                        {
                            displayName: 'Sampling Temperature',
                            name: 'temperature',
                            default: 0,
                            typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
                            description: 'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
                            type: 'number',
                        },
                    ],
                },
            ],
        };
    }
    async supplyData(itemIndex) {
        const credentials = await this.getCredentials('cohereApi');
        const options = this.getNodeParameter('options', itemIndex, {});
        const model = new cohere_1.Cohere({
            apiKey: credentials.apiKey,
            ...options,
            callbacks: [new ai_utilities_1.N8nLlmTracing(this)],
            onFailedAttempt: (0, ai_utilities_1.makeN8nLlmFailedAttemptHandler)(this),
        });
        return {
            response: model,
        };
    }
}
exports.LmCohere = LmCohere;
//# sourceMappingURL=LmCohere.node.js.map