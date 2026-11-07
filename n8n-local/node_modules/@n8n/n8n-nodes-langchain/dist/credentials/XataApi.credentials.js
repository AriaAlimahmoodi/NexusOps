"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XataApi = void 0;
class XataApi {
    constructor() {
        this.name = 'xataApi';
        this.displayName = 'Xata Api';
        this.documentationUrl = 'xata';
        this.properties = [
            {
                displayName: 'Database Endpoint',
                name: 'databaseEndpoint',
                required: true,
                type: 'string',
                default: '',
                placeholder: 'https://{workspace}.{region}.xata.sh/db/{database}',
            },
            {
                displayName: 'Branch',
                name: 'branch',
                required: true,
                type: 'string',
                default: 'main',
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
                headers: {
                    Authorization: '=Bearer {{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.databaseEndpoint}}:{{$credentials.branch}}',
            },
        };
    }
}
exports.XataApi = XataApi;
//# sourceMappingURL=XataApi.credentials.js.map