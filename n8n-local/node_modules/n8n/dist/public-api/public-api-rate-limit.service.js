"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApiRateLimitService = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const express_rate_limit_1 = require("express-rate-limit");
const rate_limit_service_1 = require("../services/rate-limit.service");
const ENDPOINT_LIMIT = 'endpointRateLimit';
const ALL_ENDPOINTS_LIMIT = 'allEndpointsRateLimit';
const resetMs = (limit) => limit.resetTime?.getTime() ?? 0;
const setRateLimitHeaders = (res, limit) => {
    res.setHeader('X-RateLimit-Limit', limit.limit.toString());
    res.setHeader('X-RateLimit-Remaining', limit.remaining.toString());
    if (limit.resetTime) {
        const resetSeconds = Math.ceil(resetMs(limit) / constants_1.Time.seconds.toMilliseconds);
        res.setHeader('X-RateLimit-Reset', resetSeconds.toString());
    }
};
const READ_METHODS = new Set(['get', 'head']);
const resolveAccess = (method, accessFromDecorator) => accessFromDecorator ?? (READ_METHODS.has(method) ? 'read' : 'write');
let PublicApiRateLimitService = class PublicApiRateLimitService {
    constructor(globalConfig, rateLimitService) {
        this.globalConfig = globalConfig;
        this.rateLimitService = rateLimitService;
        this.allEndpointsLimiterCache = new Map();
    }
    get config() {
        return this.globalConfig.publicApi.rateLimit;
    }
    createRouteLimiters(method, accessFromDecorator) {
        if (!this.config.enabled)
            return [];
        const access = resolveAccess(method, accessFromDecorator);
        const limiters = [
            this.createPerEndpointLimiter(access),
            this.getAllEndpointsLimiter(access),
        ].filter((limiter) => limiter !== undefined);
        if (limiters.length === 0)
            return [];
        return [...limiters.map((limiter) => limiter.middleware), this.enforceLimits(limiters)];
    }
    enforceLimits(limiters) {
        return async (req, res, next) => {
            const counted = limiters.flatMap(({ store, requestPropertyName }) => {
                const limit = req[requestPropertyName];
                return limit ? [{ store, limit }] : [];
            });
            const limits = counted.map(({ limit }) => limit);
            const exceeded = limits.filter((limit) => limit.used > limit.limit);
            if (exceeded.length > 0) {
                await Promise.all(counted.map(async ({ store, limit }) => await store.decrement(limit.key)));
                const [lastToReset] = exceeded.sort((a, b) => resetMs(b) - resetMs(a));
                const retryAfterMs = resetMs(lastToReset) - Date.now();
                setRateLimitHeaders(res, lastToReset);
                res.setHeader('Retry-After', Math.ceil(Math.max(0, retryAfterMs) / constants_1.Time.seconds.toMilliseconds).toString());
                res.status(429).json({ message: 'Too many requests' });
                return;
            }
            const [fewestLeft] = limits.sort((a, b) => a.remaining - b.remaining || resetMs(b) - resetMs(a));
            if (fewestLeft)
                setRateLimitHeaders(res, fewestLeft);
            next();
        };
    }
    createPerEndpointLimiter(access) {
        return this.createRateLimiter(this.getLimitsFromConfig(access).perEndpoint, ENDPOINT_LIMIT);
    }
    getAllEndpointsLimiter(access) {
        if (!this.allEndpointsLimiterCache.has(access)) {
            this.allEndpointsLimiterCache.set(access, this.createRateLimiter(this.getLimitsFromConfig(access).allEndpoints, ALL_ENDPOINTS_LIMIT));
        }
        return this.allEndpointsLimiterCache.get(access);
    }
    getLimitsFromConfig(access) {
        const { config } = this;
        const limits = {
            read: {
                perEndpoint: {
                    maxRequests: config.endpointReadLimit,
                    windowSeconds: config.endpointReadWindowSeconds,
                },
                allEndpoints: {
                    maxRequests: config.globalReadLimit,
                    windowSeconds: config.globalReadWindowSeconds,
                },
            },
            write: {
                perEndpoint: {
                    maxRequests: config.endpointWriteLimit,
                    windowSeconds: config.endpointWriteWindowSeconds,
                },
                allEndpoints: {
                    maxRequests: config.globalWriteLimit,
                    windowSeconds: config.globalWriteWindowSeconds,
                },
            },
        };
        return limits[access];
    }
    createRateLimiter({ maxRequests, windowSeconds }, requestPropertyName) {
        if (maxRequests === 0)
            return undefined;
        const limits = { limit: maxRequests, windowMs: windowSeconds * constants_1.Time.seconds.toMilliseconds };
        const store = new express_rate_limit_1.MemoryStore();
        const middleware = this.rateLimitService.createApiKeyRateLimitMiddleware(limits, {
            requestPropertyName,
            store,
        });
        return { middleware, store, requestPropertyName };
    }
};
exports.PublicApiRateLimitService = PublicApiRateLimitService;
exports.PublicApiRateLimitService = PublicApiRateLimitService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, rate_limit_service_1.RateLimitService])
], PublicApiRateLimitService);
//# sourceMappingURL=public-api-rate-limit.service.js.map