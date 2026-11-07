"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WolframAlphaApi = void 0;
class WolframAlphaApi {
    constructor() {
        this.name = 'wolframAlphaApi';
        this.displayName = 'Wolfram Alpha API';
        this.documentationUrl = 'wolframalpha';
        this.properties = [
            {
                displayName: 'App ID',
                name: 'appId',
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
                    api_key: '={{$credentials.appId}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: 'https://api.wolframalpha.com/v1',
                url: '=/simple',
                qs: {
                    i: 'How much is 1 1',
                    appid: '={{$credentials.appId}}',
                },
            },
        };
    }
}
exports.WolframAlphaApi = WolframAlphaApi;
//# sourceMappingURL=WolframAlphaApi.credentials.js.map