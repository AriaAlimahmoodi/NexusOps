"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthHelpers = void 0;
class OAuthHelpers {
    static buildSuccessRedirectUrl(redirectUri, code, state, issuer) {
        const targetUrl = new URL(redirectUri);
        targetUrl.searchParams.set('code', code);
        if (state) {
            targetUrl.searchParams.set('state', state);
        }
        targetUrl.searchParams.set('iss', issuer);
        return targetUrl.toString();
    }
    static buildErrorRedirectUrl(redirectUri, error, errorDescription, state, issuer) {
        const targetUrl = new URL(redirectUri);
        targetUrl.searchParams.set('error', error);
        targetUrl.searchParams.set('error_description', errorDescription);
        if (state) {
            targetUrl.searchParams.set('state', state);
        }
        targetUrl.searchParams.set('iss', issuer);
        return targetUrl.toString();
    }
    static setIssuerParam(url, issuer) {
        if (!URL.canParse(url))
            return url;
        const targetUrl = new URL(url);
        targetUrl.searchParams.set('iss', issuer);
        return targetUrl.toString();
    }
    static basicAuthClientId(header) {
        const encoded = /^Basic (\S+)$/i.exec(header ?? '')?.[1];
        if (!encoded)
            return undefined;
        const [username] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
        if (!username)
            return undefined;
        try {
            return decodeURIComponent(username);
        }
        catch {
            return username;
        }
    }
}
exports.OAuthHelpers = OAuthHelpers;
//# sourceMappingURL=oauth.helpers.js.map