"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeWebhookRequest = void 0;
const constants_1 = require("../constants");
const oauth_session_service_1 = require("../modules/oauth-server/oauth-session.service");
const constants_2 = require("../modules/sso-oidc/constants");
const oauth_browser_binding_service_1 = require("../oauth/oauth-browser-binding.service");
const BROWSER_ID_COOKIE_NAME = 'n8n-browserId';
const DISALLOWED_COOKIES = new Set([
    constants_1.AUTH_COOKIE_NAME,
    BROWSER_ID_COOKIE_NAME,
    'n8n-oauth-session',
    oauth_browser_binding_service_1.OAUTH_BINDING_COOKIE_NAME,
    constants_2.OIDC_ID_TOKEN_COOKIE_NAME,
    constants_1.OIDC_STATE_COOKIE_NAME,
    constants_1.OIDC_NONCE_COOKIE_NAME,
    constants_1.FORM_OAUTH_COOKIE_NAME,
    constants_1.CHAT_OAUTH_COOKIE_NAME,
    constants_1.CHAT_OAUTH_REFRESH_COOKIE_NAME,
]);
const isDisallowedCookie = (name) => DISALLOWED_COOKIES.has(name) ||
    name.startsWith(`${constants_1.FORM_AUTH_COOKIE_PREFIX}-`) ||
    name.startsWith(oauth_session_service_1.OAUTH_SESSION_COOKIE_PREFIX);
const removeCookiesFromHeader = (req) => {
    const cookiesHeader = req.headers.cookie;
    if (typeof cookiesHeader !== 'string') {
        return;
    }
    const cookies = cookiesHeader.split(';').map((cookie) => cookie.trim());
    const filteredCookies = cookies.filter((cookie) => {
        const cookieName = cookie.split('=')[0];
        return !isDisallowedCookie(cookieName);
    });
    if (filteredCookies.length !== cookies.length) {
        req.headers.cookie = filteredCookies.join('; ');
    }
};
const removeCookiesFromParsedCookies = (req) => {
    if (req.cookies !== null && typeof req.cookies === 'object') {
        for (const cookieName of Object.keys(req.cookies)) {
            if (isDisallowedCookie(cookieName))
                delete req.cookies[cookieName];
        }
    }
};
const sanitizeWebhookRequest = (req) => {
    removeCookiesFromHeader(req);
    removeCookiesFromParsedCookies(req);
};
exports.sanitizeWebhookRequest = sanitizeWebhookRequest;
//# sourceMappingURL=webhook-request-sanitizer.js.map