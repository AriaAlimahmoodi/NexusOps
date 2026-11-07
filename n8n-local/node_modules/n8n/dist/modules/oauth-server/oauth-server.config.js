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
exports.OAuthServerConfig = void 0;
const config_1 = require("@n8n/config");
const zod_1 = require("zod");
const rateLimitSchema = zod_1.z.number({ coerce: true }).int().nonnegative();
let OAuthServerConfig = class OAuthServerConfig {
    constructor() {
        this.rateLimitRegister = 10;
        this.rateLimitAuthorize = 50;
        this.rateLimitToken = 20;
        this.rateLimitRevoke = 30;
        this.rateLimitWellKnown = 100;
    }
};
exports.OAuthServerConfig = OAuthServerConfig;
__decorate([
    (0, config_1.Env)('N8N_OAUTH_SERVER_REGISTER_RATE_LIMIT', rateLimitSchema),
    __metadata("design:type", Number)
], OAuthServerConfig.prototype, "rateLimitRegister", void 0);
__decorate([
    (0, config_1.Env)('N8N_OAUTH_SERVER_AUTHORIZE_RATE_LIMIT', rateLimitSchema),
    __metadata("design:type", Number)
], OAuthServerConfig.prototype, "rateLimitAuthorize", void 0);
__decorate([
    (0, config_1.Env)('N8N_OAUTH_SERVER_TOKEN_RATE_LIMIT', rateLimitSchema),
    __metadata("design:type", Number)
], OAuthServerConfig.prototype, "rateLimitToken", void 0);
__decorate([
    (0, config_1.Env)('N8N_OAUTH_SERVER_REVOKE_RATE_LIMIT', rateLimitSchema),
    __metadata("design:type", Number)
], OAuthServerConfig.prototype, "rateLimitRevoke", void 0);
__decorate([
    (0, config_1.Env)('N8N_OAUTH_SERVER_WELL_KNOWN_RATE_LIMIT', rateLimitSchema),
    __metadata("design:type", Number)
], OAuthServerConfig.prototype, "rateLimitWellKnown", void 0);
exports.OAuthServerConfig = OAuthServerConfig = __decorate([
    config_1.Config
], OAuthServerConfig);
//# sourceMappingURL=oauth-server.config.js.map