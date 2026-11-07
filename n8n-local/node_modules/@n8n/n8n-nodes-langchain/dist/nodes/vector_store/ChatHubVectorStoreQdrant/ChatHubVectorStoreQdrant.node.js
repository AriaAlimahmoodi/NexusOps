"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHubVectorStoreQdrant = void 0;
const qdrant_1 = require("@langchain/qdrant");
const n8n_workflow_1 = require("n8n-workflow");
const Qdrant_utils_1 = require("../VectorStoreQdrant/Qdrant.utils");
const userScoped_1 = require("../shared/userScoped");
const ai_utilities_1 = require("@n8n/ai-utilities");
const chatHub_1 = require("../shared/chatHub");
const retrieveFields = [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [ai_utilities_1.metadataFilterField],
    },
];
const INDEXED_PAYLOAD_FIELDS = [
    'metadata.userId',
    'metadata.agentId',
    'metadata.fileKnowledgeId',
];
async function ensurePayloadIndexes(client, collectionName) {
    for (const fieldName of INDEXED_PAYLOAD_FIELDS) {
        await client.createPayloadIndex(collectionName, {
            field_name: fieldName,
            field_schema: 'keyword',
        });
    }
}
async function chatHubVectorStoreQdrantApiConnectionTest(credential) {
    const credentials = credential.data;
    try {
        const client = (0, Qdrant_utils_1.createQdrantClient)(credentials);
        await client.getCollections();
    }
    catch (error) {
        return {
            status: 'Error',
            message: error.message,
        };
    }
    return {
        status: 'OK',
        message: 'Connection successful',
    };
}
async function deleteDocuments(payload) {
    const { filter = {} } = (typeof payload === 'string' ? (0, n8n_workflow_1.jsonParse)(payload) : (payload ?? {}));
    const credentials = await this.getCredentials('chatHubVectorStoreQdrantApi');
    const userId = (0, userScoped_1.ensureUserId)(this);
    const client = (0, Qdrant_utils_1.createQdrantClient)(credentials);
    await ensurePayloadIndexes(client, credentials.collectionName);
    const must = [
        { key: 'metadata.userId', match: { value: userId } },
        ...Object.entries(filter).map(([key, value]) => {
            if (Array.isArray(value)) {
                return { key: `metadata.${key}`, match: { any: value } };
            }
            return { key: `metadata.${key}`, match: { value } };
        }),
    ];
    this.logger.debug(`Deleting Qdrant vector store documents... Filter: ${JSON.stringify(must)}`);
    await client.delete(credentials.collectionName, { filter: { must } });
    return null;
}
class ChatHubVectorStoreQdrant extends (0, ai_utilities_1.createVectorStoreNode)({
    meta: {
        displayName: 'ChatHub Qdrant Vector Store',
        name: 'chatHubVectorStoreQdrant',
        description: 'Internal-use vector store for ChatHub',
        icon: 'file:../VectorStoreQdrant/qdrant.svg',
        docsUrl: 'https://docs.n8n.io',
        credentials: [
            {
                name: 'chatHubVectorStoreQdrantApi',
                required: true,
                testedBy: 'chatHubVectorStoreQdrantApiConnectionTest',
            },
        ],
        operationModes: ['load', 'insert', 'retrieve', 'retrieve-as-tool'],
    },
    hidden: true,
    methods: {
        credentialTest: { chatHubVectorStoreQdrantApiConnectionTest },
        actionHandler: { deleteDocuments },
    },
    sharedFields: [],
    insertFields: [],
    loadFields: retrieveFields,
    retrieveFields,
    async getVectorStoreClient(context, _filter, embeddings) {
        const credentials = await context.getCredentials('chatHubVectorStoreQdrantApi');
        const userId = (0, userScoped_1.ensureUserId)(context);
        const client = (0, Qdrant_utils_1.createQdrantClient)(credentials);
        const config = { client, collectionName: credentials.collectionName };
        const store = await qdrant_1.QdrantVectorStore.fromExistingCollection(embeddings, config);
        await ensurePayloadIndexes(client, credentials.collectionName);
        const originalSearch = store.similaritySearch.bind(store);
        const originalSearchWithScore = store.similaritySearchWithScore.bind(store);
        const originalSearchVectorWithScore = store.similaritySearchVectorWithScore.bind(store);
        function createFinalFilter(anotherFilter) {
            const anotherFilterMust = anotherFilter
                ? Object.entries(anotherFilter).map(([key, value]) => ({
                    key: `metadata.${key}`,
                    match: { value },
                }))
                : [];
            const final = {
                must: [...anotherFilterMust, { key: 'metadata.userId', match: { value: userId } }],
            };
            context.logger.debug(`Querying Qdrant vector store... Filter: ${JSON.stringify(final)}`);
            return final;
        }
        store.similaritySearch = async (query, k, f, callbacks) => {
            const results = await originalSearch(query, k, createFinalFilter(f), callbacks);
            return results.map((doc) => ({
                ...doc,
                metadata: (0, chatHub_1.filterChatHubMetadata)(doc.metadata, chatHub_1.CHAT_HUB_RETRIEVE_METADATA_KEYS),
            }));
        };
        store.similaritySearchWithScore = async (query, k, f, callbacks) => {
            const results = await originalSearchWithScore(query, k, createFinalFilter(f), callbacks);
            return results.map(([doc, score]) => [
                { ...doc, metadata: (0, chatHub_1.filterChatHubMetadata)(doc.metadata, chatHub_1.CHAT_HUB_RETRIEVE_METADATA_KEYS) },
                score,
            ]);
        };
        store.similaritySearchVectorWithScore = async (query, k, f) => {
            const results = await originalSearchVectorWithScore(query, k, createFinalFilter(f));
            return results.map(([doc, score]) => [
                { ...doc, metadata: (0, chatHub_1.filterChatHubMetadata)(doc.metadata, chatHub_1.CHAT_HUB_RETRIEVE_METADATA_KEYS) },
                score,
            ]);
        };
        return store;
    },
    async populateVectorStore(context, embeddings, documents) {
        const credentials = await context.getCredentials('chatHubVectorStoreQdrantApi');
        const userId = (0, userScoped_1.ensureUserId)(context);
        const client = (0, Qdrant_utils_1.createQdrantClient)(credentials);
        const config = { client, collectionName: credentials.collectionName };
        await qdrant_1.QdrantVectorStore.fromDocuments((0, chatHub_1.filterChatHubInsertDocuments)(documents).map((d) => ({
            ...d,
            metadata: { ...d.metadata, userId },
        })), embeddings, config);
        await ensurePayloadIndexes(client, credentials.collectionName);
    },
}) {
}
exports.ChatHubVectorStoreQdrant = ChatHubVectorStoreQdrant;
//# sourceMappingURL=ChatHubVectorStoreQdrant.node.js.map