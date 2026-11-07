"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PineconeApi = void 0;
class PineconeApi {
    constructor() {
        this.name = 'pineconeApi';
        this.displayName = 'Pinecone API';
        this.documentationUrl = 'pinecone';
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
                    'Api-Key': '={{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: 'https://api.pinecone.io/indexes',
                headers: {
                    accept: 'application/json; charset=utf-8',
                },
            },
        };
    }
}
exports.PineconeApi = PineconeApi;
//# sourceMappingURL=PineconeApi.credentials.js.map