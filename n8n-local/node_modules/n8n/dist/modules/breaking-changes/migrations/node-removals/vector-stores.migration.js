"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseLoadToVectorStore = exports.supabaseInsertToVectorStore = exports.pineconeLoadToVectorStore = exports.pineconeInsertToVectorStore = exports.inMemoryLoadToVectorStore = exports.inMemoryInsertToVectorStore = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const node_migration_1 = require("../node-migration");
const parameter_readers_1 = require("../parameter-readers");
const VERSION = 1.1;
const isOff = (value) => value === undefined || value === false;
const refuseClear = (label) => new Error(`"${label}" is turned on, and the new node handles it differently. Some of your stored documents could be lost. Replace this node by hand.`);
const DOCUMENT_LOADER_TYPES = new Set([
    '@n8n/n8n-nodes-langchain.documentDefaultDataLoader',
    '@n8n/n8n-nodes-langchain.documentJsonInputLoader',
    '@n8n/n8n-nodes-langchain.documentBinaryInputLoader',
]);
function documentSourceTypes(nodeName, nodes, connections) {
    const typeByName = new Map(nodes.map(({ name, type }) => [name, type]));
    const types = [];
    for (const [source, byType] of Object.entries(connections)) {
        for (const group of byType[n8n_workflow_1.NodeConnectionTypes.AiDocument] ?? []) {
            for (const connection of group ?? []) {
                if (connection.node === nodeName)
                    types.push(typeByName.get(source) ?? 'unknown');
            }
        }
    }
    return types;
}
function insertMigration(ruleId, migrate) {
    return {
        ruleId,
        migrateWorkflow: ({ nodes, connections, affectedNodeIds }) => {
            const migrated = (0, node_migration_1.replaceAffectedNodes)(nodes, affectedNodeIds, (node) => {
                const unsupported = documentSourceTypes(node.name, nodes, connections).find((type) => !DOCUMENT_LOADER_TYPES.has(type));
                if (unsupported !== undefined) {
                    throw new Error('The documents come from a node that the migration does not support, so they could be saved more than once. Replace this node by hand.');
                }
                const { node: replacement } = migrate(node);
                return { ...node, ...replacement };
            });
            return { ...migrated, connections };
        },
    };
}
exports.inMemoryInsertToVectorStore = insertMigration('in-memory-vector-store-insert-removed-v3', (node) => {
    if (!isOff(node.parameters.clearStore))
        throw refuseClear('Clear Store');
    return {
        node: {
            type: '@n8n/n8n-nodes-langchain.vectorStoreInMemory',
            typeVersion: VERSION,
            parameters: { mode: 'insert', ...(0, parameter_readers_1.pickDefined)(node.parameters, ['memoryKey']) },
        },
    };
});
exports.inMemoryLoadToVectorStore = {
    ruleId: 'in-memory-vector-store-load-removed-v3',
    migrate: (node) => ({
        node: {
            type: '@n8n/n8n-nodes-langchain.vectorStoreInMemory',
            typeVersion: VERSION,
            parameters: { mode: 'retrieve', ...(0, parameter_readers_1.pickDefined)(node.parameters, ['memoryKey']) },
        },
    }),
};
const PINECONE_TYPE = '@n8n/n8n-nodes-langchain.vectorStorePinecone';
exports.pineconeInsertToVectorStore = insertMigration('pinecone-insert-removed-v3', (node) => {
    const { pineconeNamespace, clearNamespace } = node.parameters;
    const hasNamespace = pineconeNamespace !== undefined && pineconeNamespace !== '';
    if (hasNamespace && !isOff(clearNamespace))
        throw refuseClear('Clear Namespace');
    return {
        node: {
            type: PINECONE_TYPE,
            typeVersion: VERSION,
            parameters: {
                mode: 'insert',
                ...(0, parameter_readers_1.pickDefined)(node.parameters, ['pineconeIndex']),
                options: hasNamespace ? { pineconeNamespace } : {},
            },
        },
    };
});
exports.pineconeLoadToVectorStore = {
    ruleId: 'pinecone-load-removed-v3',
    migrate: (node) => {
        const { pineconeNamespace } = node.parameters;
        const hasNamespace = pineconeNamespace !== undefined && pineconeNamespace !== '';
        return {
            node: {
                type: PINECONE_TYPE,
                typeVersion: VERSION,
                parameters: {
                    mode: 'retrieve',
                    ...(0, parameter_readers_1.pickDefined)(node.parameters, ['pineconeIndex']),
                    options: {
                        ...(hasNamespace ? { pineconeNamespace } : {}),
                        ...(0, parameter_readers_1.pickDefined)((0, parameter_readers_1.readOptions)(node.parameters), ['metadata']),
                    },
                },
            },
        };
    },
};
const SUPABASE_TYPE = '@n8n/n8n-nodes-langchain.vectorStoreSupabase';
exports.supabaseInsertToVectorStore = insertMigration('supabase-insert-removed-v3', (node) => ({
    node: {
        type: SUPABASE_TYPE,
        typeVersion: VERSION,
        parameters: {
            mode: 'insert',
            ...(0, parameter_readers_1.pickDefined)(node.parameters, ['tableName']),
            options: (0, parameter_readers_1.pickDefined)(node.parameters, ['queryName']),
        },
    },
}));
exports.supabaseLoadToVectorStore = {
    ruleId: 'supabase-load-removed-v3',
    migrate: (node) => ({
        node: {
            type: SUPABASE_TYPE,
            typeVersion: VERSION,
            parameters: {
                mode: 'retrieve',
                ...(0, parameter_readers_1.pickDefined)(node.parameters, ['tableName']),
                options: {
                    ...(0, parameter_readers_1.pickDefined)(node.parameters, ['queryName']),
                    ...(0, parameter_readers_1.pickDefined)((0, parameter_readers_1.readOptions)(node.parameters), ['metadata']),
                },
            },
        },
    }),
};
//# sourceMappingURL=vector-stores.migration.js.map