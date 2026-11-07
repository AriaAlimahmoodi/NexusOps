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
exports.TrustedSourceEntity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let TrustedSourceEntity = class TrustedSourceEntity extends db_1.WithTimestampsAndStringId {
};
exports.TrustedSourceEntity = TrustedSourceEntity;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, unique: true }),
    __metadata("design:type", String)
], TrustedSourceEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], TrustedSourceEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: true }),
    __metadata("design:type", String)
], TrustedSourceEntity.prototype, "issuer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], TrustedSourceEntity.prototype, "managedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], TrustedSourceEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TrustedSourceEntity.prototype, "lastError", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ nullable: true }),
    __metadata("design:type", Object)
], TrustedSourceEntity.prototype, "lastCheckedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], TrustedSourceEntity.prototype, "configVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TrustedSourceEntity.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TrustedSourceEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], TrustedSourceEntity.prototype, "discoveryClaimToken", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ nullable: true }),
    __metadata("design:type", Object)
], TrustedSourceEntity.prototype, "discoveryClaimedAt", void 0);
exports.TrustedSourceEntity = TrustedSourceEntity = __decorate([
    (0, typeorm_1.Entity)('trusted_source')
], TrustedSourceEntity);
//# sourceMappingURL=trusted-source.entity.js.map