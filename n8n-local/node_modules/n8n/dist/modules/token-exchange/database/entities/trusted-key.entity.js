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
exports.TrustedKeyEntity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const trusted_key_source_entity_1 = require("./trusted-key-source.entity");
let TrustedKeyEntity = class TrustedKeyEntity {
};
exports.TrustedKeyEntity = TrustedKeyEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 36 }),
    __metadata("design:type", String)
], TrustedKeyEntity.prototype, "sourceId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 255 }),
    __metadata("design:type", String)
], TrustedKeyEntity.prototype, "kid", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], TrustedKeyEntity.prototype, "data", void 0);
__decorate([
    (0, db_1.DateTimeColumn)(),
    __metadata("design:type", Date)
], TrustedKeyEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => trusted_key_source_entity_1.TrustedKeySourceEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sourceId' }),
    __metadata("design:type", Object)
], TrustedKeyEntity.prototype, "source", void 0);
exports.TrustedKeyEntity = TrustedKeyEntity = __decorate([
    (0, typeorm_1.Entity)('trusted_key')
], TrustedKeyEntity);
//# sourceMappingURL=trusted-key.entity.js.map