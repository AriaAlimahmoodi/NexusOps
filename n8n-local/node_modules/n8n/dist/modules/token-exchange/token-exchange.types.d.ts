import type { TOKEN_EXCHANGE_GRANT_TYPE } from './token-exchange.schemas';
export declare const TokenExchangeFailureReason: {
    readonly InvalidSignature: 'invalid_signature';
    readonly UnknownKey: 'unknown_key';
    readonly TokenReplay: 'token_replay';
    readonly TokenTooLong: 'token_too_long';
    readonly TokenNearExpiry: 'token_near_expiry';
    readonly InvalidFormat: 'invalid_format';
    readonly MissingKid: 'missing_kid';
    readonly MissingIss: 'missing_iss';
    readonly InvalidClaims: 'invalid_claims';
    readonly InternalError: 'internal_error';
    readonly RoleNotAllowed: 'role_not_allowed';
    readonly EmailNotVerified: 'email_not_verified';
    readonly Other: 'other';
};
export type TokenExchangeFailureReason = (typeof TokenExchangeFailureReason)[keyof typeof TokenExchangeFailureReason];
export interface IssuedTokenResult {
    accessToken: string;
    expiresIn: number;
    subject: string;
    subjectUserId: string;
    issuer: string;
    actor?: string;
    actorUserId?: string;
}
export interface IssuedJwtPayload {
    iss: string;
    sub: string;
    act?: {
        sub: string;
    };
    scope?: string;
    resource?: string[];
    iat: number;
    exp: number;
    jti: string;
}
export declare const TOKEN_EXCHANGE_ISSUER = "n8n-token-exchange";
export type TokenExchangeAuditEvent = {
    event: 'token_exchange_success';
    subject: string;
    actor?: string;
    scopes?: string;
    resource?: string;
    grantType: typeof TOKEN_EXCHANGE_GRANT_TYPE;
    kid?: string;
    issuer: string;
    tokenId?: string;
    clientIp: string;
} | {
    event: 'token_exchange_failure';
    subject?: string;
    failureReason: string;
    grantType: string;
    clientIp: string;
} | {
    event: 'embed_login';
    subject: string;
    issuer: string;
    clientIp: string;
};
export interface TokenExchangeSuccessResponse {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    scope?: string;
    issued_token_type: 'urn:ietf:params:oauth:token-type:access_token';
}
