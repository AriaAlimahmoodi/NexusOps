import type { ZodClass } from '@n8n/api-types';
import type { RateLimiterLimits, UserKeyedRateLimiterConfig } from '@n8n/decorators';
import { BodyKeyedRateLimiterConfig } from '@n8n/decorators';
import type { RequestHandler } from 'express';
import type { Store } from 'express-rate-limit';
export declare class RateLimitService {
    createIpRateLimitMiddleware(rateLimit: boolean | RateLimiterLimits): RequestHandler;
    createBodyKeyedRateLimitMiddleware(bodyDtoClass: ZodClass, config: BodyKeyedRateLimiterConfig): RequestHandler;
    createUserKeyedRateLimitMiddleware(config: UserKeyedRateLimiterConfig): RequestHandler;
    createApiKeyRateLimitMiddleware(limits: Required<RateLimiterLimits>, { requestPropertyName, store }: {
        requestPropertyName: string;
        store: Store;
    }): RequestHandler;
    private extractBodyIdentifier;
    private extractUserIdentifier;
}
