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
exports.PromotionConfigRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const promotion_config_entity_1 = require("../entities/promotion-config.entity");
const promotion_conflict_error_1 = require("../promotion-conflict.error");
let PromotionConfigRepository = class PromotionConfigRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(promotion_config_entity_1.PromotionConfig, dataSource.manager, transactionRunner);
    }
    async findResolved(connectionId, direction, ctx = {}) {
        return await this.managerFor(ctx).findOne(promotion_config_entity_1.PromotionConfig, {
            where: { connectionId, direction },
            relations: { connection: { provider: true } },
        });
    }
    async findById(id, ctx = {}) {
        return await this.managerFor(ctx).findOne(promotion_config_entity_1.PromotionConfig, { where: { id } });
    }
    async findByConnectionAndDirection(connectionId, direction, ctx = {}) {
        return await this.managerFor(ctx).findOne(promotion_config_entity_1.PromotionConfig, {
            where: { connectionId, direction },
        });
    }
    async findByConnectionIds(connectionIds, ctx = {}) {
        if (connectionIds.length === 0)
            return [];
        return await this.managerFor(ctx).find(promotion_config_entity_1.PromotionConfig, {
            where: { connectionId: (0, typeorm_1.In)(connectionIds) },
            order: { direction: 'ASC' },
        });
    }
    async insertConfig(config, ctx = {}) {
        try {
            return await this.managerFor(ctx).save(promotion_config_entity_1.PromotionConfig, this.create(config));
        }
        catch (error) {
            if ((0, db_1.isUniqueConstraintError)(error)) {
                throw new promotion_conflict_error_1.PromotionConflictError('config-direction', `This connection already has a ${config.direction} configuration`);
            }
            throw error;
        }
    }
    async replaceConfig(id, changes, ctx = {}) {
        await this.managerFor(ctx).update(promotion_config_entity_1.PromotionConfig, { id }, changes);
    }
    async deleteConfig(id) {
        await this.delete({ id });
    }
};
exports.PromotionConfigRepository = PromotionConfigRepository;
exports.PromotionConfigRepository = PromotionConfigRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], PromotionConfigRepository);
//# sourceMappingURL=promotion-config.repository.js.map