"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentVectorStoresService = void 0;
const agents_1 = require("@n8n/agents");
const di_1 = require("@n8n/di");
const credentials_service_1 = require("../../credentials/credentials.service");
const agents_credential_provider_1 = require("./adapters/agents-credential-provider");
const embedding_credential_1 = require("./json-config/embedding-credential");
const vector_store_factory_1 = require("./json-config/vector-store-factory");
const TEST_QUERY = 'n8n connection test';
const TEST_TIMEOUT_MS = 15_000;
const MAX_MESSAGE_LENGTH = 500;
function errorMessage(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.length > MAX_MESSAGE_LENGTH ? `${message.slice(0, MAX_MESSAGE_LENGTH)}…` : message;
}
async function withTimeout(work, timeoutMs) {
    let timer;
    const timeout = new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Connection test timed out')), timeoutMs);
    });
    try {
        return await Promise.race([work(), timeout]);
    }
    finally {
        clearTimeout(timer);
    }
}
async function checkPineconeIndex(config, apiKey, actualDimensions) {
    const none = { failure: null, warning: null };
    if (typeof apiKey !== 'string' || !apiKey)
        return none;
    try {
        const { Pinecone } = await import('@pinecone-database/pinecone');
        const pc = new Pinecone({ apiKey });
        const index = await pc.describeIndex(config.indexName);
        const expected = index.dimension;
        if (typeof expected === 'number' && expected !== actualDimensions) {
            return {
                failure: `Index "${config.indexName}" expects ${expected} dimensions but model "${config.embedding.model}" produces ${actualDimensions}.`,
                warning: null,
            };
        }
        if (!config.namespace)
            return none;
        const stats = await pc.index(config.indexName).describeIndexStats();
        if (!(config.namespace in (stats.namespaces ?? {}))) {
            return {
                failure: null,
                warning: `Namespace "${config.namespace}" has no data yet in index "${config.indexName}". It will appear once data is indexed — double-check the name if you expected existing data.`,
            };
        }
    }
    catch {
    }
    return none;
}
function readVectorSize(value) {
    if (!value || typeof value !== 'object')
        return undefined;
    if ('size' in value && typeof value.size === 'number')
        return value.size;
    return undefined;
}
function extractQdrantVectorSize(vectorsConfig) {
    if (!vectorsConfig || typeof vectorsConfig !== 'object')
        return undefined;
    const direct = readVectorSize(vectorsConfig);
    if (direct !== undefined)
        return direct;
    const [firstNamedVector] = Object.values(vectorsConfig);
    return readVectorSize(firstNamedVector);
}
async function checkQdrantDimension(config, url, apiKey, actualDimensions) {
    if (typeof url !== 'string' || !url)
        return null;
    try {
        const { QdrantClient } = await import('@qdrant/js-client-rest');
        const client = new QdrantClient({
            url,
            ...(typeof apiKey === 'string' && apiKey ? { apiKey } : {}),
        });
        const collection = await client.getCollection(config.collectionName);
        const expected = extractQdrantVectorSize(collection.config?.params?.vectors);
        if (typeof expected === 'number' && expected !== actualDimensions) {
            return `Collection "${config.collectionName}" expects ${expected} dimensions but model "${config.embedding.model}" produces ${actualDimensions}.`;
        }
    }
    catch {
    }
    return null;
}
let AgentVectorStoresService = class AgentVectorStoresService {
    constructor(credentialsService) {
        this.credentialsService = credentialsService;
    }
    async testConnection(projectId, user, vectorStore) {
        const credentialProvider = new agents_credential_provider_1.AgentsCredentialProvider(this.credentialsService, projectId, user);
        let backend;
        let settled = false;
        const closeBackend = () => {
            if (backend)
                void Promise.resolve(backend.close?.()).catch(() => { });
        };
        try {
            return await withTimeout(async () => {
                const rawCredential = await credentialProvider.resolve(vectorStore.credential);
                backend = await (0, vector_store_factory_1.buildVectorStoreBackend)(vectorStore, credentialProvider, rawCredential);
                if (settled) {
                    closeBackend();
                    throw new Error('Connection test timed out');
                }
                return await this.probeBackend(vectorStore, credentialProvider, rawCredential, backend);
            }, TEST_TIMEOUT_MS);
        }
        catch (error) {
            return { success: false, message: errorMessage(error) };
        }
        finally {
            settled = true;
            closeBackend();
        }
    }
    async checkProviderCompatibility(vectorStore, rawCredential, actualDimensions) {
        switch (vectorStore.provider) {
            case 'pinecone':
                return await checkPineconeIndex(vectorStore, rawCredential.apiKey, actualDimensions);
            case 'qdrant':
                return {
                    failure: await checkQdrantDimension(vectorStore, rawCredential.qdrantUrl, rawCredential.apiKey, actualDimensions),
                    warning: null,
                };
            case 'supabase':
            case 'postgres':
                return { failure: null, warning: null };
        }
    }
    async embedTestQuery(vectorStore, credentialProvider) {
        const embeddingOptions = await (0, embedding_credential_1.resolveEmbeddingProviderOptionsFromCredential)(vectorStore.embedding.credential, vectorStore.embedding.model, credentialProvider);
        const embeddingModel = (0, agents_1.createEmbeddingModel)(vectorStore.embedding.model, embeddingOptions);
        const { embed } = await import('ai');
        const { embedding } = await embed({ model: embeddingModel, value: TEST_QUERY });
        return embedding;
    }
    async probeBackend(vectorStore, credentialProvider, rawCredential, backend) {
        const embedding = await this.embedTestQuery(vectorStore, credentialProvider);
        const { failure, warning } = await this.checkProviderCompatibility(vectorStore, rawCredential, embedding.length);
        if (failure) {
            return { success: false, message: failure };
        }
        await backend.query(embedding, { topK: 1 });
        return { success: true, ...(warning ? { warning } : {}) };
    }
};
exports.AgentVectorStoresService = AgentVectorStoresService;
exports.AgentVectorStoresService = AgentVectorStoresService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService])
], AgentVectorStoresService);
//# sourceMappingURL=agent-vector-stores.service.js.map