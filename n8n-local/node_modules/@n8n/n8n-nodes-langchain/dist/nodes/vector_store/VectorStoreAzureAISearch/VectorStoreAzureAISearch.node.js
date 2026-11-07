"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreAzureAISearch = exports.getIndexName = exports.SEMANTIC_CONFIGURATION = exports.FILTER = exports.QUERY_TYPE = exports.INDEX_NAME = exports.AZURE_AI_SEARCH_CREDENTIALS = void 0;
exports.clearAzureSearchIndex = clearAzureSearchIndex;
exports.transformDocumentsForAzure = transformDocumentsForAzure;
const search_documents_1 = require("@azure/search-documents");
const azure_aisearch_1 = require("@langchain/community/vectorstores/azure_aisearch");
const n8n_workflow_1 = require("n8n-workflow");
const ai_utilities_1 = require("@n8n/ai-utilities");
const USER_AGENT_PREFIX = 'n8n-azure-ai-search';
exports.AZURE_AI_SEARCH_CREDENTIALS = 'azureAiSearchApi';
exports.INDEX_NAME = 'indexName';
exports.QUERY_TYPE = 'queryType';
exports.FILTER = 'filter';
exports.SEMANTIC_CONFIGURATION = 'semanticConfiguration';
const indexNameField = {
    displayName: 'Index Name',
    name: exports.INDEX_NAME,
    type: 'string',
    default: 'n8n-vectorstore',
    description: 'The name of the Azure AI Search index. Will be created automatically if it does not exist.',
    required: true,
};
const queryTypeField = {
    displayName: 'Query Type',
    name: exports.QUERY_TYPE,
    type: 'options',
    default: 'hybrid',
    description: 'The type of search query to perform',
    options: [
        {
            name: 'Vector',
            value: 'vector',
            description: 'Vector similarity search only',
        },
        {
            name: 'Hybrid',
            value: 'hybrid',
            description: 'Combines vector and keyword search (recommended)',
        },
        {
            name: 'Semantic Hybrid',
            value: 'semanticHybrid',
            description: 'Hybrid search with semantic ranking (requires Basic tier or higher)',
        },
    ],
};
const filterField = {
    displayName: 'Filter',
    name: exports.FILTER,
    type: 'string',
    default: '',
    description: 'Filter results using OData syntax. Use metadata/fieldName for metadata fields. <a href="https://learn.microsoft.com/en-us/azure/search/search-query-odata-filter" target="_blank">Learn more</a>.',
    placeholder: "metadata/category eq 'technology' and metadata/author eq 'John'",
};
const semanticConfigurationField = {
    displayName: 'Semantic Configuration',
    name: exports.SEMANTIC_CONFIGURATION,
    type: 'string',
    default: '',
    description: 'Name of the semantic configuration for semantic ranking (optional)',
    displayOptions: {
        show: {
            [exports.QUERY_TYPE]: ['semanticHybrid'],
        },
    },
};
const sharedFields = [indexNameField];
const retrieveFields = [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [queryTypeField, filterField, semanticConfigurationField],
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
                displayName: 'Clear Index',
                name: 'clearIndex',
                type: 'boolean',
                default: false,
                description: 'Whether to delete and recreate the index before inserting new data. Warning: This will reset any custom index configuration (semantic ranking, analyzers, etc.) to defaults.',
            },
            {
                displayName: 'Metadata Keys to Insert',
                name: 'metadataKeysToInsert',
                type: 'string',
                default: '',
                placeholder: 'e.g., source,author,category',
                description: 'Comma-separated list of metadata keys to store in Azure AI Search. Leave empty to include all metadata. Azure AI Search stores metadata in an "attributes" array format.',
            },
        ],
    },
];
function isExecutionContext(context) {
    return 'addInputData' in context;
}
function getParameter(key, context, itemIndex) {
    let value;
    if (isExecutionContext(context)) {
        value = context.getNodeParameter(key, itemIndex, '', { extractValue: true });
    }
    else {
        value = context.getNodeParameter(key, '', { extractValue: true });
    }
    if (typeof value !== 'string') {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), `Parameter ${key} must be a string`);
    }
    return value;
}
exports.getIndexName = getParameter.bind(null, exports.INDEX_NAME);
function getOptionValue(name, context, itemIndex, defaultValue) {
    const options = context.getNodeParameter('options', itemIndex, {});
    return options[name] !== undefined ? options[name] : defaultValue;
}
async function getValidatedCredentials(context, itemIndex) {
    const credentials = await context.getCredentials(exports.AZURE_AI_SEARCH_CREDENTIALS);
    if (!credentials.endpoint || typeof credentials.endpoint !== 'string') {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Azure AI Search endpoint is missing or invalid', { itemIndex });
    }
    if (!credentials.apiKey || typeof credentials.apiKey !== 'string') {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'API Key is required for authentication', {
            itemIndex,
        });
    }
    return {
        endpoint: credentials.endpoint,
        apiKey: credentials.apiKey,
    };
}
async function clearAzureSearchIndex(context, itemIndex) {
    const options = context.getNodeParameter('options', itemIndex, {});
    if (!options.clearIndex) {
        return false;
    }
    const credentials = await getValidatedCredentials(context, itemIndex);
    const indexName = (0, exports.getIndexName)(context, itemIndex);
    try {
        const indexClient = new search_documents_1.SearchIndexClient(credentials.endpoint, new search_documents_1.AzureKeyCredential(credentials.apiKey));
        await indexClient.deleteIndex(indexName);
        context.logger.debug(`Deleted Azure AI Search index: ${indexName}`);
        return true;
    }
    catch (deleteError) {
        context.logger.debug('Error deleting index (may not exist):', {
            message: deleteError instanceof Error ? deleteError.message : String(deleteError),
        });
        return false;
    }
}
async function getAzureAISearchClient(context, embeddings, itemIndex) {
    const credentials = await getValidatedCredentials(context, itemIndex);
    try {
        const indexName = (0, exports.getIndexName)(context, itemIndex);
        const azureCredentials = new search_documents_1.AzureKeyCredential(credentials.apiKey);
        const config = {
            endpoint: credentials.endpoint,
            indexName,
            credentials: azureCredentials,
            search: {},
            clientOptions: {
                userAgentOptions: { userAgentPrefix: USER_AGENT_PREFIX },
            },
        };
        if (isExecutionContext(context)) {
            const queryType = getQueryType(context, itemIndex);
            const semanticConfiguration = getOptionValue('semanticConfiguration', context, itemIndex);
            const filter = getOptionValue('filter', context, itemIndex);
            config.search.type = queryType;
            if (filter) {
                config.search.filter = filter;
            }
            if (queryType === azure_aisearch_1.AzureAISearchQueryType.SemanticHybrid && semanticConfiguration) {
                config.search.semanticConfigurationName = semanticConfiguration;
            }
        }
        return new azure_aisearch_1.AzureAISearchVectorStore(embeddings, config);
    }
    catch (error) {
        if (error instanceof n8n_workflow_1.NodeOperationError) {
            throw error;
        }
        context.logger.debug('Azure AI Search connection error:', {
            message: error instanceof Error ? error.message : String(error),
            code: error.code,
            statusCode: error.statusCode,
            details: error.details,
        });
        if (error.message?.includes('401') ||
            error.message?.includes('Unauthorized') ||
            error.message?.includes('authentication failed')) {
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Authentication failed - invalid API key or endpoint.', {
                itemIndex,
                description: 'Please verify your API Key and Search Endpoint are correct in the credentials configuration.',
            });
        }
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Authorization failed - insufficient permissions.', {
                itemIndex,
                description: 'The API Key does not have sufficient permissions. Ensure the key has the required access level for this operation.',
            });
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), `Error: ${errorMessage}`, {
            itemIndex,
            description: 'Please check your Azure AI Search connection details',
        });
    }
}
function getQueryType(context, itemIndex) {
    const queryType = getOptionValue('queryType', context, itemIndex, 'hybrid');
    switch (queryType) {
        case 'vector':
            return azure_aisearch_1.AzureAISearchQueryType.Similarity;
        case 'hybrid':
            return azure_aisearch_1.AzureAISearchQueryType.SimilarityHybrid;
        case 'semanticHybrid':
            return azure_aisearch_1.AzureAISearchQueryType.SemanticHybrid;
        default:
            return azure_aisearch_1.AzureAISearchQueryType.SimilarityHybrid;
    }
}
function transformDocumentsForAzure(documents, metadataKeysToInclude) {
    return documents.map((doc) => {
        const originalMetadata = doc.metadata;
        const keysToProcess = metadataKeysToInclude.length > 0 ? metadataKeysToInclude : Object.keys(originalMetadata);
        const attributes = keysToProcess
            .filter((key) => Object.prototype.hasOwnProperty.call(originalMetadata, key) &&
            originalMetadata[key] !== null &&
            originalMetadata[key] !== undefined)
            .map((key) => ({
            key,
            value: String(originalMetadata[key]),
        }));
        return {
            ...doc,
            metadata: {
                ...originalMetadata,
                attributes,
            },
        };
    });
}
class VectorStoreAzureAISearch extends (0, ai_utilities_1.createVectorStoreNode)({
    meta: {
        displayName: 'Azure AI Search Vector Store',
        name: 'vectorStoreAzureAISearch',
        description: 'Work with your data in Azure AI Search Vector Store',
        icon: { light: 'file:azure-aisearch.svg', dark: 'file:azure-aisearch.svg' },
        docsUrl: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreazureaisearch/',
        credentials: [
            {
                name: 'azureAiSearchApi',
                required: true,
            },
        ],
        operationModes: ['load', 'insert', 'retrieve', 'update', 'retrieve-as-tool'],
    },
    sharedFields,
    retrieveFields,
    loadFields: retrieveFields,
    insertFields,
    async beforeInsert(context, _embeddings, itemIndex) {
        await clearAzureSearchIndex(context, itemIndex);
    },
    async getVectorStoreClient(context, _filter, embeddings, itemIndex) {
        const vectorStore = await getAzureAISearchClient(context, embeddings, itemIndex);
        if (isExecutionContext(context)) {
            const filter = getOptionValue('filter', context, itemIndex);
            if (filter) {
                const filterObject = { filterExpression: filter };
                const originalSearchVectorWithScore = vectorStore.similaritySearchVectorWithScore.bind(vectorStore);
                vectorStore.similaritySearchVectorWithScore = async (query, k, additionalFilter) => {
                    const mergedFilter = additionalFilter
                        ? { ...filterObject, ...additionalFilter }
                        : filterObject;
                    return await originalSearchVectorWithScore(query, k, mergedFilter);
                };
                const originalSearch = vectorStore.similaritySearch.bind(vectorStore);
                vectorStore.similaritySearch = async (query, k) => {
                    return await originalSearch(query, k, filterObject);
                };
                const originalSearchWithScore = vectorStore.similaritySearchWithScore.bind(vectorStore);
                vectorStore.similaritySearchWithScore = async (query, k) => {
                    return await originalSearchWithScore(query, k, filterObject);
                };
                const originalAsRetriever = vectorStore.asRetriever.bind(vectorStore);
                vectorStore.asRetriever = (kwargs) => {
                    return originalAsRetriever({
                        ...kwargs,
                        filter: filterObject,
                    });
                };
            }
        }
        return vectorStore;
    },
    async populateVectorStore(context, embeddings, documents, itemIndex) {
        try {
            const metadataKeysToInsertRaw = getOptionValue('metadataKeysToInsert', context, itemIndex);
            const metadataKeysToInsert = metadataKeysToInsertRaw
                ? metadataKeysToInsertRaw
                    .split(',')
                    .map((k) => k.trim())
                    .filter((k) => k.length > 0)
                : [];
            const transformedDocuments = transformDocumentsForAzure(documents, metadataKeysToInsert);
            const vectorStore = await getAzureAISearchClient(context, embeddings, itemIndex);
            await vectorStore.addDocuments(transformedDocuments);
        }
        catch (error) {
            context.logger.debug('Azure AI Search error details:', {
                message: error instanceof Error ? error.message : String(error),
                code: error.code,
                statusCode: error.statusCode,
                details: error.details,
                stack: error instanceof Error ? error.stack : undefined,
            });
            if (error.message?.includes('401') ||
                error.message?.includes('Unauthorized') ||
                error.message?.includes('authentication failed')) {
                throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Authentication failed during document upload - invalid API key or endpoint.', {
                    itemIndex,
                    description: 'Please verify your API Key and Search Endpoint are correct in the credentials configuration.',
                });
            }
            if (error.message?.includes('403') ||
                error.message?.includes('Forbidden') ||
                error.statusCode === 403) {
                throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Authorization failed - insufficient permissions for document upload.', {
                    itemIndex,
                    description: 'The API Key does not have sufficient permissions for write operations. Ensure the key has the required access level.',
                });
            }
            if (error.name === 'RestError' || error.message?.includes('RestError')) {
                const statusCode = error.statusCode || 'unknown';
                const errorCode = error.code || 'unknown';
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new n8n_workflow_1.NodeOperationError(context.getNode(), `Azure AI Search API error (${statusCode}): ${errorMessage}`, {
                    itemIndex,
                    description: `Error code: ${errorCode}\n\nCommon causes:\n- Invalid endpoint URL\n- Index doesn't exist\n- Authentication/authorization issues\n- API version mismatch\n\nCheck the console logs for detailed error information.`,
                });
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), `Error: ${errorMessage}`, {
                itemIndex,
                description: 'Please check your Azure AI Search connection details and index configuration',
            });
        }
    },
}) {
}
exports.VectorStoreAzureAISearch = VectorStoreAzureAISearch;
//# sourceMappingURL=VectorStoreAzureAISearch.node.js.map