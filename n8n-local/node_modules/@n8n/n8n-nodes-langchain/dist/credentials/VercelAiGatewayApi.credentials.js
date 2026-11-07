"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VercelAiGatewayApi = void 0;
class VercelAiGatewayApi {
    constructor() {
        this.name = 'vercelAiGatewayApi';
        this.displayName = 'Vercel AI Gateway';
        this.documentationUrl = 'vercel';
        this.properties = [
            {
                displayName: 'API Key or OIDC Token',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                required: true,
                default: '',
                description: 'Your credentials for the Vercel AI Gateway',
            },
            {
                displayName: 'Base URL',
                name: 'url',
                type: 'string',
                required: true,
                default: 'https://ai-gateway.vercel.sh/v1',
                description: 'The base URL for your Vercel AI Gateway instance',
                placeholder: 'https://ai-gateway.vercel.sh/v1',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.apiKey}}',
                    'http-referer': 'https://n8n.io/',
                    'x-title': 'n8n',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{ $credentials.url }}',
                url: '/chat/completions',
                method: 'POST',
                headers: {
                    'http-referer': 'https://n8n.io/',
                    'x-title': 'n8n',
                },
                body: {
                    model: 'openai/gpt-4.1-nano',
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 1,
                },
            },
        };
    }
}
exports.VercelAiGatewayApi = VercelAiGatewayApi;
//# sourceMappingURL=VercelAiGatewayApi.credentials.js.map