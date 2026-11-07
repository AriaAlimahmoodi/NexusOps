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
exports.PromotionReviewRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const promotion_review_entity_1 = require("../entities/promotion-review.entity");
const OPEN_STATES = ['open', 'changes_requested'];
const TERMINAL_STATES = ['merged', 'closed'];
const LIST_RELATIONS = {
    connection: true,
    createdBy: true,
    approvedBy: true,
};
const DETAIL_RELATIONS = {
    connection: true,
    createdBy: true,
    approvedBy: true,
    runs: { config: { connection: true }, createdBy: true },
};
let PromotionReviewRepository = class PromotionReviewRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(promotion_review_entity_1.PromotionReview, dataSource.manager, transactionRunner);
    }
    async insertReview(review, ctx = {}) {
        return await this.managerFor(ctx).save(promotion_review_entity_1.PromotionReview, this.create(review));
    }
    async findByIdWithRelations(id) {
        return await this.findOne({ where: { id }, relations: DETAIL_RELATIONS });
    }
    async listReviews(options) {
        const where = {};
        if (options.tab === 'open')
            where.state = (0, typeorm_1.In)(OPEN_STATES);
        if (options.tab === 'closed')
            where.state = (0, typeorm_1.In)(TERMINAL_STATES);
        const [data, count] = await this.findAndCount({
            where,
            relations: LIST_RELATIONS,
            order: { createdAt: 'DESC', id: 'DESC' },
            skip: options.offset,
            take: options.limit,
        });
        return { count, data };
    }
};
exports.PromotionReviewRepository = PromotionReviewRepository;
exports.PromotionReviewRepository = PromotionReviewRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], PromotionReviewRepository);
//# sourceMappingURL=promotion-review.repository.js.map