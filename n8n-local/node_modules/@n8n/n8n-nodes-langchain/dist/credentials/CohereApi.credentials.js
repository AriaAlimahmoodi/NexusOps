"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CohereApi = void 0;
class CohereApi {
    constructor() {
        this.name = 'cohereApi';
        this.displayName = 'Cohere API';
        this.documentationUrl = 'cohere';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                required: true,
                default: '',
            },
            {
                displayName: 'Base URL',
                name: 'url',
                type: 'hidden',
                default: 'https://api.cohere.ai',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{ $credentials.url }}',
                url: '/v1/models?page_size=1',
            },
        };
    }
}
exports.CohereApi = CohereApi;
//# sourceMappingURL=CohereApi.credentials.js.map