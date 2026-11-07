"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XAiApi = void 0;
class XAiApi {
    constructor() {
        this.name = 'xAiApi';
        this.displayName = 'xAi';
        this.documentationUrl = 'xai';
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
                default: 'https://api.x.ai/v1',
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
exports.XAiApi = XAiApi;
//# sourceMappingURL=XAiApi.credentials.js.map