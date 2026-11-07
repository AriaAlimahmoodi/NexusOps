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
exports.AccessToken = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const oauth_client_entity_1 = require("./oauth-client.entity");
let AccessToken = class AccessToken {
};
exports.AccessToken = AccessToken;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', primary: true }),
    __metadata("design:type", String)
], AccessToken.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => oauth_client_entity_1.OAuthClient, (client) => client.accessTokens, { onDelete: 'CASCADE' }),
    __metadata("design:type", oauth_client_entity_1.OAuthClient)
], AccessToken.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], AccessToken.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { onDelete: 'CASCADE' }),
    __metadata("design:type", db_1.User)
], AccessToken.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], AccessToken.prototype, "userId", void 0);
exports.AccessToken = AccessToken = __decorate([
    (0, typeorm_1.Entity)('oauth_access_tokens')
], AccessToken);
//# sourceMappingURL=oauth-access-token.entity.js.map