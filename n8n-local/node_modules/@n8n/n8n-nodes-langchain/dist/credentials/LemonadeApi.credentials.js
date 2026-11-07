"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LemonadeApi = void 0;
class LemonadeApi {
    constructor() {
        this.name = 'lemonadeApi';
        this.displayName = 'Lemonade';
        this.documentationUrl = 'lemonade';
        this.properties = [
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                required: true,
                type: 'string',
                default: 'http://localhost:8000/api/v1',
            },
            {
                displayName: 'API Key',
                hint: 'Optional API key for Lemonade server authentication. Not required for default Lemonade installation',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                required: false,
            },
        ];
        this.test = {
            request: {
                baseURL: '={{ $credentials.baseUrl }}',
                url: '/models',
                method: 'GET',
            },
        };
    }
    async authenticate(credentials, requestOptions) {
        const apiKey = credentials.apiKey;
        if (apiKey && apiKey.trim() !== '') {
            requestOptions.headers = {
                ...requestOptions.headers,
                Authorization: `Bearer ${apiKey}`,
            };
        }
        return requestOptions;
    }
}
exports.LemonadeApi = LemonadeApi;
//# sourceMappingURL=LemonadeApi.credentials.js.map