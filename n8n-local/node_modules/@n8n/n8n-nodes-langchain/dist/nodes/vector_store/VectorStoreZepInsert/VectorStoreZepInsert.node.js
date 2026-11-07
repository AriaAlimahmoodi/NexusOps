"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreZepInsert = void 0;
const zep_1 = require("@langchain/community/vectorstores/zep");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
class VectorStoreZepInsert {
    constructor() {
        this.description = {
            displayName: 'Zep Vector Store: Insert',
            name: 'vectorStoreZepInsert',
            hidden: true,
            icon: 'file:zep.png',
            group: ['transform'],
            version: 1,
            description: 'Insert data into Zep Vector Store index',
            defaults: {
                name: 'Zep: Insert',
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
                n8n_workflow_1.NodeConnectionTypes.Main,
                {
                    displayName: 'Document',
                    maxConnections: 1,
                    type: n8n_workflow_1.NodeConnectionTypes.AiDocument,
                    required: true,
                },
                {
                    displayName: 'Embedding',
                    maxConnections: 1,
                    type: n8n_workflow_1.NodeConnectionTypes.AiEmbedding,
                    required: true,
                },
            ],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
                    displayName: 'Specify the document to load in the document loader sub-node',
                    name: 'notice',
                    type: 'notice',
                    default: '',
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
                        {
                            displayName: 'Is Auto Embedded',
                            name: 'isAutoEmbedded',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to automatically embed documents when they are added',
                        },
                    ],
                },
            ],
        };
    }
    async execute() {
        this.logger.debug('Executing data for Zep Insert Vector Store');
        const items = this.getInputData(0);
        const collectionName = this.getNodeParameter('collectionName', 0);
        const options = this.getNodeParameter('options', 0, {}) || {};
        const credentials = await this.getCredentials('zepApi');
        const documentInput = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiDocument, 0));
        const embeddings = (await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiEmbedding, 0));
        const { processedDocuments, serializedDocuments } = await (0, ai_utilities_1.processDocuments)(documentInput, items);
        const zepConfig = {
            apiUrl: credentials.apiUrl,
            apiKey: credentials.apiKey,
            collectionName,
            embeddingDimensions: options.embeddingDimensions ?? 1536,
            isAutoEmbedded: options.isAutoEmbedded ?? true,
        };
        await zep_1.ZepVectorStore.fromDocuments(processedDocuments, embeddings, zepConfig);
        return [serializedDocuments];
    }
}
exports.VectorStoreZepInsert = VectorStoreZepInsert;
//# sourceMappingURL=VectorStoreZepInsert.node.js.map