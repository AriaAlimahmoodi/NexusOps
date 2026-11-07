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
exports.OAuthJweDecryptService = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const oauth_jwe_key_service_1 = require("./oauth-jwe-key.service");
const oauth_jwe_utils_1 = require("./oauth-jwe.utils");
const JWE_TOKEN_FIELDS = ['access_token', 'id_token'];
let OAuthJweDecryptService = class OAuthJweDecryptService {
    constructor(keyService, urlService) {
        this.keyService = keyService;
        this.urlService = urlService;
    }
    async getDcrJweFields(inlineJwks) {
        const publicJwk = await this.keyService.getPublicJwk();
        if (typeof publicJwk.alg !== 'string' || publicJwk.alg.length === 0) {
            throw new n8n_workflow_1.UnexpectedError('OAuth JWE public key is missing an "alg" field');
        }
        const keyDistribution = inlineJwks
            ? { jwks: { keys: [publicJwk] } }
            : { jwks_uri: this.urlService.getInstanceJwksUri() };
        return {
            ...keyDistribution,
            id_token_encrypted_response_alg: publicJwk.alg,
        };
    }
    async decryptOAuth2TokenData(tokenData) {
        const { privateKey } = await this.keyService.getKeyPair();
        const result = { ...tokenData };
        let presentAny = false;
        let decryptedAny = false;
        for (const field of JWE_TOKEN_FIELDS) {
            const value = result[field];
            if (value === undefined || value === null)
                continue;
            presentAny = true;
            if ((0, oauth_jwe_utils_1.isJweToken)(value)) {
                result[field] = await (0, oauth_jwe_utils_1.decryptJweToken)(value, privateKey);
                decryptedAny = true;
            }
        }
        if (presentAny && !decryptedAny) {
            throw new n8n_workflow_1.UserError('Expected at least one JWE-encrypted token but received only plaintext');
        }
        return result;
    }
};
exports.OAuthJweDecryptService = OAuthJweDecryptService;
exports.OAuthJweDecryptService = OAuthJweDecryptService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [oauth_jwe_key_service_1.OAuthJweKeyService, backend_services_1.UrlService])
], OAuthJweDecryptService);
//# sourceMappingURL=oauth-jwe-decrypt.service.js.map