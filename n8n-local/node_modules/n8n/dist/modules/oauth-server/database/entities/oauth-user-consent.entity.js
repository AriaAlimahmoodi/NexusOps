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
exports.UserConsent = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const oauth_client_entity_1 = require("./oauth-client.entity");
let UserConsent = class UserConsent {
};
exports.UserConsent = UserConsent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserConsent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { onDelete: 'CASCADE' }),
    __metadata("design:type", db_1.User)
], UserConsent.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], UserConsent.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => oauth_client_entity_1.OAuthClient, (client) => client.userConsents, { onDelete: 'CASCADE' }),
    __metadata("design:type", oauth_client_entity_1.OAuthClient)
], UserConsent.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], UserConsent.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], UserConsent.prototype, "grantedAt", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Array)
], UserConsent.prototype, "scope", void 0);
exports.UserConsent = UserConsent = __decorate([
    (0, typeorm_1.Entity)('oauth_user_consents'),
    (0, typeorm_1.Unique)(['userId', 'clientId'])
], UserConsent);
//# sourceMappingURL=oauth-user-consent.entity.js.map