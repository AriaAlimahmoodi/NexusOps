"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBearerTokenRevision = getBearerTokenRevision;
exports.resolveAllowedDomains = resolveAllowedDomains;
exports.createAuthFetch = createAuthFetch;
const ai_utilities_1 = require("@n8n/ai-utilities");
const n8n_workflow_1 = require("n8n-workflow");
function getBearerTokenRevision(headers, expiresAtValue) {
    const authorization = Object.entries(headers).find(([name]) => name.toLowerCase() === 'authorization')?.[1];
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const expiresAt = Number(expiresAtValue);
    return {
        ...(accessToken ? { accessToken } : {}),
        ...(Number.isFinite(expiresAt) ? { expiresAt } : {}),
    };
}
function resolveAllowedDomains(credentialData) {
    const mode = credentialData.allowedHttpRequestDomains;
    if (mode === 'none')
        return { mode: 'none' };
    if (mode === 'domains') {
        const domains = typeof credentialData.allowedDomains === 'string' ? credentialData.allowedDomains : '';
        return { mode: 'domains', domains };
    }
    return undefined;
}
function assertDomainPolicyAllowsUrl(url, policy) {
    if (policy.mode === 'none') {
        throw new n8n_workflow_1.UserError('Credential is configured to block all outbound requests');
    }
    if (policy.domains.trim().length === 0) {
        throw new n8n_workflow_1.UserError('Credential restricts requests to specific domains but none are configured');
    }
    (0, n8n_workflow_1.assertUrlAllowed)({ url, allowedDomains: policy.domains });
}
function createAuthFetch({ baseFetch, initialHeaders, onUnauthorized, shouldRefresh, allowedDomains, }) {
    return (0, ai_utilities_1.createRefreshingAuthFetch)({
        baseFetch,
        initialHeaders,
        ...(onUnauthorized
            ? {
                refreshHeaders: async (current) => await onUnauthorized(Object.fromEntries(current.entries())),
            }
            : {}),
        ...(shouldRefresh ? { shouldRefresh } : {}),
        ...(allowedDomains
            ? {
                assertAllowedUrl: (url) => assertDomainPolicyAllowsUrl(url, allowedDomains),
            }
            : {}),
    });
}
//# sourceMappingURL=auth-fetch.js.map