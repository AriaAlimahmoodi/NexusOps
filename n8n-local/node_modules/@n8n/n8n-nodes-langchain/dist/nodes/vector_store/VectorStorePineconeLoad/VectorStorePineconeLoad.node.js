"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStorePineconeLoad = void 0;
const pinecone_1 = require("@langchain/pinecone");
const pinecone_2 = require("@pinecone-database/pinecone");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
const listSearch_1 = require("../shared/methods/listSearch");
const descriptions_1 = require("../shared/descriptions");
class VectorStorePineconeLoad {
    constructor() {
        this.description = {
            displayName: 'Pinecone: Load',
            hidden: true,
            name: 'vectorStorePineconeLoad',
            icon: 'file:pinecone.svg',
            group: ['transform'],
            version: 1,
            description: 'Load data from Pinecone Vector Store index',
            defaults: {
                name: 'Pinecone: Load',
            },
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Vector Stores'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstorepinecone/',
                        },
                    ],
                },
            },
            credentials: [
                {
                    name: 'pineconeApi',
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
                descriptions_1.pineconeIndexRLC,
                {
                    displayName: 'Pinecone Namespace',
                    name: 'pineconeNamespace',
                    type: 'string',
                    default: '',
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [ai_utilities_1.metadataFilterField],
                },
            ],
        };
        this.methods = {
            listSearch: {
                pineconeIndexSearch: listSearch_1.pineconeIndexSearch,
            },
        };
    }
    async supplyData(itemIndex) {
        this.logger.debug('Supplying data for Pinecone Load Vector Store');
        const namespace = this.getNodeParameter('pineconeNamespace', itemIndex);
        const index = this.getNodeParameter('pineconeIndex', itemIndex, '', {
            extractValue: true,
        });
        const credentials = await this.getCredentials('pineconeApi');
        const embeddings = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiEmbedding, itemIndex));
        const client = new pinecone_2.Pinecone({
            apiKey: credentials.apiKey,
        });
        const pineconeIndex = client.Index(index);
        const config = {
            namespace: namespace || undefined,
            pineconeIndex,
            filter: (0, ai_utilities_1.getMetadataFiltersValues)(this, itemIndex),
        };
        const vectorStore = await pinecone_1.PineconeStore.fromExistingIndex(embeddings, config);
        return {
            response: (0, ai_utilities_1.logWrapper)(vectorStore, this),
        };
    }
}
exports.VectorStorePineconeLoad = VectorStorePineconeLoad;
//# sourceMappingURL=VectorStorePineconeLoad.node.js.map