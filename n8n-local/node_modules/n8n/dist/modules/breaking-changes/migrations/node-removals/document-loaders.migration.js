"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonInputLoaderToDefaultDataLoader = exports.binaryInputLoaderToDefaultDataLoader = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const node_migration_1 = require("../node-migration");
const parameter_readers_1 = require("../parameter-readers");
const DEFAULT_DATA_LOADER_TYPE = '@n8n/n8n-nodes-langchain.documentDefaultDataLoader';
const DEFAULT_DATA_LOADER_VERSION = 1.1;
function binaryLoaderOptions(node) {
    const { parameters } = node;
    const loader = (0, parameter_readers_1.readString)(parameters, 'loader', 'jsonLoader', 'Loader Type');
    const metadata = (0, parameter_readers_1.pickDefined)((0, parameter_readers_1.readOptions)(parameters), ['metadata']);
    switch (loader) {
        case 'pdfLoader':
            return { splitPages: parameters.splitPages ?? true, ...metadata };
        case 'csvLoader':
            return {
                column: parameters.column ?? '',
                separator: parameters.separator ?? ',',
                ...metadata,
            };
        case 'jsonLoader':
            return { pointers: parameters.pointers ?? '', ...metadata };
        default:
            return metadata;
    }
}
exports.binaryInputLoaderToDefaultDataLoader = {
    ruleId: 'binary-input-loader-removed-v3',
    migrate: (node) => ({
        node: {
            type: DEFAULT_DATA_LOADER_TYPE,
            typeVersion: DEFAULT_DATA_LOADER_VERSION,
            parameters: {
                dataType: 'binary',
                binaryMode: 'allInputData',
                loader: (0, parameter_readers_1.readString)(node.parameters, 'loader', 'jsonLoader', 'Loader Type'),
                ...(0, parameter_readers_1.pickDefined)(node.parameters, ['binaryDataKey']),
                textSplittingMode: 'custom',
                options: binaryLoaderOptions(node),
            },
        },
    }),
};
function nodesWithTextSplitter(connections) {
    const names = new Set();
    for (const byType of Object.values(connections)) {
        for (const group of byType[n8n_workflow_1.NodeConnectionTypes.AiTextSplitter] ?? []) {
            for (const connection of group ?? [])
                names.add(connection.node);
        }
    }
    return names;
}
exports.jsonInputLoaderToDefaultDataLoader = {
    ruleId: 'json-input-loader-removed-v3',
    migrateWorkflow: ({ nodes, connections, affectedNodeIds }) => {
        const withSplitter = nodesWithTextSplitter(connections);
        const migrated = (0, node_migration_1.replaceAffectedNodes)(nodes, affectedNodeIds, (node) => {
            if (!withSplitter.has(node.name)) {
                throw new Error('This JSON Input Loader has no text splitter. Default Data Loader always splits the text, so the node cannot be migrated automatically.');
            }
            const options = (0, parameter_readers_1.pickDefined)((0, parameter_readers_1.readOptions)(node.parameters), ['metadata']);
            return {
                ...node,
                type: DEFAULT_DATA_LOADER_TYPE,
                typeVersion: DEFAULT_DATA_LOADER_VERSION,
                parameters: {
                    dataType: 'json',
                    jsonMode: 'allInputData',
                    textSplittingMode: 'custom',
                    options: { ...(0, parameter_readers_1.pickDefined)(node.parameters, ['pointers']), ...options },
                },
            };
        });
        return { ...migrated, connections };
    },
};
//# sourceMappingURL=document-loaders.migration.js.map