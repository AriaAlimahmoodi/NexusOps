"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureAiSearchApi = void 0;
class AzureAiSearchApi {
    constructor() {
        this.name = 'azureAiSearchApi';
        this.displayName = 'Azure AI Search API';
        this.documentationUrl = 'azureaisearch';
        this.properties = [
            {
                displayName: 'Search Endpoint',
                name: 'endpoint',
                type: 'string',
                required: true,
                default: '',
                placeholder: 'https://your-search-service.search.windows.net',
            },
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                required: true,
                default: '',
            },
        ];
        this.authenticate = async (credentials, requestOptions) => {
            return {
                ...requestOptions,
                headers: {
                    ...requestOptions.headers,
                    'api-key': credentials.apiKey,
                },
            };
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.endpoint}}/indexes',
                url: '',
                method: 'GET',
                headers: {
                    accept: 'application/json',
                },
                qs: {
                    'api-version': '2024-07-01',
                },
            },
        };
    }
}
exports.AzureAiSearchApi = AzureAiSearchApi;
//# sourceMappingURL=AzureAiSearchApi.credentials.js.map