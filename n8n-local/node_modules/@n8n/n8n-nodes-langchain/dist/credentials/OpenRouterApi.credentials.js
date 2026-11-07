"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterApi = void 0;
class OpenRouterApi {
    constructor() {
        this.name = 'openRouterApi';
        this.displayName = 'OpenRouter';
        this.documentationUrl = 'openrouter';
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
                default: 'https://openrouter.ai/api/v1',
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
                url: '/key',
            },
        };
    }
}
exports.OpenRouterApi = OpenRouterApi;
//# sourceMappingURL=OpenRouterApi.credentials.js.map