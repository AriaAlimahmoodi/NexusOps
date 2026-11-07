"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RerankerCohere = void 0;
const cohere_1 = require("@langchain/cohere");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
class RerankerCohere {
    constructor() {
        this.description = {
            displayName: 'Reranker Cohere',
            name: 'rerankerCohere',
            icon: { light: 'file:cohere.svg', dark: 'file:cohere.dark.svg' },
            group: ['transform'],
            version: 1,
            description: 'Use Cohere Reranker to reorder documents after retrieval from a vector store by relevance to the given query.',
            defaults: {
                name: 'Reranker Cohere',
            },
            requestDefaults: {
                ignoreHttpStatusErrors: true,
                baseURL: '={{ $credentials.host }}',
            },
            credentials: [
                {
                    name: 'cohereApi',
                    required: true,
                },
            ],
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Rerankers'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.rerankercohere/',
                        },
                    ],
                },
            },
            inputs: [],
            outputs: [n8n_workflow_1.NodeConnectionTypes.AiReranker],
            outputNames: ['Reranker'],
            properties: [
                {
                    displayName: 'Model',
                    name: 'modelName',
                    type: 'options',
                    description: 'The model that should be used to rerank the documents. <a href="https://docs.cohere.com/docs/models">Learn more</a>.',
                    default: 'rerank-v3.5',
                    options: [
                        {
                            name: 'rerank-v3.5',
                            value: 'rerank-v3.5',
                        },
                        {
                            name: 'rerank-english-v3.0',
                            value: 'rerank-english-v3.0',
                        },
                        {
                            name: 'rerank-multilingual-v3.0',
                            value: 'rerank-multilingual-v3.0',
                        },
                    ],
                },
                {
                    displayName: 'Top N',
                    name: 'topN',
                    type: 'number',
                    description: 'The maximum number of documents to return after reranking',
                    default: 3,
                },
            ],
        };
    }
    async supplyData(itemIndex) {
        this.logger.debug('Supply data for reranking Cohere');
        const modelName = this.getNodeParameter('modelName', itemIndex, 'rerank-v3.5');
        const topN = this.getNodeParameter('topN', itemIndex, 3);
        const credentials = await this.getCredentials('cohereApi');
        const reranker = new cohere_1.CohereRerank({
            apiKey: credentials.apiKey,
            model: modelName,
            topN,
        });
        return {
            response: (0, ai_utilities_1.logWrapper)(reranker, this),
        };
    }
}
exports.RerankerCohere = RerankerCohere;
//# sourceMappingURL=RerankerCohere.node.js.map