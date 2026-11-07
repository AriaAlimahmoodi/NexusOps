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
exports.TrustedKeySourceEntity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let TrustedKeySourceEntity = class TrustedKeySourceEntity extends db_1.WithTimestamps {
};
exports.TrustedKeySourceEntity = TrustedKeySourceEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], TrustedKeySourceEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], TrustedKeySourceEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], TrustedKeySourceEntity.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: 'pending' }),
    __metadata("design:type", String)
], TrustedKeySourceEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TrustedKeySourceEntity.prototype, "lastError", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ nullable: true }),
    __metadata("design:type", Object)
], TrustedKeySourceEntity.prototype, "lastRefreshedAt", void 0);
exports.TrustedKeySourceEntity = TrustedKeySourceEntity = __decorate([
    (0, typeorm_1.Entity)('trusted_key_source')
], TrustedKeySourceEntity);
//# sourceMappingURL=trusted-key-source.entity.js.map