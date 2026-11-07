"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromaSelfHostedApi = void 0;
class ChromaSelfHostedApi {
    constructor() {
        this.name = 'chromaSelfHostedApi';
        this.displayName = 'ChromaDB Self-Hosted';
        this.documentationUrl = 'chroma';
        this.properties = [
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'http://localhost:8000',
                placeholder: 'http://localhost:8000',
                description: 'The URL of your ChromaDB instance. Note that path prefixes are not supported, so the URL must point directly to the instance root.',
            },
            {
                displayName: 'Authentication',
                name: 'authentication',
                type: 'options',
                options: [
                    {
                        name: 'None',
                        value: 'none',
                    },
                    {
                        name: 'API Key',
                        value: 'apiKey',
                    },
                    {
                        name: 'Token',
                        value: 'token',
                    },
                ],
                default: 'none',
            },
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                displayOptions: {
                    show: {
                        authentication: ['apiKey'],
                    },
                },
            },
            {
                displayName: 'Token',
                name: 'token',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                displayOptions: {
                    show: {
                        authentication: ['token'],
                    },
                },
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '={{$credentials.authentication === "apiKey" && $credentials.apiKey ? "Bearer " + $credentials.apiKey : ""}}',
                    'X-Chroma-Token': '={{$credentials.authentication === "token" && $credentials.token ? $credentials.token : ""}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.baseUrl}}',
                url: '/api/v2/heartbeat',
                method: 'GET',
            },
        };
    }
}
exports.ChromaSelfHostedApi = ChromaSelfHostedApi;
//# sourceMappingURL=ChromaSelfHostedApi.credentials.js.map