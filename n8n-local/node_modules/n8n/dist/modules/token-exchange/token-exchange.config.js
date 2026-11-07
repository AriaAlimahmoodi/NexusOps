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
exports.TokenExchangeConfig = void 0;
const config_1 = require("@n8n/config");
let TokenExchangeConfig = class TokenExchangeConfig {
    constructor() {
        this.enabled = false;
        this.embedEnabled = false;
        this.maxTokenTtl = 900;
        this.excludeOwner = true;
        this.trustedKeys = '';
        this.keyRefreshIntervalSeconds = 300;
        this.jtiCleanupIntervalSeconds = 60;
        this.jtiCleanupBatchSize = 1000;
        this.rateLimitEmbedLogin = 20;
        this.rateLimitTokenExchange = 20;
    }
};
exports.TokenExchangeConfig = TokenExchangeConfig;
__decorate([
    (0, config_1.Env)('N8N_TOKEN_EXCHANGE_ENABLED'),
    __metadata("design:type", Boolean)
], TokenExchangeConfig.prototype, "enabled", void 0);
__decorate([
    (0, config_1.Env)('N8N_EMBED_LOGIN_ENABLED'),
    __metadata("design:type", Boolean)
], TokenExchangeConfig.prototype, "embedEnabled", void 0);
__decorate([
    (0, config_1.Env)('N8N_TOKEN_EXCHANGE_MAX_TOKEN_TTL'),
    __metadata("design:type", Number)
], TokenExchangeConfig.prototype, "maxTokenTtl", void 0);
__decorate([
    (0, config_1.Env)('N8N_TOKEN_EXCHANGE_EXCLUDE_OWNER'),
    __metadata("design:type", Boolean)
], TokenExchangeConfig.prototype, "excludeOwner", void 0);
__decorate([
    (0, config_1.Env)('N8N_TOKEN_EXCHANGE_TRUSTED_KEYS'),
    __metadata("design:type", String)
], TokenExchangeConfig.prototype, "trustedKeys", void 0);
__decorate([
    (0, config_1.Env)('N8N_TOKEN_EXCHANGE_KEY_REFRESH_INTERVAL_SECONDS'),
    __metadata("design:type", Number)
], TokenExchangeConfig.prototype, "keyRefreshIntervalSeconds", void 0);
__decorate([
    (0, config_1.Env)('N8N_TOKEN_EXCHANGE_JTI_CLEANUP_INTERVAL_SECONDS', config_1.positiveIntSchema),
    __metadata("design:type", Number)
], TokenExchangeConfig.prototype, "jtiCleanupIntervalSeconds", void 0);
__decorate([
    (0, config_1.Env)('N8N_TOKEN_EXCHANGE_JTI_CLEANUP_BATCH_SIZE', config_1.positiveIntSchema),
    __metadata("design:type", Number)
], TokenExchangeConfig.prototype, "jtiCleanupBatchSize", void 0);
__decorate([
    (0, config_1.Env)('N8N_TOKEN_EXCHANGE_EMBED_LOGIN_PER_MINUTE'),
    __metadata("design:type", Number)
], TokenExchangeConfig.prototype, "rateLimitEmbedLogin", void 0);
__decorate([
    (0, config_1.Env)('N8N_TOKEN_EXCHANGE_TOKEN_EXCHANGE_PER_MINUTE'),
    __metadata("design:type", Number)
], TokenExchangeConfig.prototype, "rateLimitTokenExchange", void 0);
exports.TokenExchangeConfig = TokenExchangeConfig = __decorate([
    config_1.Config
], TokenExchangeConfig);
//# sourceMappingURL=token-exchange.config.js.map