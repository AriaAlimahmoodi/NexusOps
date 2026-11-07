import { ServerError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { AuthError } from '@n8n/errors';
export declare const buildOAuthClientLimitReachedMessage: (limit: number) => string;
export declare class OAuthClientLimitReachedError extends ServerError {
    readonly limit: number;
    constructor(limit: number);
}
export declare class JWTVerificationError extends AuthError {
    constructor();
}
export declare class AccessTokenNotFoundError extends AuthError {
    constructor();
}
