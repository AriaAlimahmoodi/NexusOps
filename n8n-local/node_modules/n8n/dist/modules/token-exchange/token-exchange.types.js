"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_EXCHANGE_ISSUER = exports.TokenExchangeFailureReason = void 0;
exports.TokenExchangeFailureReason = {
    InvalidSignature: 'invalid_signature',
    UnknownKey: 'unknown_key',
    TokenReplay: 'token_replay',
    TokenTooLong: 'token_too_long',
    TokenNearExpiry: 'token_near_expiry',
    InvalidFormat: 'invalid_format',
    MissingKid: 'missing_kid',
    MissingIss: 'missing_iss',
    InvalidClaims: 'invalid_claims',
    InternalError: 'internal_error',
    RoleNotAllowed: 'role_not_allowed',
    EmailNotVerified: 'email_not_verified',
    Other: 'other',
};
exports.TOKEN_EXCHANGE_ISSUER = 'n8n-token-exchange';
//# sourceMappingURL=token-exchange.types.js.map