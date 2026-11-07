"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaApi = void 0;
class OllamaApi {
    constructor() {
        this.name = 'ollamaApi';
        this.displayName = 'Ollama';
        this.documentationUrl = 'ollama';
        this.properties = [
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                required: true,
                type: 'string',
                default: 'http://localhost:11434',
            },
            {
                displayName: 'API Key',
                hint: 'When using Ollama behind a proxy with authentication (such as Open WebUI), provide the Bearer token/API key here. This is not required for the default Ollama installation',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                required: false,
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
                baseURL: '={{ $credentials.baseUrl }}',
                url: '/api/tags',
                method: 'GET',
            },
        };
    }
}
exports.OllamaApi = OllamaApi;
//# sourceMappingURL=OllamaApi.credentials.js.map