"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminConsentRedirectUri = adminConsentRedirectUri;
exports.adminConsentUrl = adminConsentUrl;
function adminConsentRedirectUri(instanceBaseUrl, scope) {
    const url = URL.parse(`${instanceBaseUrl}/projects/${encodeURIComponent(scope.projectId)}/agents/${encodeURIComponent(scope.agentId)}`);
    if (!url)
        return undefined;
    const localhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && localhost))
        return undefined;
    return url.href;
}
const CONSENT_STATE = 'teams-file-access';
function adminConsentUrl(tenantId, clientId, redirectUri) {
    const query = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        state: CONSENT_STATE,
    });
    return `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/adminconsent?${query.toString()}`;
}
//# sourceMappingURL=teams-admin-consent.js.map