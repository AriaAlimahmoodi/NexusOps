import { AuthError, BadRequestError } from '@n8n/errors';
import type { TokenExchangeFailureReason } from './token-exchange.types';
export declare class TokenExchangeAuthError extends AuthError {
    readonly reason: TokenExchangeFailureReason;
    constructor(reason: TokenExchangeFailureReason, message: string);
}
export declare class TokenExchangeRequestError extends BadRequestError {
    readonly reason: TokenExchangeFailureReason;
    constructor(reason: TokenExchangeFailureReason, message: string);
}
