"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreMilvus = void 0;
const milvus_1 = require("@langchain/community/vectorstores/milvus");
const milvus2_sdk_node_1 = require("@zilliz/milvus2-sdk-node");
const ai_utilities_1 = require("@n8n/ai-utilities");
const listSearch_1 = require("../shared/methods/listSearch");
const descriptions_1 = require("../shared/descriptions");
const sharedFields = [descriptions_1.milvusCollectionRLC];
const insertFields = [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
            {
                displayName: 'Clear Collection',
                name: 'clearCollection',
                type: 'boolean',
                default: false,
                description: 'Whether to clear the collection before inserting new data',
            },
        ],
    },
];
class VectorStoreMilvus extends (0, ai_utilities_1.createVectorStoreNode)({
    meta: {
        displayName: 'Milvus Vector Store',
        name: 'vectorStoreMilvus',
        description: 'Work with your data in Milvus Vector Store',
        icon: { light: 'file:milvus-icon-black.svg', dark: 'file:milvus-icon-white.svg' },
        docsUrl: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoremilvus/',
        credentials: [
            {
                name: 'milvusApi',
                required: true,
            },
        ],
        operationModes: ['load', 'insert', 'retrieve', 'retrieve-as-tool'],
    },
    methods: { listSearch: { milvusCollectionsSearch: listSearch_1.milvusCollectionsSearch } },
    sharedFields,
    insertFields,
    async getVectorStoreClient(context, _filter, embeddings, itemIndex) {
        const collection = context.getNodeParameter('milvusCollection', itemIndex, '', {
            extractValue: true,
        });
        const credentials = await context.getCredentials('milvusApi');
        const config = {
            url: credentials.baseUrl,
            username: credentials.username,
            password: credentials.password,
            collectionName: collection,
        };
        return await milvus_1.Milvus.fromExistingCollection(embeddings, config);
    },
    async populateVectorStore(context, embeddings, documents, itemIndex) {
        const collection = context.getNodeParameter('milvusCollection', itemIndex, '', {
            extractValue: true,
        });
        const options = context.getNodeParameter('options', itemIndex, {});
        const credentials = await context.getCredentials('milvusApi');
        const config = {
            url: credentials.baseUrl,
            username: credentials.username,
            password: credentials.password,
            collectionName: collection,
        };
        if (options.clearCollection) {
            const client = new milvus2_sdk_node_1.MilvusClient({
                address: credentials.baseUrl,
                token: `${credentials.username}:${credentials.password}`,
            });
            await client.dropCollection({ collection_name: collection });
        }
        await milvus_1.Milvus.fromDocuments(documents, embeddings, config);
    },
}) {
}
exports.VectorStoreMilvus = VectorStoreMilvus;
//# sourceMappingURL=VectorStoreMilvus.node.js.map