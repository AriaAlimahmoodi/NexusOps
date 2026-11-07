"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreZepLoad = void 0;
const zep_1 = require("@langchain/community/vectorstores/zep");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
class VectorStoreZepLoad {
    constructor() {
        this.description = {
            displayName: 'Zep Vector Store: Load',
            name: 'vectorStoreZepLoad',
            hidden: true,
            icon: 'file:zep.png',
            group: ['transform'],
            version: 1,
            description: 'Load data from Zep Vector Store index',
            defaults: {
                name: 'Zep: Load',
            },
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Vector Stores'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstorezep/',
                        },
                    ],
                },
            },
            credentials: [
                {
                    name: 'zepApi',
                    required: true,
                },
            ],
            inputs: [
                {
                    displayName: 'Embedding',
                    maxConnections: 1,
                    type: n8n_workflow_1.NodeConnectionTypes.AiEmbedding,
                    required: true,
                },
            ],
            outputs: [n8n_workflow_1.NodeConnectionTypes.AiVectorStore],
            outputNames: ['Vector Store'],
            properties: [
                {
                    displayName: 'This Zep integration is deprecated and will be removed in a future version.',
                    name: 'deprecationNotice',
                    type: 'notice',
                    default: '',
                },
                {
                    displayName: 'Collection Name',
                    name: 'collectionName',
                    type: 'string',
                    default: '',
                    required: true,
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Embedding Dimensions',
                            name: 'embeddingDimensions',
                            type: 'number',
                            default: 1536,
                            description: 'Whether to allow using characters from the Unicode surrogate blocks',
                        },
                        ai_utilities_1.metadataFilterField,
                    ],
                },
            ],
        };
    }
    async supplyData(itemIndex) {
        this.logger.debug('Supplying data for Zep Load Vector Store');
        const collectionName = this.getNodeParameter('collectionName', itemIndex);
        const options = this.getNodeParameter('options', itemIndex) || {};
        const credentials = await this.getCredentials('zepApi');
        const embeddings = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiEmbedding, 0));
        const zepConfig = {
            apiUrl: credentials.apiUrl,
            apiKey: credentials.apiKey,
            collectionName,
            embeddingDimensions: options.embeddingDimensions ?? 1536,
            metadata: (0, ai_utilities_1.getMetadataFiltersValues)(this, itemIndex),
        };
        const vectorStore = new zep_1.ZepVectorStore(embeddings, zepConfig);
        return {
            response: (0, ai_utilities_1.logWrapper)(vectorStore, this),
        };
    }
}
exports.VectorStoreZepLoad = VectorStoreZepLoad;
//# sourceMappingURL=VectorStoreZepLoad.node.js.map