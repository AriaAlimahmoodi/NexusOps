"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chromaCollectionRLC = exports.weaviateCollectionRLC = exports.milvusCollectionRLC = exports.qdrantCollectionRLC = exports.supabaseTableNameRLC = exports.pineconeIndexRLC = void 0;
exports.pineconeIndexRLC = {
    displayName: 'Pinecone Index',
    name: 'pineconeIndex',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    modes: [
        {
            displayName: 'From List',
            name: 'list',
            type: 'list',
            typeOptions: {
                searchListMethod: 'pineconeIndexSearch',
            },
        },
        {
            displayName: 'ID',
            name: 'id',
            type: 'string',
        },
    ],
};
exports.supabaseTableNameRLC = {
    displayName: 'Table Name',
    name: 'tableName',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    modes: [
        {
            displayName: 'From List',
            name: 'list',
            type: 'list',
            typeOptions: {
                searchListMethod: 'supabaseTableNameSearch',
            },
        },
        {
            displayName: 'ID',
            name: 'id',
            type: 'string',
        },
    ],
};
exports.qdrantCollectionRLC = {
    displayName: 'Qdrant Collection',
    name: 'qdrantCollection',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    modes: [
        {
            displayName: 'From List',
            name: 'list',
            type: 'list',
            typeOptions: {
                searchListMethod: 'qdrantCollectionsSearch',
            },
        },
        {
            displayName: 'ID',
            name: 'id',
            type: 'string',
        },
    ],
};
exports.milvusCollectionRLC = {
    displayName: 'Milvus Collection',
    name: 'milvusCollection',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    modes: [
        {
            displayName: 'From List',
            name: 'list',
            type: 'list',
            typeOptions: {
                searchListMethod: 'milvusCollectionsSearch',
            },
        },
        {
            displayName: 'ID',
            name: 'id',
            type: 'string',
        },
    ],
};
exports.weaviateCollectionRLC = {
    displayName: 'Weaviate Collection',
    name: 'weaviateCollection',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    modes: [
        {
            displayName: 'From List',
            name: 'list',
            type: 'list',
            typeOptions: {
                searchListMethod: 'weaviateCollectionsSearch',
            },
        },
        {
            displayName: 'ID',
            name: 'id',
            type: 'string',
        },
    ],
};
exports.chromaCollectionRLC = {
    displayName: 'Chroma Collection',
    name: 'chromaCollection',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    modes: [
        {
            displayName: 'From List',
            name: 'list',
            type: 'list',
            typeOptions: {
                searchListMethod: 'chromaCollectionsSearch',
            },
        },
        {
            displayName: 'ID',
            name: 'id',
            type: 'string',
        },
    ],
};
//# sourceMappingURL=descriptions.js.map