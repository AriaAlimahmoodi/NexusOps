"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHubVectorStorePGVectorApi = void 0;
class ChatHubVectorStorePGVectorApi {
    constructor() {
        this.name = 'chatHubVectorStorePGVectorApi';
        this.extends = ['postgres'];
        this.displayName = 'ChatHub PGVector Store API';
        this.documentationUrl = 'postgres';
        this.properties = [
            {
                displayName: 'Table Name Prefix',
                name: 'tableNamePrefix',
                type: 'string',
                default: 'n8n_vectors',
                description: 'Prefix for table names. The full table name will be {prefix}_{userId}.',
            },
        ];
    }
}
exports.ChatHubVectorStorePGVectorApi = ChatHubVectorStorePGVectorApi;
//# sourceMappingURL=ChatHubVectorStorePGVectorApi.credentials.js.map