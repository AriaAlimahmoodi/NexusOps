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
exports.ScimTokenService = void 0;
const di_1 = require("@n8n/di");
const crypto_1 = require("crypto");
const backend_services_1 = require("@n8n/backend-services");
const scim_api_key_repository_1 = require("./database/scim-api-key.repository");
const API_KEY_PURPOSE = 'scimApiKey';
const API_KEY_ISSUER = 'n8n';
const REDACT_API_KEY_REVEAL_COUNT = 4;
const REDACT_API_KEY_MAX_LENGTH = 10;
const REDACT_API_KEY_MIN_HIDDEN_CHARS = 6;
let ScimTokenService = class ScimTokenService {
    constructor(apiKeyRepository, jwtService, urlService) {
        this.apiKeyRepository = apiKeyRepository;
        this.jwtService = jwtService;
        this.urlService = urlService;
    }
    signApiKey(user) {
        return this.jwtService.sign(API_KEY_PURPOSE, {
            sub: user.id,
            iss: API_KEY_ISSUER,
            jti: (0, crypto_1.randomUUID)(),
        });
    }
    async getTokenInfoForUser(user, ctx = {}) {
        const apiKey = await this.apiKeyRepository.findByUserId(user.id, ctx);
        return {
            hasToken: !!apiKey,
            lastFour: apiKey ? apiKey.apiKey.slice(-REDACT_API_KEY_REVEAL_COUNT) : null,
        };
    }
    async findScimApiKeyForUser(user, { redact = true } = {}, ctx = {}) {
        const apiKey = await this.apiKeyRepository.findByUserId(user.id, ctx);
        if (apiKey && redact) {
            apiKey.apiKey = this.redactApiKey(apiKey.apiKey);
        }
        return apiKey;
    }
    async verifyApiKey(apiKey, ctx = {}) {
        try {
            this.jwtService.verify(API_KEY_PURPOSE, apiKey, { issuer: API_KEY_ISSUER });
        }
        catch {
            return false;
        }
        const key = await this.apiKeyRepository.findByKey(apiKey, ctx);
        return !!key && !!key.user && !key.user.disabled;
    }
    async deleteAllScimApiKeysForUser(user, ctx = {}) {
        await this.apiKeyRepository.deleteAllForUser(user.id, ctx);
    }
    async rotateScimApiKey(user, ctx = {}) {
        return await this.apiKeyRepository.replaceForUser(user.id, this.signApiKey(user), ctx);
    }
    getScimBaseUrl() {
        return `${this.urlService.getInstanceBaseUrl()}/scim/v2`;
    }
    redactApiKey(apiKey) {
        if (REDACT_API_KEY_REVEAL_COUNT >= apiKey.length - REDACT_API_KEY_MIN_HIDDEN_CHARS) {
            return '*'.repeat(apiKey.length);
        }
        const visiblePart = apiKey.slice(-REDACT_API_KEY_REVEAL_COUNT);
        const redactedPart = '*'.repeat(Math.max(0, REDACT_API_KEY_MAX_LENGTH - REDACT_API_KEY_REVEAL_COUNT));
        return redactedPart + visiblePart;
    }
};
exports.ScimTokenService = ScimTokenService;
exports.ScimTokenService = ScimTokenService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [scim_api_key_repository_1.ScimApiKeyRepository, backend_services_1.JwtService, backend_services_1.UrlService])
], ScimTokenService);
//# sourceMappingURL=scim-token.service.js.map