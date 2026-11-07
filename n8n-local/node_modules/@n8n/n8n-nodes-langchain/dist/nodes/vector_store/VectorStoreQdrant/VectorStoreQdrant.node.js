"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreQdrant = void 0;
const qdrant_1 = require("@langchain/qdrant");
const n8n_workflow_1 = require("n8n-workflow");
const Qdrant_utils_1 = require("./Qdrant.utils");
const ai_utilities_1 = require("@n8n/ai-utilities");
const listSearch_1 = require("../shared/methods/listSearch");
const descriptions_1 = require("../shared/descriptions");
class ExtendedQdrantVectorStore extends qdrant_1.QdrantVectorStore {
    static async fromExistingCollection(embeddings, args, defaultFilter = {}) {
        ExtendedQdrantVectorStore.defaultFilter = defaultFilter;
        return await super.fromExistingCollection(embeddings, args);
    }
    async similaritySearch(query, k, filter, callbacks) {
        const mergedFilter = { ...ExtendedQdrantVectorStore.defaultFilter, ...filter };
        return await super.similaritySearch(query, k, mergedFilter, callbacks);
    }
}
ExtendedQdrantVectorStore.defaultFilter = {};
const sharedFields = [descriptions_1.qdrantCollectionRLC];
const sharedOptions = [
    {
        displayName: 'Content Payload Key',
        name: 'contentPayloadKey',
        type: 'string',
        default: 'content',
        description: 'The key to use for the content payload in Qdrant. Default is "content".',
    },
    {
        displayName: 'Metadata Payload Key',
        name: 'metadataPayloadKey',
        type: 'string',
        default: 'metadata',
        description: 'The key to use for the metadata payload in Qdrant. Default is "metadata".',
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
                displayName: 'Collection Config',
                name: 'collectionConfig',
                type: 'json',
                default: '',
                description: 'JSON options for creating a collection. <a href="https://qdrant.tech/documentation/concepts/collections">Learn more</a>.',
            },
            ...sharedOptions,
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
        options: [
            {
                displayName: 'Search Filter',
                name: 'searchFilterJson',
                type: 'json',
                typeOptions: {
                    rows: 5,
                },
                default: '{\n  "should": [\n    {\n      "key": "metadata.batch",\n      "match": {\n        "value": 12345\n      }\n    }\n  ]\n}',
                validateType: 'object',
                description: 'Filter pageContent or metadata using this <a href="https://qdrant.tech/documentation/concepts/filtering/" target="_blank">filtering syntax</a>',
            },
            ...sharedOptions,
        ],
    },
];
class VectorStoreQdrant extends (0, ai_utilities_1.createVectorStoreNode)({
    meta: {
        displayName: 'Qdrant Vector Store',
        name: 'vectorStoreQdrant',
        description: 'Work with your data in a Qdrant collection',
        icon: 'file:qdrant.svg',
        docsUrl: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreqdrant/',
        credentials: [
            {
                name: 'qdrantApi',
                required: true,
            },
        ],
    },
    methods: { listSearch: { qdrantCollectionsSearch: listSearch_1.qdrantCollectionsSearch } },
    loadFields: retrieveFields,
    insertFields,
    sharedFields,
    retrieveFields,
    async getVectorStoreClient(context, filter, embeddings, itemIndex) {
        const collection = context.getNodeParameter('qdrantCollection', itemIndex, '', {
            extractValue: true,
        });
        const contentPayloadKey = context.getNodeParameter('options.contentPayloadKey', itemIndex, '');
        (0, n8n_workflow_1.assertParamIsString)('contentPayloadKey', contentPayloadKey, context.getNode());
        const metadataPayloadKey = context.getNodeParameter('options.metadataPayloadKey', itemIndex, '');
        (0, n8n_workflow_1.assertParamIsString)('metadataPayloadKey', metadataPayloadKey, context.getNode());
        const credentials = await context.getCredentials('qdrantApi');
        const client = (0, Qdrant_utils_1.createQdrantClient)(credentials);
        const config = {
            client,
            collectionName: collection,
            contentPayloadKey: contentPayloadKey !== '' ? contentPayloadKey : undefined,
            metadataPayloadKey: metadataPayloadKey !== '' ? metadataPayloadKey : undefined,
        };
        return await ExtendedQdrantVectorStore.fromExistingCollection(embeddings, config, filter);
    },
    async populateVectorStore(context, embeddings, documents, itemIndex) {
        const collectionName = context.getNodeParameter('qdrantCollection', itemIndex, '', {
            extractValue: true,
        });
        const contentPayloadKey = context.getNodeParameter('options.contentPayloadKey', itemIndex, '');
        (0, n8n_workflow_1.assertParamIsString)('contentPayloadKey', contentPayloadKey, context.getNode());
        const metadataPayloadKey = context.getNodeParameter('options.metadataPayloadKey', itemIndex, '');
        (0, n8n_workflow_1.assertParamIsString)('metadataPayloadKey', metadataPayloadKey, context.getNode());
        const { collectionConfig } = context.getNodeParameter('options', itemIndex, {});
        const credentials = await context.getCredentials('qdrantApi');
        const client = (0, Qdrant_utils_1.createQdrantClient)(credentials);
        const config = {
            client,
            collectionName,
            collectionConfig,
            contentPayloadKey: contentPayloadKey !== '' ? contentPayloadKey : undefined,
            metadataPayloadKey: metadataPayloadKey !== '' ? metadataPayloadKey : undefined,
        };
        await qdrant_1.QdrantVectorStore.fromDocuments(documents, embeddings, config);
    },
}) {
}
exports.VectorStoreQdrant = VectorStoreQdrant;
//# sourceMappingURL=VectorStoreQdrant.node.js.map