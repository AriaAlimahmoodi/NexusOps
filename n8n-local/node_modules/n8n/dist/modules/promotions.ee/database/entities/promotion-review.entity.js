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
exports.PromotionReview = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const uuid_1 = require("uuid");
const promotion_connection_entity_1 = require("./promotion-connection.entity");
const promotion_run_entity_1 = require("./promotion-run.entity");
let PromotionReview = class PromotionReview extends db_1.WithCreatedAt {
    generateId() {
        if (!this.id)
            this.id = (0, uuid_1.v7)();
    }
};
exports.PromotionReview = PromotionReview;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    __metadata("design:type", String)
], PromotionReview.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PromotionReview.prototype, "generateId", null);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], PromotionReview.prototype, "connectionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], PromotionReview.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], PromotionReview.prototype, "remoteReviewId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: 'open' }),
    __metadata("design:type", String)
], PromotionReview.prototype, "state", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ nullable: true }),
    __metadata("design:type", Object)
], PromotionReview.prototype, "lastStateChangeAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PromotionReview.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PromotionReview.prototype, "approvedById", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ nullable: true }),
    __metadata("design:type", Object)
], PromotionReview.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => promotion_connection_entity_1.PromotionConnection, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'connectionId' }),
    __metadata("design:type", Object)
], PromotionReview.prototype, "connection", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'createdById' }),
    __metadata("design:type", Object)
], PromotionReview.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'approvedById' }),
    __metadata("design:type", Object)
], PromotionReview.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => promotion_run_entity_1.PromotionRun, (run) => run.review),
    __metadata("design:type", Array)
], PromotionReview.prototype, "runs", void 0);
exports.PromotionReview = PromotionReview = __decorate([
    (0, typeorm_1.Entity)('promotion_review'),
    (0, typeorm_1.Index)(['state', 'createdAt']),
    (0, typeorm_1.Index)(['connectionId', 'remoteReviewId'], {
        unique: true,
        where: '"remoteReviewId" IS NOT NULL',
    })
], PromotionReview);
//# sourceMappingURL=promotion-review.entity.js.map