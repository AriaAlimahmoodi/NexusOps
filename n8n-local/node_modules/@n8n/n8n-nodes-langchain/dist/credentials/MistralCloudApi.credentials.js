"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MistralCloudApi = void 0;
class MistralCloudApi {
    constructor() {
        this.name = 'mistralCloudApi';
        this.displayName = 'Mistral Cloud API';
        this.documentationUrl = 'mistral';
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
                baseURL: 'https://api.mistral.ai/v1',
                url: '/models',
                method: 'GET',
            },
        };
    }
}
exports.MistralCloudApi = MistralCloudApi;
//# sourceMappingURL=MistralCloudApi.credentials.js.map