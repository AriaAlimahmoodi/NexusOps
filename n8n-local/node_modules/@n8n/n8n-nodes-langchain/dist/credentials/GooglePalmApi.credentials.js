"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooglePalmApi = void 0;
class GooglePalmApi {
    constructor() {
        this.name = 'googlePalmApi';
        this.displayName = 'Google Gemini(PaLM) Api';
        this.documentationUrl = 'google';
        this.properties = [
            {
                displayName: 'Host',
                name: 'host',
                required: true,
                type: 'string',
                default: 'https://generativelanguage.googleapis.com',
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
        this.authenticate = {
            type: 'generic',
            properties: {
                qs: {
                    key: '={{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.host}}/v1beta/models',
            },
        };
    }
}
exports.GooglePalmApi = GooglePalmApi;
//# sourceMappingURL=GooglePalmApi.credentials.js.map