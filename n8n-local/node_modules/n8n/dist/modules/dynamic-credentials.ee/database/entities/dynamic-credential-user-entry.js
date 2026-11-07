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
exports.DynamicCredentialUserEntry = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const credential_resolver_1 = require("./credential-resolver");
let DynamicCredentialUserEntry = class DynamicCredentialUserEntry extends db_1.WithTimestamps {
    constructor() {
        super();
    }
};
exports.DynamicCredentialUserEntry = DynamicCredentialUserEntry;
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        name: 'credentialId',
    }),
    __metadata("design:type", String)
], DynamicCredentialUserEntry.prototype, "credentialId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        name: 'userId',
    }),
    __metadata("design:type", String)
], DynamicCredentialUserEntry.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        name: 'resolverId',
    }),
    __metadata("design:type", String)
], DynamicCredentialUserEntry.prototype, "resolverId", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], DynamicCredentialUserEntry.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.CredentialsEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'credentialId' }),
    __metadata("design:type", db_1.CredentialsEntity)
], DynamicCredentialUserEntry.prototype, "credential", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", db_1.User)
], DynamicCredentialUserEntry.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => credential_resolver_1.DynamicCredentialResolver, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'resolverId' }),
    __metadata("design:type", credential_resolver_1.DynamicCredentialResolver)
], DynamicCredentialUserEntry.prototype, "resolver", void 0);
exports.DynamicCredentialUserEntry = DynamicCredentialUserEntry = __decorate([
    (0, typeorm_1.Entity)({
        name: 'dynamic_credential_user_entry',
    }),
    __metadata("design:paramtypes", [])
], DynamicCredentialUserEntry);
//# sourceMappingURL=dynamic-credential-user-entry.js.map