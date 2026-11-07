"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekApi = void 0;
class DeepSeekApi {
    constructor() {
        this.name = 'deepSeekApi';
        this.displayName = 'DeepSeek';
        this.documentationUrl = 'deepseek';
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
                default: 'https://api.deepseek.com',
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
                url: '/models',
            },
        };
    }
}
exports.DeepSeekApi = DeepSeekApi;
//# sourceMappingURL=DeepSeekApi.credentials.js.map