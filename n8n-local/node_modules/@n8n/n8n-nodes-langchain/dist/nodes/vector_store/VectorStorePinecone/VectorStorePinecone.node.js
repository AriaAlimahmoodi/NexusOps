"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStorePinecone = void 0;
const pinecone_1 = require("@langchain/pinecone");
const pinecone_2 = require("@pinecone-database/pinecone");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
const listSearch_1 = require("../shared/methods/listSearch");
const descriptions_1 = require("../shared/descriptions");
const sharedFields = [descriptions_1.pineconeIndexRLC];
const pineconeNamespaceField = {
    displayName: 'Pinecone Namespace',
    name: 'pineconeNamespace',
    type: 'string',
    description: 'Partition the records in an index into namespaces. Queries and other operations are then limited to one namespace, so different requests can search different subsets of your index.',
    default: '',
};
const retrieveFields = [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [pineconeNamespaceField, ai_utilities_1.metadataFilterField],
    },
];
const insertFields = [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
            {
                displayName: 'Clear Namespace',
                name: 'clearNamespace',
                type: 'boolean',
                default: false,
                description: 'Whether to clear the namespace before inserting new data',
            },
            pineconeNamespaceField,
        ],
    },
];
class VectorStorePinecone extends (0, ai_utilities_1.createVectorStoreNode)({
    meta: {
        displayName: 'Pinecone Vector Store',
        name: 'vectorStorePinecone',
        description: 'Work with your data in Pinecone Vector Store',
        icon: { light: 'file:pinecone.svg', dark: 'file:pinecone.dark.svg' },
        docsUrl: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstorepinecone/',
        credentials: [
            {
                name: 'pineconeApi',
                required: true,
            },
        ],
        operationModes: ['load', 'insert', 'retrieve', 'update', 'retrieve-as-tool'],
    },
    methods: { listSearch: { pineconeIndexSearch: listSearch_1.pineconeIndexSearch } },
    retrieveFields,
    loadFields: retrieveFields,
    insertFields,
    sharedFields,
    async getVectorStoreClient(context, filter, embeddings, itemIndex) {
        const index = context.getNodeParameter('pineconeIndex', itemIndex, '', {
            extractValue: true,
        });
        const options = context.getNodeParameter('options', itemIndex, {});
        const credentials = await context.getCredentials('pineconeApi');
        const client = new pinecone_2.Pinecone({
            apiKey: credentials.apiKey,
        });
        const pineconeIndex = client.Index(index);
        const config = {
            namespace: options.pineconeNamespace ?? undefined,
            pineconeIndex,
            filter,
        };
        return await pinecone_1.PineconeStore.fromExistingIndex(embeddings, config);
    },
    async populateVectorStore(context, embeddings, documents, itemIndex) {
        const index = context.getNodeParameter('pineconeIndex', itemIndex, '', {
            extractValue: true,
        });
        const options = context.getNodeParameter('options', itemIndex, {});
        const credentials = await context.getCredentials('pineconeApi');
        const client = new pinecone_2.Pinecone({
            apiKey: credentials.apiKey,
        });
        const indexes = ((await client.listIndexes()).indexes ?? []).map((i) => i.name);
        if (!indexes.includes(index)) {
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), `Index ${index} not found`, {
                itemIndex,
                description: 'Please check that the index exists in your vector store',
            });
        }
        const pineconeIndex = client.Index(index);
        if (options.pineconeNamespace && options.clearNamespace) {
            const namespace = pineconeIndex.namespace(options.pineconeNamespace);
            try {
                await namespace.deleteAll();
            }
            catch (error) {
                context.logger.info(`Namespace ${options.pineconeNamespace} does not exist yet`);
            }
        }
        await pinecone_1.PineconeStore.fromDocuments(documents, embeddings, {
            namespace: options.pineconeNamespace ?? undefined,
            pineconeIndex,
        });
    },
}) {
}
exports.VectorStorePinecone = VectorStorePinecone;
//# sourceMappingURL=VectorStorePinecone.node.js.map