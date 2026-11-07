"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicrosoftAgent365Api = void 0;
class MicrosoftAgent365Api {
    constructor() {
        this.name = 'microsoftAgent365Api';
        this.displayName = 'Microsoft 365 Agent API';
        this.documentationUrl = 'microsoftagent365';
        this.properties = [
            {
                displayName: 'Tenant ID',
                name: 'tenantId',
                type: 'string',
                required: true,
                default: '',
            },
            {
                displayName: 'Client ID',
                name: 'clientId',
                type: 'string',
                required: true,
                default: '',
            },
            {
                displayName: 'Client Secret',
                name: 'clientSecret',
                type: 'string',
                typeOptions: { password: true },
                required: true,
                default: '',
            },
        ];
    }
}
exports.MicrosoftAgent365Api = MicrosoftAgent365Api;
//# sourceMappingURL=MicrosoftAgent365Api.credentials.js.map