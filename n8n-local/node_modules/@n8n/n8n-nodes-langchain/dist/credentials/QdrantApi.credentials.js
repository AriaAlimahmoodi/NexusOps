"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QdrantApi = void 0;
class QdrantApi {
    constructor() {
        this.name = 'qdrantApi';
        this.displayName = 'Qdrant API';
        this.documentationUrl = 'https://docs.n8n.io/integrations/builtin/credentials/qdrant/';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                required: false,
                default: '',
            },
            {
                displayName: 'Qdrant URL',
                name: 'qdrantUrl',
                type: 'string',
                required: true,
                default: '',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    'api-key': '={{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.qdrantUrl}}',
                url: '/collections',
            },
        };
    }
}
exports.QdrantApi = QdrantApi;
//# sourceMappingURL=QdrantApi.credentials.js.map