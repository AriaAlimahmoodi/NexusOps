"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearXngApi = void 0;
class SearXngApi {
    constructor() {
        this.name = 'searXngApi';
        this.displayName = 'SearXNG';
        this.documentationUrl = 'searxng';
        this.properties = [
            {
                displayName: 'API URL',
                name: 'apiUrl',
                type: 'string',
                default: '',
                required: true,
            },
        ];
    }
}
exports.SearXngApi = SearXngApi;
//# sourceMappingURL=SearXngApi.credentials.js.map