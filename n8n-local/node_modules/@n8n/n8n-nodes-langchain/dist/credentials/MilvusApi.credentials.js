"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilvusApi = void 0;
class MilvusApi {
    constructor() {
        this.name = 'milvusApi';
        this.displayName = 'Milvus';
        this.documentationUrl = 'milvus';
        this.properties = [
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                required: true,
                type: 'string',
                default: 'http://localhost:19530',
            },
            {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Password',
                name: 'password',
                type: 'string',
                typeOptions: { password: true },
                default: '',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.username}}:{{$credentials.password}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{ $credentials.baseUrl }}',
                url: '/v1/vector/collections',
                method: 'GET',
            },
        };
    }
}
exports.MilvusApi = MilvusApi;
//# sourceMappingURL=MilvusApi.credentials.js.map