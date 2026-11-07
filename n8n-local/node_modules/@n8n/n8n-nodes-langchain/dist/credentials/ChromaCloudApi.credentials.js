"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromaCloudApi = void 0;
class ChromaCloudApi {
    constructor() {
        this.name = 'chromaCloudApi';
        this.displayName = 'ChromaDB Cloud';
        this.documentationUrl = 'chroma';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                required: true,
                description: 'Your Chroma Cloud API key',
            },
            {
                displayName: 'Tenant ID',
                name: 'tenant',
                type: 'string',
                default: '',
                description: 'Optional: Tenant ID (auto-resolved if API key is scoped to single DB)',
            },
            {
                displayName: 'Database Name',
                name: 'database',
                type: 'string',
                default: '',
                description: 'Optional: Database name (auto-resolved if API key is scoped to single DB)',
            },
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'https://api.trychroma.com',
                required: true,
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    'x-chroma-token': '={{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.baseUrl}}',
                url: '/api/v2',
                method: 'GET',
            },
        };
    }
}
exports.ChromaCloudApi = ChromaCloudApi;
//# sourceMappingURL=ChromaCloudApi.credentials.js.map