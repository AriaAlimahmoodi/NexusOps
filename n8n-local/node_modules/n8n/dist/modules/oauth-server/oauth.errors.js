"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessTokenNotFoundError = exports.JWTVerificationError = exports.OAuthClientLimitReachedError = exports.buildOAuthClientLimitReachedMessage = void 0;
const errors_js_1 = require("@modelcontextprotocol/sdk/server/auth/errors.js");
const errors_1 = require("@n8n/errors");
const buildOAuthClientLimitReachedMessage = (limit) => `This n8n instance has reached its maximum of ${limit} registered MCP clients. Ask an administrator to revoke unused clients or raise N8N_MCP_MAX_REGISTERED_CLIENTS.`;
exports.buildOAuthClientLimitReachedMessage = buildOAuthClientLimitReachedMessage;
class OAuthClientLimitReachedError extends errors_js_1.ServerError {
    constructor(limit) {
        super((0, exports.buildOAuthClientLimitReachedMessage)(limit));
        this.name = 'OAuthClientLimitReachedError';
        this.limit = limit;
    }
}
exports.OAuthClientLimitReachedError = OAuthClientLimitReachedError;
class JWTVerificationError extends errors_1.AuthError {
    constructor() {
        super('JWT Verification Failed');
        this.name = 'JWTVerificationError';
    }
}
exports.JWTVerificationError = JWTVerificationError;
class AccessTokenNotFoundError extends errors_1.AuthError {
    constructor() {
        super('Access Token Not Found in Database');
        this.name = 'AccessTokenNotFoundError';
    }
}
exports.AccessTokenNotFoundError = AccessTokenNotFoundError;
//# sourceMappingURL=oauth.errors.js.map