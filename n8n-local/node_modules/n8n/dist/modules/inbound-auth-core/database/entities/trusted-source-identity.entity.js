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
exports.TrustedSourceIdentityEntity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const trusted_source_entity_1 = require("./trusted-source.entity");
let TrustedSourceIdentityEntity = class TrustedSourceIdentityEntity extends db_1.WithTimestamps {
};
exports.TrustedSourceIdentityEntity = TrustedSourceIdentityEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], TrustedSourceIdentityEntity.prototype, "sourceId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], TrustedSourceIdentityEntity.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => trusted_source_entity_1.TrustedSourceEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sourceId' }),
    __metadata("design:type", trusted_source_entity_1.TrustedSourceEntity)
], TrustedSourceIdentityEntity.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], TrustedSourceIdentityEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", db_1.User)
], TrustedSourceIdentityEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], TrustedSourceIdentityEntity.prototype, "provenance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], TrustedSourceIdentityEntity.prototype, "status", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ nullable: true }),
    __metadata("design:type", Object)
], TrustedSourceIdentityEntity.prototype, "lastSeenAt", void 0);
exports.TrustedSourceIdentityEntity = TrustedSourceIdentityEntity = __decorate([
    (0, typeorm_1.Entity)('trusted_source_identity')
], TrustedSourceIdentityEntity);
//# sourceMappingURL=trusted-source-identity.entity.js.map