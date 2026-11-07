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
exports.ApiKeyAuthStrategy = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const jsonwebtoken_1 = require("jsonwebtoken");
const public_api_1 = require("../public-api");
const backend_services_1 = require("@n8n/backend-services");
const public_api_key_service_1 = require("./public-api-key.service");
const API_KEY_HEADER = 'x-n8n-api-key';
const LAST_USED_AT_THROTTLE_MS = 1 * constants_1.Time.minutes.toMilliseconds;
let ApiKeyAuthStrategy = class ApiKeyAuthStrategy {
    constructor(apiKeyRepository, jwtService, logger) {
        this.apiKeyRepository = apiKeyRepository;
        this.jwtService = jwtService;
        this.logger = logger;
    }
    async buildTokenGrant(token, options) {
        if (typeof token !== 'string' || !token)
            return null;
        const issuer = options?.issuer ?? public_api_key_service_1.API_KEY_ISSUER;
        const audience = options?.audience ?? public_api_key_service_1.API_KEY_AUDIENCE;
        if (!token.startsWith(public_api_key_service_1.PREFIX_LEGACY_API_KEY)) {
            const decoded = this.jwtService.decodeUnverified(token);
            if (decoded === null)
                return false;
            if (decoded.iss !== issuer)
                return null;
        }
        const apiKeyRecord = await this.apiKeyRepository.findOne({
            where: { apiKey: token, audience },
            relations: { user: { role: true } },
        });
        if (!apiKeyRecord?.user)
            return false;
        if (apiKeyRecord.user.disabled)
            return false;
        if (!token.startsWith(public_api_key_service_1.PREFIX_LEGACY_API_KEY)) {
            try {
                this.jwtService.verify(backend_services_1.API_KEY_PURPOSES[audience], token, { issuer });
            }
            catch (e) {
                if (e instanceof jsonwebtoken_1.TokenExpiredError)
                    return false;
                throw e;
            }
        }
        this.touchLastUsedAt(apiKeyRecord.id, apiKeyRecord.lastUsedAt);
        return {
            scopes: apiKeyRecord.user.role.scopes.map((s) => s.slug),
            subject: apiKeyRecord.user,
            apiKeyScopes: apiKeyRecord.scopes ?? [],
            apiKeyId: apiKeyRecord.id,
        };
    }
    touchLastUsedAt(apiKeyId, previous) {
        const previousMs = previous?.getTime() ?? 0;
        if (Date.now() - previousMs < LAST_USED_AT_THROTTLE_MS)
            return;
        void this.apiKeyRepository
            .update({ id: apiKeyId }, { lastUsedAt: new Date() })
            .catch((error) => {
            this.logger.warn('Failed to update lastUsedAt on API key', { apiKeyId, error });
        });
    }
    async authenticate(req) {
        if (!(0, public_api_1.isApiKeyAuthEnabled)())
            return null;
        const providedApiKey = req.headers[API_KEY_HEADER];
        if (typeof providedApiKey !== 'string' || !providedApiKey)
            return null;
        const tokenGrant = await this.buildTokenGrant(providedApiKey);
        if (tokenGrant === false || tokenGrant === null) {
            return tokenGrant;
        }
        req.user = tokenGrant.subject;
        req.tokenGrant = tokenGrant;
        return true;
    }
};
exports.ApiKeyAuthStrategy = ApiKeyAuthStrategy;
exports.ApiKeyAuthStrategy = ApiKeyAuthStrategy = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ApiKeyRepository, backend_services_1.JwtService, backend_common_1.Logger])
], ApiKeyAuthStrategy);
//# sourceMappingURL=api-key-auth.strategy.js.map