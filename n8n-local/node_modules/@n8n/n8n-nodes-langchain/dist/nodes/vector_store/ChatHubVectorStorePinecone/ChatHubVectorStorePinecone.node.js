"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHubVectorStorePinecone = void 0;
const pinecone_1 = require("@langchain/pinecone");
const pinecone_2 = require("@pinecone-database/pinecone");
const n8n_workflow_1 = require("n8n-workflow");
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
const insertFields = [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [],
    },
];
async function chatHubVectorStorePineconeApiConnectionTest(credential) {
    const credentials = credential.data;
    try {
        const client = new pinecone_2.Pinecone({ apiKey: credentials.apiKey });
        const indexes = ((await client.listIndexes()).indexes ?? []).map((i) => i.name);
        if (!indexes.includes(credentials.pineconeIndex)) {
            return {
                status: 'Error',
                message: `Index "${credentials.pineconeIndex}" not found. Please create the index first or check the index name.`,
            };
        }
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
    const { filter } = (typeof payload === 'string' ? (0, n8n_workflow_1.jsonParse)(payload) : (payload ?? {}));
    const credentials = await this.getCredentials('chatHubVectorStorePineconeApi');
    const namespaceName = (0, userScoped_1.getUserScopedSlot)(this, credentials.namespacePrefix);
    const client = new pinecone_2.Pinecone({ apiKey: credentials.apiKey });
    const pineconeIndex = client.Index(credentials.pineconeIndex);
    const namespace = pineconeIndex.namespace(namespaceName);
    if (!filter || Object.keys(filter).length === 0) {
        await namespace.deleteAll();
    }
    else {
        await namespace.deleteMany(filter);
    }
    return null;
}
class ChatHubVectorStorePinecone extends (0, ai_utilities_1.createVectorStoreNode)({
    meta: {
        displayName: 'ChatHub Pinecone Vector Store',
        name: 'chatHubVectorStorePinecone',
        description: 'Internal-use vector store for ChatHub',
        icon: {
            light: 'file:../VectorStorePinecone/pinecone.svg',
            dark: 'file:../VectorStorePinecone/pinecone.dark.svg',
        },
        docsUrl: 'https://docs.n8n.io',
        credentials: [
            {
                name: 'chatHubVectorStorePineconeApi',
                required: true,
                testedBy: 'chatHubVectorStorePineconeApiConnectionTest',
            },
        ],
        operationModes: ['load', 'insert', 'retrieve', 'retrieve-as-tool'],
    },
    hidden: true,
    methods: {
        credentialTest: { chatHubVectorStorePineconeApiConnectionTest },
        actionHandler: { deleteDocuments },
    },
    sharedFields: [],
    retrieveFields,
    loadFields: retrieveFields,
    insertFields,
    async getVectorStoreClient(context, filter, embeddings, itemIndex) {
        const credentials = await context.getCredentials('chatHubVectorStorePineconeApi');
        const namespaceName = (0, userScoped_1.getUserScopedSlot)(context, credentials.namespacePrefix, itemIndex);
        const client = new pinecone_2.Pinecone({ apiKey: credentials.apiKey });
        const pineconeIndex = client.Index(credentials.pineconeIndex);
        const config = {
            namespace: namespaceName,
            pineconeIndex,
            filter,
        };
        const store = await pinecone_1.PineconeStore.fromExistingIndex(embeddings, config);
        const originalSearch = store.similaritySearchVectorWithScore.bind(store);
        store.similaritySearchVectorWithScore = async (...args) => {
            const results = await originalSearch(...args);
            return results.map(([doc, score]) => [
                { ...doc, metadata: (0, chatHub_1.filterChatHubMetadata)(doc.metadata, chatHub_1.CHAT_HUB_RETRIEVE_METADATA_KEYS) },
                score,
            ]);
        };
        return store;
    },
    async populateVectorStore(context, embeddings, documents, itemIndex) {
        const credentials = await context.getCredentials('chatHubVectorStorePineconeApi');
        const namespaceName = (0, userScoped_1.getUserScopedSlot)(context, credentials.namespacePrefix, itemIndex);
        const client = new pinecone_2.Pinecone({ apiKey: credentials.apiKey });
        const indexes = ((await client.listIndexes()).indexes ?? []).map((i) => i.name);
        if (!indexes.includes(credentials.pineconeIndex)) {
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), `Index ${credentials.pineconeIndex} not found`, {
                itemIndex,
                description: 'Please check that the index exists in your Pinecone account',
            });
        }
        const pineconeIndex = client.Index(credentials.pineconeIndex);
        await pinecone_1.PineconeStore.fromDocuments((0, chatHub_1.filterChatHubInsertDocuments)(documents), embeddings, {
            namespace: namespaceName,
            pineconeIndex,
        });
    },
}) {
}
exports.ChatHubVectorStorePinecone = ChatHubVectorStorePinecone;
//# sourceMappingURL=ChatHubVectorStorePinecone.node.js.map