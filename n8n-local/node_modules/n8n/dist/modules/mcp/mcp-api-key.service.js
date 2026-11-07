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
exports.McpServerApiKeyService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const crypto_1 = require("crypto");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const auth_1 = require("@n8n/backend-services/auth");
const backend_services_1 = require("@n8n/backend-services");
const API_KEY_AUDIENCE = 'mcp-server-api';
const API_KEY_ISSUER = 'n8n';
const REDACT_API_KEY_REVEAL_COUNT = 4;
const REDACT_API_KEY_MAX_LENGTH = 10;
const API_KEY_LABEL = 'MCP Server API Key';
const REDACT_API_KEY_MIN_HIDDEN_CHARS = 6;
let McpServerApiKeyService = class McpServerApiKeyService {
    constructor(apiKeyRepository, jwtService, authStrategyRegistry) {
        this.apiKeyRepository = apiKeyRepository;
        this.jwtService = jwtService;
        this.authStrategyRegistry = authStrategyRegistry;
    }
    async createMcpServerApiKey(user, trx) {
        const manager = trx ?? this.apiKeyRepository.manager;
        const apiKey = this.jwtService.sign('mcpApiKey', {
            sub: user.id,
            iss: API_KEY_ISSUER,
            jti: (0, crypto_1.randomUUID)(),
        });
        const apiKeyEntity = this.apiKeyRepository.create({
            userId: user.id,
            apiKey,
            audience: API_KEY_AUDIENCE,
            scopes: [],
            label: API_KEY_LABEL,
        });
        await manager.insert(db_1.ApiKey, apiKeyEntity);
        return await manager.findOneByOrFail(db_1.ApiKey, { apiKey });
    }
    async findServerApiKeyForUser(user, { redact = true } = {}) {
        const apiKey = await this.apiKeyRepository.findOne({
            where: {
                userId: user.id,
                audience: API_KEY_AUDIENCE,
            },
        });
        if (apiKey && redact) {
            apiKey.apiKey = this.redactApiKey(apiKey.apiKey);
        }
        return apiKey;
    }
    async verifyApiKey(apiKey) {
        try {
            const tokenGrant = await this.authStrategyRegistry.buildContextFromToken(apiKey, {
                audience: API_KEY_AUDIENCE,
            });
            if (tokenGrant) {
                return {
                    user: tokenGrant.actor ?? tokenGrant.subject,
                    actor: tokenGrant.actor,
                    caller: {
                        authType: 'api_key',
                        ...(tokenGrant.apiKeyId ? { apiKeyId: tokenGrant.apiKeyId } : {}),
                    },
                };
            }
            return {
                user: null,
                context: {
                    reason: 'invalid_token',
                    auth_type: 'api_key',
                },
            };
        }
        catch (error) {
            const errorForSure = (0, ensure_error_1.ensureError)(error);
            return {
                user: null,
                context: {
                    reason: errorForSure.name === 'JsonWebTokenError' ? 'invalid_token' : 'unknown_error',
                    auth_type: 'api_key',
                    error_details: errorForSure.message,
                },
            };
        }
    }
    async deleteAllMcpApiKeysForUser(user, trx) {
        const manager = trx ?? this.apiKeyRepository.manager;
        await manager.delete(db_1.ApiKey, {
            userId: user.id,
            audience: API_KEY_AUDIENCE,
        });
    }
    redactApiKey(apiKey) {
        if (REDACT_API_KEY_REVEAL_COUNT >= apiKey.length - REDACT_API_KEY_MIN_HIDDEN_CHARS) {
            return '*'.repeat(apiKey.length);
        }
        const visiblePart = apiKey.slice(-REDACT_API_KEY_REVEAL_COUNT);
        const redactedPart = '*'.repeat(Math.max(0, REDACT_API_KEY_MAX_LENGTH - REDACT_API_KEY_REVEAL_COUNT));
        return redactedPart + visiblePart;
    }
    async getOrCreateApiKey(user) {
        const apiKey = await this.apiKeyRepository.findOne({
            where: {
                userId: user.id,
                audience: API_KEY_AUDIENCE,
            },
        });
        if (apiKey) {
            apiKey.apiKey = this.redactApiKey(apiKey.apiKey);
            return apiKey;
        }
        return await this.createMcpServerApiKey(user);
    }
    async rotateMcpServerApiKey(user) {
        return await this.apiKeyRepository.manager.transaction(async (trx) => {
            await this.deleteAllMcpApiKeysForUser(user, trx);
            return await this.createMcpServerApiKey(user, trx);
        });
    }
};
exports.McpServerApiKeyService = McpServerApiKeyService;
exports.McpServerApiKeyService = McpServerApiKeyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ApiKeyRepository, backend_services_1.JwtService, auth_1.AuthStrategyRegistry])
], McpServerApiKeyService);
//# sourceMappingURL=mcp-api-key.service.js.map