"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreRedis = exports.redisConfig = void 0;
exports.getRedisClient = getRedisClient;
exports.listIndexes = listIndexes;
exports.getParameter = getParameter;
exports.getParameterAsNumber = getParameterAsNumber;
const redis_1 = require("@langchain/redis");
const n8n_workflow_1 = require("n8n-workflow");
const redis_2 = require("redis");
const ai_utilities_1 = require("@n8n/ai-utilities");
const REDIS_CREDENTIALS = 'redis';
const REDIS_INDEX_NAME = 'redisIndex';
const REDIS_KEY_PREFIX = 'keyPrefix';
const REDIS_OVERWRITE_DOCUMENTS = 'overwriteDocuments';
const REDIS_METADATA_KEY = 'metadataKey';
const REDIS_METADATA_FILTER = 'metadataFilter';
const REDIS_CONTENT_KEY = 'contentKey';
const REDIS_EMBEDDING_KEY = 'vectorKey';
const REDIS_TTL = 'ttl';
const redisIndexRLC = {
    displayName: 'Redis Index',
    name: REDIS_INDEX_NAME,
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    modes: [
        {
            displayName: 'From List',
            name: 'list',
            type: 'list',
            typeOptions: {
                searchListMethod: 'redisIndexSearch',
            },
        },
        {
            displayName: 'ID',
            name: 'id',
            type: 'string',
        },
    ],
};
const metadataFilterField = {
    displayName: 'Metadata Filter',
    name: REDIS_METADATA_FILTER,
    type: 'string',
    description: 'The comma-separated list of words by which to apply additional full-text metadata filtering',
    placeholder: 'Item1,Item2,Item3',
    default: '',
};
const metadataKeyField = {
    displayName: 'Metadata Key',
    name: REDIS_METADATA_KEY,
    type: 'string',
    description: 'The hash key to be used to store the metadata of the document',
    placeholder: 'metadata',
    default: '',
};
const contentKeyField = {
    displayName: 'Content Key',
    name: REDIS_CONTENT_KEY,
    type: 'string',
    description: 'The hash key to be used to store the content of the document',
    placeholder: 'content',
    default: '',
};
const embeddingKeyField = {
    displayName: 'Embedding Key',
    name: REDIS_EMBEDDING_KEY,
    type: 'string',
    description: 'The hash key to be used to store the embedding of the document',
    placeholder: 'content_vector',
    default: '',
};
const overwriteDocuments = {
    displayName: 'Overwrite Documents',
    name: REDIS_OVERWRITE_DOCUMENTS,
    type: 'boolean',
    description: 'Whether existing documents and the index should be overwritten',
    default: false,
};
const keyPrefixField = {
    displayName: 'Key Prefix',
    name: REDIS_KEY_PREFIX,
    type: 'string',
    description: 'Prefix for Redis keys storing the documents',
    placeholder: 'doc',
    default: '',
};
const ttlField = {
    displayName: 'Time-To-Live',
    name: REDIS_TTL,
    description: 'Time-to-live for the documents in seconds',
    placeholder: '0',
    type: 'number',
    default: '',
};
const sharedFields = [redisIndexRLC];
const insertFields = [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
            keyPrefixField,
            overwriteDocuments,
            metadataKeyField,
            contentKeyField,
            embeddingKeyField,
            ttlField,
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
            metadataFilterField,
            keyPrefixField,
            metadataKeyField,
            contentKeyField,
            embeddingKeyField,
        ],
    },
];
exports.redisConfig = {
    client: null,
    connectionString: '',
};
async function getRedisClient(context) {
    const credentials = await context.getCredentials(REDIS_CREDENTIALS);
    const config = {
        socket: {
            host: credentials.host || 'localhost',
            port: credentials.port || 6379,
            tls: credentials.ssl === true,
        },
        username: credentials.user,
        password: credentials.password,
        database: credentials.database,
        clientInfoTag: 'n8n',
    };
    if (!exports.redisConfig.client || exports.redisConfig.connectionString !== JSON.stringify(config)) {
        if (exports.redisConfig.client) {
            await exports.redisConfig.client.disconnect();
        }
        exports.redisConfig.connectionString = JSON.stringify(config);
        exports.redisConfig.client = (0, redis_2.createClient)(config);
        if (exports.redisConfig.client) {
            exports.redisConfig.client.on('error', (error) => {
                context.logger.error(`[Redis client] ${error.message}`, { error });
            });
            await exports.redisConfig.client.connect();
        }
    }
    return exports.redisConfig.client;
}
function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
async function listIndexes() {
    const client = await getRedisClient(this);
    if (client === null) {
        return { results: [] };
    }
    try {
        const indexes = await client.ft._list();
        if (!isStringArray(indexes)) {
            this.logger.warn('FT._LIST returned unexpected data type');
            return { results: [] };
        }
        const results = indexes.map((index) => ({
            name: index,
            value: index,
        }));
        return { results };
    }
    catch (error) {
        this.logger.info('Failed to get Redis indexes: ' + error.message);
        return { results: [] };
    }
}
function getParameter(key, context, itemIndex) {
    return context.getNodeParameter(key, itemIndex, '', {
        extractValue: true,
    });
}
function getParameterAsNumber(key, context, itemIndex) {
    return context.getNodeParameter(key, itemIndex, '', {
        extractValue: true,
    });
}
class ExtendedRedisVectorSearch extends redis_1.RedisVectorStore {
    constructor(embeddings, options, filter) {
        super(embeddings, options);
        this.defaultFilter = filter;
    }
    async similaritySearchVectorWithScore(query, k) {
        return await super.similaritySearchVectorWithScore(query, k, this.defaultFilter);
    }
}
const getIndexName = getParameter.bind(null, REDIS_INDEX_NAME);
const getKeyPrefix = getParameter.bind(null, `options.${REDIS_KEY_PREFIX}`);
const getOverwrite = getParameter.bind(null, `options.${REDIS_OVERWRITE_DOCUMENTS}`);
const getContentKey = getParameter.bind(null, `options.${REDIS_CONTENT_KEY}`);
const getMetadataFilter = getParameter.bind(null, `options.${REDIS_METADATA_FILTER}`);
const getMetadataKey = getParameter.bind(null, `options.${REDIS_METADATA_KEY}`);
const getEmbeddingKey = getParameter.bind(null, `options.${REDIS_EMBEDDING_KEY}`);
const getTtl = getParameterAsNumber.bind(null, `options.${REDIS_TTL}`);
class VectorStoreRedis extends (0, ai_utilities_1.createVectorStoreNode)({
    meta: {
        displayName: 'Redis Vector Store',
        name: 'vectorStoreRedis',
        description: 'Work with your data in a Redis vector index',
        icon: { light: 'file:redis.svg', dark: 'file:redis.dark.svg' },
        docsUrl: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreredis/',
        credentials: [
            {
                name: REDIS_CREDENTIALS,
                required: true,
            },
        ],
        operationModes: ['load', 'insert', 'retrieve', 'update', 'retrieve-as-tool'],
    },
    methods: { listSearch: { redisIndexSearch: listIndexes } },
    retrieveFields,
    loadFields: retrieveFields,
    insertFields,
    sharedFields,
    async getVectorStoreClient(context, _filter, embeddings, itemIndex) {
        const client = await getRedisClient(context);
        const indexField = getIndexName(context, itemIndex).trim();
        const keyPrefixField = getKeyPrefix(context, itemIndex).trim();
        const metadataField = getMetadataKey(context, itemIndex).trim();
        const contentField = getContentKey(context, itemIndex).trim();
        const embeddingField = getEmbeddingKey(context, itemIndex).trim();
        const filter = getMetadataFilter(context, itemIndex).trim();
        if (client === null) {
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Redis client not initialized', {
                itemIndex,
                description: 'Please check your Redis connection details',
            });
        }
        try {
            await client.ft.info(indexField);
        }
        catch (error) {
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), `Index ${indexField} not found`, {
                itemIndex,
                description: 'Please check that the index exists in your Redis instance',
            });
        }
        const filterTerms = filter
            ? filter
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s)
            : [];
        return new ExtendedRedisVectorSearch(embeddings, {
            redisClient: client,
            indexName: indexField,
            ...(keyPrefixField ? { keyPrefix: keyPrefixField } : {}),
            ...(metadataField ? { metadataKey: metadataField } : {}),
            ...(contentField ? { contentKey: contentField } : {}),
            ...(embeddingField ? { vectorKey: embeddingField } : {}),
        }, filterTerms.length > 0 ? filterTerms : undefined);
    },
    async populateVectorStore(context, embeddings, documents, itemIndex) {
        const client = await getRedisClient(context);
        if (client === null) {
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Redis client not initialized', {
                itemIndex,
                description: 'Please check your Redis connection details',
            });
        }
        try {
            const indexField = getIndexName(context, itemIndex).trim();
            const overwrite = getOverwrite(context, itemIndex);
            const keyPrefixField = getKeyPrefix(context, itemIndex).trim();
            const metadataField = getMetadataKey(context, itemIndex).trim();
            const contentField = getContentKey(context, itemIndex).trim();
            const embeddingField = getEmbeddingKey(context, itemIndex).trim();
            const ttl = getTtl(context, itemIndex);
            if (overwrite) {
                await client.ft.dropIndex(indexField, { DD: true });
            }
            await ExtendedRedisVectorSearch.fromDocuments(documents, embeddings, {
                redisClient: client,
                indexName: indexField,
                ...(keyPrefixField ? { keyPrefix: keyPrefixField } : {}),
                ...(metadataField ? { metadataKey: metadataField } : {}),
                ...(contentField ? { contentKey: contentField } : {}),
                ...(embeddingField ? { vectorKey: embeddingField } : {}),
                ...(ttl ? { ttl } : {}),
            });
        }
        catch (error) {
            context.logger.info(`Error while populating the store: ${error.message}`);
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), `Error: ${error.message}`, {
                itemIndex,
                description: 'Please check your index/schema and parameters',
            });
        }
    },
}) {
}
exports.VectorStoreRedis = VectorStoreRedis;
//# sourceMappingURL=VectorStoreRedis.node.js.map