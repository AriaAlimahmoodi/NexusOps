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
exports.OAuthClient = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let OAuthClient = class OAuthClient extends db_1.WithTimestamps {
};
exports.OAuthClient = OAuthClient;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', primary: true }),
    __metadata("design:type", String)
], OAuthClient.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], OAuthClient.prototype, "name", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Array)
], OAuthClient.prototype, "redirectUris", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Array)
], OAuthClient.prototype, "grantTypes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: String, default: 'none' }),
    __metadata("design:type", String)
], OAuthClient.prototype, "tokenEndpointAuthMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], OAuthClient.prototype, "isFirstParty", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('AuthorizationCode', 'client'),
    __metadata("design:type", Array)
], OAuthClient.prototype, "authorizationCodes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('AccessToken', 'client'),
    __metadata("design:type", Array)
], OAuthClient.prototype, "accessTokens", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('RefreshToken', 'client'),
    __metadata("design:type", Array)
], OAuthClient.prototype, "refreshTokens", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('UserConsent', 'client'),
    __metadata("design:type", Array)
], OAuthClient.prototype, "userConsents", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], OAuthClient.prototype, "clientSecret", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], OAuthClient.prototype, "clientSecretExpiresAt", void 0);
exports.OAuthClient = OAuthClient = __decorate([
    (0, typeorm_1.Entity)('oauth_clients')
], OAuthClient);
//# sourceMappingURL=oauth-client.entity.js.map