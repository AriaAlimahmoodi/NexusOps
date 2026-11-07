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
exports.AuthorizationCode = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const oauth_client_entity_1 = require("./oauth-client.entity");
let AuthorizationCode = class AuthorizationCode extends db_1.WithTimestamps {
};
exports.AuthorizationCode = AuthorizationCode;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', primary: true }),
    __metadata("design:type", String)
], AuthorizationCode.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => oauth_client_entity_1.OAuthClient, (client) => client.authorizationCodes, { onDelete: 'CASCADE' }),
    __metadata("design:type", oauth_client_entity_1.OAuthClient)
], AuthorizationCode.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], AuthorizationCode.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { onDelete: 'CASCADE' }),
    __metadata("design:type", db_1.User)
], AuthorizationCode.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], AuthorizationCode.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], AuthorizationCode.prototype, "redirectUri", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], AuthorizationCode.prototype, "codeChallenge", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], AuthorizationCode.prototype, "codeChallengeMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], AuthorizationCode.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], AuthorizationCode.prototype, "resource", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Array)
], AuthorizationCode.prototype, "scope", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], AuthorizationCode.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AuthorizationCode.prototype, "used", void 0);
exports.AuthorizationCode = AuthorizationCode = __decorate([
    (0, typeorm_1.Entity)('oauth_authorization_codes')
], AuthorizationCode);
//# sourceMappingURL=oauth-authorization-code.entity.js.map