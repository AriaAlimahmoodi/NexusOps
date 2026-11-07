import { GlobalConfig } from '@n8n/config';
import type { Method, RateLimitAccessName } from '@n8n/decorators';
import type { RequestHandler } from 'express';
import { RateLimitService } from '../services/rate-limit.service';
export declare class PublicApiRateLimitService {
    private readonly globalConfig;
    private readonly rateLimitService;
    private readonly allEndpointsLimiterCache;
    constructor(globalConfig: GlobalConfig, rateLimitService: RateLimitService);
    private get config();
    createRouteLimiters(method: Method, accessFromDecorator?: RateLimitAccessName): RequestHandler[];
    private enforceLimits;
    private createPerEndpointLimiter;
    private getAllEndpointsLimiter;
    private getLimitsFromConfig;
    private createRateLimiter;
}
