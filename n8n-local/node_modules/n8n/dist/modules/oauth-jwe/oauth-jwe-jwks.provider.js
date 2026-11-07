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
exports.OAuthJweJwksProvider = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const oauth_jwe_key_service_1 = require("./oauth-jwe-key.service");
const oauth_jwe_schemas_1 = require("./oauth-jwe.schemas");
let OAuthJweJwksProvider = class OAuthJweJwksProvider {
    constructor(jweKeyService, logger) {
        this.jweKeyService = jweKeyService;
        this.logger = logger;
        this.id = 'oauth-jwe';
    }
    async getPublicJwks() {
        const jwks = await this.jweKeyService.getPublicJwks();
        return jwks
            .map((key) => oauth_jwe_schemas_1.PublicJweJwkSchema.safeParse(key))
            .filter((result) => {
            if (!result.success) {
                this.logger.warn('Failed to parse public JWE JWK', { error: result.error });
            }
            return result.success;
        })
            .map((result) => result.data);
    }
};
exports.OAuthJweJwksProvider = OAuthJweJwksProvider;
exports.OAuthJweJwksProvider = OAuthJweJwksProvider = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [oauth_jwe_key_service_1.OAuthJweKeyService, backend_common_1.Logger])
], OAuthJweJwksProvider);
//# sourceMappingURL=oauth-jwe-jwks.provider.js.map