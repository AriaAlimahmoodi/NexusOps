"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreZep = void 0;
const zep_1 = require("@langchain/community/vectorstores/zep");
const zep_cloud_1 = require("@langchain/community/vectorstores/zep_cloud");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
const embeddingDimensions = {
    displayName: 'Embedding Dimensions',
    name: 'embeddingDimensions',
    type: 'number',
    default: 1536,
    description: 'Whether to allow using characters from the Unicode surrogate blocks',
};
const insertFields = [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
            embeddingDimensions,
            {
                displayName: 'Is Auto Embedded',
                name: 'isAutoEmbedded',
                type: 'boolean',
                default: true,
                description: 'Whether to automatically embed documents when they are added',
            },
        ],
    },
];
const retrieveFields = [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [embeddingDimensions, ai_utilities_1.metadataFilterField],
    },
];
class VectorStoreZep extends (0, ai_utilities_1.createVectorStoreNode)({
    meta: {
        displayName: 'Zep Vector Store',
        name: 'vectorStoreZep',
        hidden: true,
        description: 'Work with your data in Zep Vector Store',
        credentials: [
            {
                name: 'zepApi',
                required: true,
            },
        ],
        icon: 'file:zep.png',
        docsUrl: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstorezep/',
    },
    sharedFields: [
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
    ],
    insertFields,
    loadFields: retrieveFields,
    retrieveFields,
    async getVectorStoreClient(context, filter, embeddings, itemIndex) {
        const collectionName = context.getNodeParameter('collectionName', itemIndex);
        const options = context.getNodeParameter('options', itemIndex) || {};
        const credentials = await context.getCredentials('zepApi');
        const zepConfig = {
            apiKey: credentials.apiKey,
            collectionName,
            embeddingDimensions: options.embeddingDimensions ?? 1536,
            metadata: filter,
        };
        if (credentials.cloud) {
            return new zep_cloud_1.ZepCloudVectorStore(embeddings, zepConfig);
        }
        else {
            return new zep_1.ZepVectorStore(embeddings, { ...zepConfig, apiUrl: credentials.apiUrl });
        }
    },
    async populateVectorStore(context, embeddings, documents, itemIndex) {
        const collectionName = context.getNodeParameter('collectionName', itemIndex);
        const options = context.getNodeParameter('options', itemIndex) || {};
        const credentials = await context.getCredentials('zepApi');
        const zepConfig = {
            apiKey: credentials.apiKey,
            collectionName,
            embeddingDimensions: options.embeddingDimensions ?? 1536,
            isAutoEmbedded: options.isAutoEmbedded ?? true,
        };
        try {
            if (credentials.cloud) {
                await zep_cloud_1.ZepCloudVectorStore.fromDocuments(documents, embeddings, zepConfig);
            }
            else {
                await zep_1.ZepVectorStore.fromDocuments(documents, embeddings, {
                    ...zepConfig,
                    apiUrl: credentials.apiUrl,
                });
            }
        }
        catch (error) {
            const errorCode = error.code;
            const responseData = error.responseData;
            if (errorCode === 400 && responseData.includes('CreateDocumentCollectionRequest')) {
                throw new n8n_workflow_1.NodeOperationError(context.getNode(), `Collection ${collectionName} not found`, {
                    itemIndex,
                    description: 'Please check that the collection exists in your vector store, or make sure that collection name contains only alphanumeric characters',
                });
            }
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), error, { itemIndex });
        }
    },
}) {
}
exports.VectorStoreZep = VectorStoreZep;
//# sourceMappingURL=VectorStoreZep.node.js.map