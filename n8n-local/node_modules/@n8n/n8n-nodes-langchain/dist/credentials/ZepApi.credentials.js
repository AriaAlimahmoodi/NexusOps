"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZepApi = void 0;
class ZepApi {
    constructor() {
        this.name = 'zepApi';
        this.displayName = 'Zep Api';
        this.documentationUrl = 'zep';
        this.properties = [
            {
                displayName: 'This Zep integration is deprecated and will be removed in a future version.',
                name: 'deprecationNotice',
                type: 'notice',
                default: '',
            },
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                required: false,
                default: '',
            },
            {
                displayName: 'Cloud',
                description: 'Whether you are adding credentials for Zep Cloud instead of Zep Open Source',
                name: 'cloud',
                type: 'boolean',
                default: false,
            },
            {
                displayName: 'API URL',
                name: 'apiUrl',
                required: false,
                type: 'string',
                default: 'http://localhost:8000',
                displayOptions: {
                    show: {
                        cloud: [false],
                    },
                },
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '={{$credentials.apiKey && !$credentials.cloud ? "Bearer " + $credentials.apiKey : "Api-Key " + $credentials.apiKey }}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{!$credentials.cloud ? $credentials.apiUrl : "https://api.getzep.com"}}',
                url: '={{!$credentials.cloud ? "/api/v1/collection" : "/api/v2/collections"}}',
            },
        };
    }
}
exports.ZepApi = ZepApi;
//# sourceMappingURL=ZepApi.credentials.js.map