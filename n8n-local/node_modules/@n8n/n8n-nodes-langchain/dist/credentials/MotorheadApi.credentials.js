"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotorheadApi = void 0;
class MotorheadApi {
    constructor() {
        this.name = 'motorheadApi';
        this.displayName = 'Motorhead API';
        this.documentationUrl = 'motorhead';
        this.properties = [
            {
                displayName: 'Host',
                name: 'host',
                required: true,
                type: 'string',
                default: 'https://api.getmetal.io/v1',
            },
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                required: true,
                default: '',
            },
            {
                displayName: 'Client ID',
                name: 'clientId',
                type: 'string',
                default: '',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    'x-metal-client-id': '={{$credentials.clientId}}',
                    'x-metal-api-key': '={{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.host}}/keys/current',
            },
        };
    }
}
exports.MotorheadApi = MotorheadApi;
//# sourceMappingURL=MotorheadApi.credentials.js.map