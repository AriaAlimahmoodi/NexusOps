import { INTEGRATION_ERROR_CODES } from './integration-error-codes';
import { type IntegrationErrorResponse } from './integration-helpers';
import type { ChannelRateLimitGuard } from './channel-rate-limit.guard';
export declare const CHANNEL_RATE_LIMIT_COOLDOWN_MS: number;
export declare function rateLimitMessageFromError(error: unknown): string | undefined;
export declare function isRateLimitedToolOutput(output: unknown): boolean;
export declare function isHttp429(error: unknown): boolean;
export declare function channelRateLimitMessage(platform: string): string;
export interface RecipientScopedRateLimitError {
    response: {
        status: 429;
    };
    rateLimitScope: 'recipient';
}
export declare function caughtIntegrationError(error: unknown, params: {
    connectionId: string;
    platform: string;
    guard: ChannelRateLimitGuard | undefined;
    failedCode: typeof INTEGRATION_ERROR_CODES.ACTION_FAILED | typeof INTEGRATION_ERROR_CODES.CONTEXT_QUERY_FAILED;
}): IntegrationErrorResponse;
