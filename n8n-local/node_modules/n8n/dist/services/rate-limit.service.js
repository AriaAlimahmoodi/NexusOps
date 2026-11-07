"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const express_rate_limit_1 = require("express-rate-limit");
const node_assert_1 = __importDefault(require("node:assert"));
const defaultLimits = {
    limit: 5,
    windowMs: 5 * constants_1.Time.minutes.toMilliseconds,
};
let RateLimitService = class RateLimitService {
    createIpRateLimitMiddleware(rateLimit) {
        if (typeof rateLimit === 'boolean')
            rateLimit = {};
        return (0, express_rate_limit_1.rateLimit)({
            limit: rateLimit.limit ?? defaultLimits.limit,
            windowMs: rateLimit.windowMs ?? defaultLimits.windowMs,
            message: { message: 'Too many requests' },
        });
    }
    createBodyKeyedRateLimitMiddleware(bodyDtoClass, config) {
        const fieldName = config.field;
        const bodyFieldSchema = bodyDtoClass.schema.shape[fieldName];
        (0, node_assert_1.default)(bodyFieldSchema, `Missing field ${fieldName} in DTO schema`);
        return (0, express_rate_limit_1.rateLimit)({
            limit: config.limit ?? defaultLimits.limit,
            windowMs: config.windowMs ?? defaultLimits.windowMs,
            keyGenerator: (req) => this.extractBodyIdentifier(req.body, fieldName, bodyFieldSchema),
            skip: (req) => {
                const identifier = this.extractBodyIdentifier(req.body, fieldName, bodyFieldSchema);
                return identifier.startsWith('skip:');
            },
        });
    }
    createUserKeyedRateLimitMiddleware(config) {
        return (0, express_rate_limit_1.rateLimit)({
            limit: config.limit ?? defaultLimits.limit,
            windowMs: config.windowMs ?? defaultLimits.windowMs,
            keyGenerator: (req) => this.extractUserIdentifier(req),
            skip: (req) => {
                const identifier = this.extractUserIdentifier(req);
                return identifier.startsWith('skip:');
            },
        });
    }
    createApiKeyRateLimitMiddleware(limits, { requestPropertyName, store }) {
        return (0, express_rate_limit_1.rateLimit)({
            limit: limits.limit,
            windowMs: limits.windowMs,
            legacyHeaders: false,
            standardHeaders: false,
            requestPropertyName,
            store,
            handler: (_req, _res, next) => next(),
            passOnStoreError: true,
            skip: (req) => req.tokenGrant?.apiKeyId === undefined,
            keyGenerator: (req) => `apiKey:${req.tokenGrant?.apiKeyId}`,
        });
    }
    extractBodyIdentifier(body, fieldName, fieldSchema) {
        if (!body || typeof body !== 'object') {
            return 'skip:empty-body';
        }
        const value = body[fieldName];
        if (typeof value !== 'string' && typeof value !== 'number') {
            return 'skip:unsupported-type';
        }
        const parseResult = fieldSchema.safeParse(value);
        if (!parseResult.success) {
            return 'skip:validation-failed';
        }
        return `body:${value}`;
    }
    extractUserIdentifier(req) {
        return `user:${req.user.id}`;
    }
};
exports.RateLimitService = RateLimitService;
exports.RateLimitService = RateLimitService = __decorate([
    (0, di_1.Service)()
], RateLimitService);
//# sourceMappingURL=rate-limit.service.js.map