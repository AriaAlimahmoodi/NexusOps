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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenExchangeService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const crypto_1 = require("crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const backend_services_1 = require("@n8n/backend-services");
const token_exchange_config_1 = require("../token-exchange.config");
const token_exchange_errors_1 = require("../token-exchange.errors");
const token_exchange_schemas_1 = require("../token-exchange.schemas");
const token_exchange_types_1 = require("../token-exchange.types");
const identity_resolution_service_1 = require("./identity-resolution.service");
const jti_store_service_1 = require("./jti-store.service");
const trusted_key_service_1 = require("./trusted-key.service");
const MAX_TOKEN_LIFETIME_SECONDS = 60;
const MIN_REMAINING_LIFETIME_SECONDS = 5;
let TokenExchangeService = class TokenExchangeService {
    constructor(logger, trustedKeyStore, jtiStore, identityResolutionService, config, jwtService) {
        this.trustedKeyStore = trustedKeyStore;
        this.jtiStore = jtiStore;
        this.identityResolutionService = identityResolutionService;
        this.config = config;
        this.jwtService = jwtService;
        this.logger = logger.scoped('token-exchange');
    }
    async verifyToken(subjectToken, { maxLifetimeSeconds } = {}) {
        const decoded = jsonwebtoken_1.default.decode(subjectToken, { complete: true });
        if (!decoded || typeof decoded === 'string') {
            throw new token_exchange_errors_1.TokenExchangeRequestError(token_exchange_types_1.TokenExchangeFailureReason.InvalidFormat, 'Invalid token format');
        }
        const { kid } = decoded.header;
        if (!kid) {
            throw new token_exchange_errors_1.TokenExchangeRequestError(token_exchange_types_1.TokenExchangeFailureReason.MissingKid, 'Token header missing kid');
        }
        const decodedPayload = decoded.payload;
        const iss = typeof decodedPayload === 'object' && decodedPayload !== null
            ? decodedPayload.iss
            : undefined;
        if (typeof iss !== 'string' || !iss) {
            throw new token_exchange_errors_1.TokenExchangeRequestError(token_exchange_types_1.TokenExchangeFailureReason.MissingIss, 'Token payload missing iss');
        }
        const resolvedKey = await this.trustedKeyStore.getByKidAndIss(kid, iss);
        if (!resolvedKey) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.UnknownKey, 'Unknown key id');
        }
        let payload;
        try {
            const result = jsonwebtoken_1.default.verify(subjectToken, resolvedKey.key, {
                algorithms: resolvedKey.algorithms,
                issuer: resolvedKey.issuer,
                audience: resolvedKey.expectedAudience,
                ignoreExpiration: false,
                ignoreNotBefore: false,
            });
            if (typeof result === 'string' || !('iat' in result)) {
                throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.InvalidFormat, 'Unexpected token format');
            }
            payload = result;
        }
        catch (error) {
            if (error instanceof token_exchange_errors_1.TokenExchangeAuthError)
                throw error;
            const message = error instanceof Error ? error.message : 'unknown error';
            this.logger.warn('JWT verification failed', { error: message });
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.InvalidSignature, 'Token verification failed');
        }
        const claims = token_exchange_schemas_1.ExternalTokenClaimsSchema.parse(payload);
        if (maxLifetimeSeconds !== undefined) {
            const tokenLifetime = claims.exp - claims.iat;
            if (tokenLifetime > maxLifetimeSeconds) {
                throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.TokenTooLong, 'Token lifetime exceeds maximum allowed');
            }
        }
        const consumed = await this.jtiStore.consume(claims.jti, new Date(claims.exp * 1000));
        if (!consumed) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.TokenReplay, 'Token has already been used');
        }
        return { claims, resolvedKey };
    }
    async embedLogin(subjectToken) {
        const { claims, resolvedKey } = await this.verifyToken(subjectToken, {
            maxLifetimeSeconds: MAX_TOKEN_LIFETIME_SECONDS,
        });
        const user = await this.identityResolutionService.resolve(claims, resolvedKey.allowedRoles, {
            kid: resolvedKey.kid,
            issuer: resolvedKey.issuer,
            requireVerifiedEmail: resolvedKey.requireVerifiedEmail,
        });
        return { user, subject: claims.sub, issuer: resolvedKey.issuer, kid: resolvedKey.kid };
    }
    async exchange(request) {
        const subjectClaims = await this.verifyToken(request.subject_token);
        const actorClaims = request.actor_token
            ? await this.verifyToken(request.actor_token)
            : undefined;
        const actor = actorClaims
            ? await this.identityResolutionService.resolve(actorClaims.claims, actorClaims.resolvedKey.allowedRoles, actorClaims.resolvedKey)
            : undefined;
        const subject = await this.identityResolutionService.resolve(subjectClaims.claims, subjectClaims.resolvedKey.allowedRoles, subjectClaims.resolvedKey);
        const now = Math.floor(Date.now() / 1000);
        const maxTtl = this.config.maxTokenTtl;
        const exp = Math.min(subjectClaims.claims.exp, actorClaims?.claims.exp ?? Infinity, now + maxTtl);
        if (exp <= now + MIN_REMAINING_LIFETIME_SECONDS) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.TokenNearExpiry, 'Subject token too close to expiry to issue a new token');
        }
        const resources = request.resource?.split(' ').filter(Boolean);
        const payload = {
            iss: token_exchange_types_1.TOKEN_EXCHANGE_ISSUER,
            sub: subject.id,
            ...(actor && { act: { sub: actor.id } }),
            ...(request.scope && { scope: request.scope }),
            ...(resources?.length && { resource: resources }),
            iat: now,
            exp,
            jti: (0, crypto_1.randomUUID)(),
        };
        const accessToken = this.jwtService.sign('tokenExchange', payload);
        return {
            accessToken,
            expiresIn: exp - now,
            subjectUserId: subject.id,
            subject: subjectClaims.claims.sub,
            issuer: subjectClaims.claims.iss,
            actor: actorClaims?.claims.sub,
            actorUserId: actor?.id,
        };
    }
};
exports.TokenExchangeService = TokenExchangeService;
exports.TokenExchangeService = TokenExchangeService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, trusted_key_service_1.TrustedKeyService, jti_store_service_1.JtiStoreService, identity_resolution_service_1.IdentityResolutionService, token_exchange_config_1.TokenExchangeConfig, backend_services_1.JwtService])
], TokenExchangeService);
//# sourceMappingURL=token-exchange.service.js.map