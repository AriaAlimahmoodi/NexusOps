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
exports.PublicApiOAuthStrategy = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const permissions_1 = require("@n8n/permissions");
const backend_services_1 = require("@n8n/backend-services");
const public_api_protected_resource_1 = require("./public-api-protected-resource");
const isApiKeyScopeName = (scope) => (0, permissions_1.isApiKeyScope)(scope);
let PublicApiOAuthStrategy = class PublicApiOAuthStrategy {
    constructor(resource, admission, jwtService, userRepository) {
        this.resource = resource;
        this.admission = admission;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }
    async buildTokenGrant() {
        return null;
    }
    isOAuthIssuer(token) {
        const iss = this.jwtService.decodeUnverified(token)?.iss;
        return typeof iss === 'string' && URL.canParse(iss) && /^https?:$/.test(new URL(iss).protocol);
    }
    async authenticate(req) {
        const isAvailable = await this.resource.isAvailable();
        if (!isAvailable) {
            return null;
        }
        const extracted = (0, inbound_auth_1.extractBearer)((0, inbound_auth_1.inboundFrom)(this.resource, (0, inbound_auth_1.inboundRequestOf)(req)));
        if (!extracted.ok || !this.isOAuthIssuer(extracted.value.credential.token)) {
            return null;
        }
        const admitted = await this.admission.admit(this.resource, extracted.value);
        if (!admitted.ok) {
            req.res?.setHeader('WWW-Authenticate', await this.admission.challenge(admitted));
            return false;
        }
        const user = await this.userRepository.findByIdWithRole(admitted.context.subject.id);
        if (!user) {
            return false;
        }
        const roleScopes = (0, permissions_1.getApiKeyScopesForRole)(user);
        const requested = (admitted.context.tokenScopes ?? []).filter(isApiKeyScopeName);
        req.user = user;
        req.tokenGrant = {
            scopes: user.role.scopes.map((scope) => scope.slug),
            apiKeyScopes: requested.length > 0 ? roleScopes.filter((s) => requested.includes(s)) : roleScopes,
            subject: user,
        };
        req.ctx = {
            security: admitted.context,
        };
        return true;
    }
};
exports.PublicApiOAuthStrategy = PublicApiOAuthStrategy;
exports.PublicApiOAuthStrategy = PublicApiOAuthStrategy = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [public_api_protected_resource_1.PublicApiProtectedResource, inbound_auth_1.ResourceAdmission, backend_services_1.JwtService, db_1.UserRepository])
], PublicApiOAuthStrategy);
//# sourceMappingURL=public-api-oauth.strategy.js.map