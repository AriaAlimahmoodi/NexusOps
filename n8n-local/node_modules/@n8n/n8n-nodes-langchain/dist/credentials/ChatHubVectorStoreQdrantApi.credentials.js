"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHubVectorStoreQdrantApi = void 0;
class ChatHubVectorStoreQdrantApi {
    constructor() {
        this.name = 'chatHubVectorStoreQdrantApi';
        this.extends = ['qdrantApi'];
        this.displayName = 'ChatHub Qdrant Vector Store API';
        this.documentationUrl = 'qdrant';
        this.properties = [
            {
                displayName: 'Collection Name',
                name: 'collectionName',
                type: 'string',
                default: 'n8n_vectors',
                description: 'The Qdrant collection to use. All users share this collection; access is scoped per user via a userId metadata field. The collection is created automatically if it does not exist.',
            },
        ];
    }
}
exports.ChatHubVectorStoreQdrantApi = ChatHubVectorStoreQdrantApi;
//# sourceMappingURL=ChatHubVectorStoreQdrantApi.credentials.js.map