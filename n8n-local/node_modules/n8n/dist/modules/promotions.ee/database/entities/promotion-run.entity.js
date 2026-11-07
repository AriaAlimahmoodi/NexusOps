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
exports.PromotionRun = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const uuid_1 = require("uuid");
const promotion_config_entity_1 = require("./promotion-config.entity");
const promotion_review_entity_1 = require("./promotion-review.entity");
let PromotionRun = class PromotionRun extends db_1.WithCreatedAt {
    generateId() {
        if (!this.id)
            this.id = (0, uuid_1.v7)();
    }
};
exports.PromotionRun = PromotionRun;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    __metadata("design:type", String)
], PromotionRun.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PromotionRun.prototype, "generateId", null);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], PromotionRun.prototype, "configId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], PromotionRun.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], PromotionRun.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PromotionRun.prototype, "createdById", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], PromotionRun.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PromotionRun.prototype, "reviewId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => promotion_config_entity_1.PromotionConfig, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'configId' }),
    __metadata("design:type", Object)
], PromotionRun.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'createdById' }),
    __metadata("design:type", Object)
], PromotionRun.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => promotion_review_entity_1.PromotionReview, (review) => review.runs, {
        onDelete: 'SET NULL',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'reviewId' }),
    __metadata("design:type", Object)
], PromotionRun.prototype, "review", void 0);
exports.PromotionRun = PromotionRun = __decorate([
    (0, typeorm_1.Entity)('promotion_run')
], PromotionRun);
//# sourceMappingURL=promotion-run.entity.js.map