"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEB_SEARCH_GATEWAY_CREDENTIAL_TYPES = void 0;
exports.resolveWebSearchGatewayProxyConfig = resolveWebSearchGatewayProxyConfig;
const n8n_workflow_1 = require("n8n-workflow");
exports.WEB_SEARCH_GATEWAY_CREDENTIAL_TYPES = {
    brave: 'braveSearchApi',
};
const BRAVE_GATEWAY_URL_SUFFIX = /\/res\/v1$/;
async function resolveWebSearchGatewayProxyConfig(provider, credentialProvider) {
    const credentialType = exports.WEB_SEARCH_GATEWAY_CREDENTIAL_TYPES[provider];
    if (!credentialType) {
        throw new n8n_workflow_1.UserError(`Gateway credits do not support the "${provider}" web search provider.`);
    }
    if (!credentialProvider.resolveAiGatewaySearchCredential) {
        throw new n8n_workflow_1.UserError('This credential provider cannot resolve Gateway credits web search credentials.');
    }
    const credential = await credentialProvider.resolveAiGatewaySearchCredential(credentialType);
    const token = typeof credential.apiKey === 'string' ? credential.apiKey : '';
    const baseUrl = typeof credential.baseUrl === 'string' ? credential.baseUrl : '';
    if (!token || !baseUrl) {
        throw new n8n_workflow_1.UserError('Gateway credits returned an incomplete web search credential.');
    }
    return {
        apiUrl: baseUrl.replace(BRAVE_GATEWAY_URL_SUFFIX, ''),
        getAuthHeaders: async () => ({ 'X-Subscription-Token': token }),
    };
}
//# sourceMappingURL=web-search-credential.js.map