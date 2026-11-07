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
exports.OAuthServerLocalAuthorizationServer = void 0;
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const oauth_access_token_repository_1 = require("./database/repositories/oauth-access-token.repository");
const oauth_signing_jwks_provider_1 = require("./oauth-signing-jwks.provider");
let OAuthServerLocalAuthorizationServer = class OAuthServerLocalAuthorizationServer extends inbound_auth_1.LocalAuthorizationServer {
    constructor(urlService, resourceRegistry, jwksProvider, accessTokens) {
        super();
        this.urlService = urlService;
        this.resourceRegistry = resourceRegistry;
        this.jwksProvider = jwksProvider;
        this.accessTokens = accessTokens;
    }
    async getMetadata() {
        const baseUrl = this.urlService.getInstanceBaseUrl();
        const allScopes = this.resourceRegistry.getAllScopes();
        const metadata = {
            issuer: baseUrl,
            authorization_endpoint: `${baseUrl}/mcp-oauth/authorize`,
            token_endpoint: `${baseUrl}/mcp-oauth/token`,
            registration_endpoint: `${baseUrl}/mcp-oauth/register`,
            revocation_endpoint: `${baseUrl}/mcp-oauth/revoke`,
            jwks_uri: this.urlService.getInstanceJwksUri(),
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
            token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
            code_challenge_methods_supported: ['S256'],
            authorization_response_iss_parameter_supported: true,
        };
        if (allScopes.length > 0) {
            metadata.scopes_supported = allScopes;
        }
        return metadata;
    }
    async getJwks() {
        return { keys: inbound_auth_1.JwkSchema.array().parse(await this.jwksProvider.getPublicJwks()) };
    }
    async isAccessTokenActive(token) {
        return await this.accessTokens.isActive(token);
    }
};
exports.OAuthServerLocalAuthorizationServer = OAuthServerLocalAuthorizationServer;
exports.OAuthServerLocalAuthorizationServer = OAuthServerLocalAuthorizationServer = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.UrlService, auth_1.ProtectedResourceRegistry, oauth_signing_jwks_provider_1.OAuthSigningJwksProvider, oauth_access_token_repository_1.AccessTokenRepository])
], OAuthServerLocalAuthorizationServer);
//# sourceMappingURL=oauth-local-authorization-server.js.map