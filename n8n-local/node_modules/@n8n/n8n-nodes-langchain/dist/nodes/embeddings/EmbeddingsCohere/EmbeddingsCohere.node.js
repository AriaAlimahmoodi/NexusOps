"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsCohere = void 0;
const cohere_1 = require("@langchain/cohere");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
class EmbeddingsCohere {
    constructor() {
        this.description = {
            displayName: 'Embeddings Cohere',
            name: 'embeddingsCohere',
            icon: { light: 'file:cohere.svg', dark: 'file:cohere.dark.svg' },
            group: ['transform'],
            version: 1,
            description: 'Use Cohere Embeddings',
            defaults: {
                name: 'Embeddings Cohere',
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
                    AI: ['Embeddings'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.embeddingscohere/',
                        },
                    ],
                },
            },
            inputs: [],
            outputs: [n8n_workflow_1.NodeConnectionTypes.AiEmbedding],
            outputNames: ['Embeddings'],
            properties: [
                (0, ai_utilities_1.getConnectionHintNoticeField)([n8n_workflow_1.NodeConnectionTypes.AiVectorStore]),
                {
                    displayName: 'Each model is using different dimensional density for embeddings. Please make sure to use the same dimensionality for your vector store. The default model is using 768-dimensional embeddings.',
                    name: 'notice',
                    type: 'notice',
                    default: '',
                },
                {
                    displayName: 'Model',
                    name: 'modelName',
                    type: 'options',
                    description: 'The model which will generate the embeddings. <a href="https://docs.cohere.com/docs/models">Learn more</a>.',
                    default: 'embed-english-v2.0',
                    options: [
                        {
                            name: 'Embed-English-Light-v2.0 (1024 Dimensions)',
                            value: 'embed-english-light-v2.0',
                        },
                        {
                            name: 'Embed-English-Light-v3.0 (384 Dimensions)',
                            value: 'embed-english-light-v3.0',
                        },
                        {
                            name: 'Embed-English-v2.0 (4096 Dimensions)',
                            value: 'embed-english-v2.0',
                        },
                        {
                            name: 'Embed-English-v3.0 (1024 Dimensions)',
                            value: 'embed-english-v3.0',
                        },
                        {
                            name: 'Embed-Multilingual-Light-v3.0 (384 Dimensions)',
                            value: 'embed-multilingual-light-v3.0',
                        },
                        {
                            name: 'Embed-Multilingual-v2.0 (768 Dimensions)',
                            value: 'embed-multilingual-v2.0',
                        },
                        {
                            name: 'Embed-Multilingual-v3.0 (1024 Dimensions)',
                            value: 'embed-multilingual-v3.0',
                        },
                    ],
                },
            ],
        };
    }
    async supplyData(itemIndex) {
        this.logger.debug('Supply data for embeddings Cohere');
        const modelName = this.getNodeParameter('modelName', itemIndex, 'embed-english-v2.0');
        const credentials = await this.getCredentials('cohereApi');
        const embeddings = new cohere_1.CohereEmbeddings({
            apiKey: credentials.apiKey,
            model: modelName,
        });
        return {
            response: (0, ai_utilities_1.logWrapper)(embeddings, this),
        };
    }
}
exports.EmbeddingsCohere = EmbeddingsCohere;
//# sourceMappingURL=EmbeddingsCohere.node.js.map