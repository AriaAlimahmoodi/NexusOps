"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqApi = void 0;
class GroqApi {
    constructor() {
        this.name = 'groqApi';
        this.displayName = 'Groq';
        this.documentationUrl = 'groq';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                required: true,
                default: '',
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
                baseURL: 'https://api.groq.com/openai/v1',
                url: '/models',
            },
        };
    }
}
exports.GroqApi = GroqApi;
//# sourceMappingURL=GroqApi.credentials.js.map