"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceApi = void 0;
class HuggingFaceApi {
    constructor() {
        this.name = 'huggingFaceApi';
        this.displayName = 'Hugging Face API';
        this.documentationUrl = 'huggingface';
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
                baseURL: 'https://huggingface.co',
                url: '/api/whoami-v2',
            },
        };
    }
}
exports.HuggingFaceApi = HuggingFaceApi;
//# sourceMappingURL=HuggingFaceApi.credentials.js.map