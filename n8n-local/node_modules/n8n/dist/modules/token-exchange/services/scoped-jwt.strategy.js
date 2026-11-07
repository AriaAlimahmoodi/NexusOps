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
exports.ScopedJwtStrategy = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const jsonwebtoken_1 = require("jsonwebtoken");
const backend_services_1 = require("@n8n/backend-services");
const token_exchange_types_1 = require("../token-exchange.types");
const BEARER_PREFIX = 'Bearer ';
const API_KEY_HEADER = 'x-n8n-api-key';
let ScopedJwtStrategy = class ScopedJwtStrategy {
    constructor(jwtService, userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }
    async buildTokenGrant(token, options) {
        if (!token)
            return null;
        const issuer = options?.issuer ?? token_exchange_types_1.TOKEN_EXCHANGE_ISSUER;
        const decoded = this.jwtService.decodeUnverified(token);
        if (!decoded || decoded.iss !== issuer) {
            return null;
        }
        let payload;
        try {
            payload = this.jwtService.verify('tokenExchange', token, {
                issuer,
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.TokenExpiredError || error instanceof jsonwebtoken_1.JsonWebTokenError) {
                return false;
            }
            throw error;
        }
        const subject = await this.findUser(payload.sub);
        if (!subject || subject.disabled)
            return false;
        let actor;
        if (payload.act) {
            const found = await this.findUser(payload.act.sub);
            if (found?.disabled)
                return false;
            actor = found ?? undefined;
        }
        const actingUser = actor ?? subject;
        return {
            scopes: actingUser.role.scopes.map((s) => s.slug),
            apiKeyScopes: (0, permissions_1.getApiKeyScopesForRole)(actingUser),
            subject,
            ...(actor && { actor }),
        };
    }
    async authenticate(req) {
        const token = this.extractToken(req);
        if (!token)
            return null;
        const tokenGrant = await this.buildTokenGrant(token);
        if (tokenGrant === false || tokenGrant === null) {
            return tokenGrant;
        }
        const actingUser = tokenGrant.actor ?? tokenGrant.subject;
        req.tokenGrant = tokenGrant;
        req.user = actingUser;
        return true;
    }
    async findUser(id) {
        return await this.userRepository.findOne({
            where: { id },
            relations: { role: true },
        });
    }
    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (typeof authHeader === 'string' && authHeader.startsWith(BEARER_PREFIX)) {
            const token = authHeader.slice(BEARER_PREFIX.length).trim();
            if (token)
                return token;
        }
        const apiKeyHeader = req.headers[API_KEY_HEADER];
        if (typeof apiKeyHeader === 'string' && apiKeyHeader) {
            return apiKeyHeader;
        }
        return null;
    }
};
exports.ScopedJwtStrategy = ScopedJwtStrategy;
exports.ScopedJwtStrategy = ScopedJwtStrategy = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.JwtService, db_1.UserRepository])
], ScopedJwtStrategy);
//# sourceMappingURL=scoped-jwt.strategy.js.map