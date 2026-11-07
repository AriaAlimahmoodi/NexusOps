"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAccountIdentifier = extractAccountIdentifier;
exports.extractAccountIdentifierFromData = extractAccountIdentifierFromData;
const n8n_workflow_1 = require("n8n-workflow");
function extractAccountIdentifier(tokenData) {
    for (const key of ['email', 'login', 'username', 'user', 'account']) {
        if (typeof tokenData[key] === 'string' && tokenData[key]) {
            return tokenData[key];
        }
    }
    if (typeof tokenData.id_token === 'string') {
        const parts = tokenData.id_token.split('.');
        if (parts.length === 3) {
            const payload = (0, n8n_workflow_1.jsonParse)(Buffer.from(parts[1], 'base64url').toString(), { fallbackValue: {} });
            for (const claim of ['email', 'preferred_username', 'name']) {
                if (typeof payload[claim] === 'string' && payload[claim]) {
                    return payload[claim];
                }
            }
        }
    }
    const authedUser = tokenData.authed_user;
    if (authedUser && typeof authedUser === 'object') {
        const user = authedUser;
        if (typeof user.id === 'string' && user.id) {
            return user.id;
        }
    }
    return undefined;
}
function extractAccountIdentifierFromData(data) {
    const tokenData = data?.oauthTokenData;
    if (!tokenData || typeof tokenData !== 'object')
        return undefined;
    return extractAccountIdentifier(tokenData);
}
//# sourceMappingURL=account-identifier.js.map