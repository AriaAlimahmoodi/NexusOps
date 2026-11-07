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
exports.OAuthSigningJwksProvider = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const oauth_signing_key_service_1 = require("./oauth-signing-key.service");
const oauth_signing_key_schemas_1 = require("./oauth-signing-key.schemas");
let OAuthSigningJwksProvider = class OAuthSigningJwksProvider {
    constructor(signingKeyService, logger) {
        this.signingKeyService = signingKeyService;
        this.logger = logger;
        this.id = 'oauth-server-signing';
    }
    async getPublicJwks() {
        const jwks = await this.signingKeyService.getPublicJwks();
        return jwks
            .map((key) => oauth_signing_key_schemas_1.PublicSigningJwkSchema.safeParse(key))
            .filter((result) => {
            if (!result.success) {
                this.logger.warn('Failed to parse public signing JWK', { error: result.error });
            }
            return result.success;
        })
            .map((result) => result.data);
    }
};
exports.OAuthSigningJwksProvider = OAuthSigningJwksProvider;
exports.OAuthSigningJwksProvider = OAuthSigningJwksProvider = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [oauth_signing_key_service_1.OAuthSigningKeyService, backend_common_1.Logger])
], OAuthSigningJwksProvider);
//# sourceMappingURL=oauth-signing-jwks.provider.js.map