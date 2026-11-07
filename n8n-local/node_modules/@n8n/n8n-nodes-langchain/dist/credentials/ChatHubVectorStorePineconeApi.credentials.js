"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHubVectorStorePineconeApi = void 0;
class ChatHubVectorStorePineconeApi {
    constructor() {
        this.name = 'chatHubVectorStorePineconeApi';
        this.extends = ['pineconeApi'];
        this.displayName = 'ChatHub Pinecone Vector Store API';
        this.documentationUrl = 'pinecone';
        this.properties = [
            {
                displayName: 'Pinecone Index',
                name: 'pineconeIndex',
                type: 'string',
                default: '',
                required: true,
                description: 'The Pinecone index to use for all users.',
            },
            {
                displayName: 'Namespace Prefix',
                name: 'namespacePrefix',
                type: 'string',
                default: 'n8n_vectors',
                description: 'Prefix for namespace names. The full namespace will be {prefix}_{userId}.',
            },
        ];
    }
}
exports.ChatHubVectorStorePineconeApi = ChatHubVectorStorePineconeApi;
//# sourceMappingURL=ChatHubVectorStorePineconeApi.credentials.js.map