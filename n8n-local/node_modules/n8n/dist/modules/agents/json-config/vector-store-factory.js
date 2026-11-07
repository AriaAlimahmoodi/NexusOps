"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildVectorStoreBackend = buildVectorStoreBackend;
exports.buildVectorStore = buildVectorStore;
const agents_1 = require("@n8n/agents");
const n8n_workflow_1 = require("n8n-workflow");
const embedding_credential_1 = require("./embedding-credential");
function requireCredentialField(credential, field, credentialLabel) {
    const value = credential[field];
    if (typeof value !== 'string' || value.length === 0) {
        throw new n8n_workflow_1.UserError(`${credentialLabel} credential is missing "${field}"`);
    }
    return value;
}
function optionalCredentialField(credential, field) {
    const value = credential[field];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function credentialFieldWithDefault(credential, field, defaultValue) {
    return optionalCredentialField(credential, field) ?? defaultValue;
}
async function buildPostgresBackend(config, credential) {
    if (credential.sshTunnel === true) {
        throw new n8n_workflow_1.UserError('SSH tunnel Postgres credentials are not supported for vector stores');
    }
    const host = credentialFieldWithDefault(credential, 'host', 'localhost');
    const database = credentialFieldWithDefault(credential, 'database', 'postgres');
    const user = credentialFieldWithDefault(credential, 'user', 'postgres');
    const password = optionalCredentialField(credential, 'password') ?? '';
    const port = typeof credential.port === 'number'
        ? credential.port
        : Number(optionalCredentialField(credential, 'port') ?? 5432);
    const ssl = credential.ssl;
    const allowUnauthorizedCerts = credential.allowUnauthorizedCerts === true;
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    const encodedDatabase = encodeURIComponent(database);
    let connectionString = `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${encodedDatabase}`;
    if (allowUnauthorizedCerts) {
        connectionString += '?sslmode=no-verify';
    }
    else if (ssl === 'require') {
        connectionString += '?sslmode=require';
    }
    const { PgVectorStore } = await import('@n8n/agents/vector-stores/postgres');
    return new PgVectorStore(config.name, {
        connectionString,
        tableName: config.tableName,
        connectionTimeoutMillis: 10_000,
    });
}
async function buildBackend(config, credential) {
    switch (config.provider) {
        case 'pinecone': {
            const apiKey = requireCredentialField(credential, 'apiKey', 'Pinecone');
            const { PineconeVectorStore } = await import('@n8n/agents/vector-stores/pinecone');
            return new PineconeVectorStore(config.name, {
                apiKey,
                indexName: config.indexName,
                ...(config.namespace ? { namespace: config.namespace } : {}),
            });
        }
        case 'qdrant': {
            const url = requireCredentialField(credential, 'qdrantUrl', 'Qdrant');
            const apiKey = optionalCredentialField(credential, 'apiKey');
            const { QdrantVectorStore } = await import('@n8n/agents/vector-stores/qdrant');
            return new QdrantVectorStore(config.name, {
                url,
                ...(apiKey ? { apiKey } : {}),
                collectionName: config.collectionName,
            });
        }
        case 'supabase': {
            const url = requireCredentialField(credential, 'host', 'Supabase');
            const apiKey = requireCredentialField(credential, 'serviceRole', 'Supabase');
            const { SupabaseVectorStore } = await import('@n8n/agents/vector-stores/supabase');
            return new SupabaseVectorStore(config.name, {
                url,
                apiKey,
                tableName: config.tableName,
                ...(config.queryName ? { queryName: config.queryName } : {}),
            });
        }
        case 'postgres':
            return await buildPostgresBackend(config, credential);
    }
}
async function buildVectorStoreBackend(config, credentialProvider, resolvedCredential) {
    if (!config.credential) {
        throw new n8n_workflow_1.UserError(`Vector store "${config.name}" has no credential configured`);
    }
    const credential = resolvedCredential ?? (await credentialProvider.resolve(config.credential));
    return await buildBackend(config, credential);
}
async function buildVectorStore(config, credentialProvider) {
    if (!config.embedding.credential) {
        throw new n8n_workflow_1.UserError(`Vector store "${config.name}" has no embedding credential configured`);
    }
    const backend = await buildVectorStoreBackend(config, credentialProvider);
    const embeddingOptions = await (0, embedding_credential_1.resolveEmbeddingProviderOptionsFromCredential)(config.embedding.credential, config.embedding.model, credentialProvider);
    return new agents_1.VectorStore(config.name)
        .store(backend)
        .embeddingModel(config.embedding.model, embeddingOptions);
}
//# sourceMappingURL=vector-store-factory.js.map