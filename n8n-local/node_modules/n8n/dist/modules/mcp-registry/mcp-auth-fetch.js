"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMcpAuthDomainPolicy = resolveMcpAuthDomainPolicy;
exports.createMcpAuthFetch = createMcpAuthFetch;
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const auth_fetch_1 = require("../../utils/auth-fetch");
function isNativeOAuth2Credential(authentication) {
    return ((0, n8n_workflow_1.isMcpOAuth2Authentication)(authentication) &&
        authentication !== 'mcpOAuth2Api' &&
        !authentication.endsWith('McpOAuth2Api'));
}
function resolveMcpAuthDomainPolicy(authentication, credentialData, mcpHostname) {
    if (!isNativeOAuth2Credential(authentication) || !mcpHostname) {
        return (0, auth_fetch_1.resolveAllowedDomains)(credentialData);
    }
    switch (credentialData.allowedHttpRequestDomains) {
        case 'domains':
            return (0, auth_fetch_1.resolveAllowedDomains)(credentialData);
        case 'all':
            return undefined;
        default:
            return { mode: 'domains', domains: mcpHostname };
    }
}
function createMcpAuthFetch({ allowedDomains, authentication, baseFetch, credentialData, credentialId, initialHeaders, oauthService, projectId, }) {
    const storedTokenData = credentialData.oauthTokenData;
    const oauthTokenData = (0, is_record_1.isRecord)(storedTokenData) ? { ...storedTokenData } : undefined;
    const refreshable = (0, n8n_workflow_1.isMcpOAuth2Authentication)(authentication) && credentialId !== undefined && projectId !== null;
    const onUnauthorized = refreshable
        ? async (currentHeaders) => {
            if (!credentialId || !projectId)
                return null;
            const result = await oauthService.refreshOAuth2CredentialById(credentialId, projectId, (0, auth_fetch_1.getBearerTokenRevision)(currentHeaders, oauthTokenData?.n8n_expires_at));
            if (result && oauthTokenData) {
                if (result.expiresAt === undefined) {
                    delete oauthTokenData.n8n_expires_at;
                }
                else {
                    oauthTokenData.n8n_expires_at = String(result.expiresAt);
                }
                if (result.expiresInSeconds === undefined) {
                    delete oauthTokenData.expires_in;
                }
                else {
                    oauthTokenData.expires_in = result.expiresInSeconds;
                }
            }
            return result?.headers ?? null;
        }
        : undefined;
    return (0, auth_fetch_1.createAuthFetch)({
        baseFetch,
        initialHeaders,
        onUnauthorized,
        ...(onUnauthorized
            ? {
                shouldRefresh: () => (0, n8n_workflow_1.shouldRefreshMcpOAuth2Token)(oauthTokenData, credentialData.grantType),
            }
            : {}),
        allowedDomains,
    });
}
//# sourceMappingURL=mcp-auth-fetch.js.map