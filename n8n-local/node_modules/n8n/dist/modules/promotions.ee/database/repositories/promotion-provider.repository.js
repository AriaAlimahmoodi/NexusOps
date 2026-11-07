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
exports.PromotionProviderRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const promotion_provider_entity_1 = require("../entities/promotion-provider.entity");
const promotion_conflict_error_1 = require("../promotion-conflict.error");
let PromotionProviderRepository = class PromotionProviderRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(promotion_provider_entity_1.PromotionProvider, dataSource.manager, transactionRunner);
    }
    async findById(id, ctx = {}) {
        return await this.managerFor(ctx).findOne(promotion_provider_entity_1.PromotionProvider, { where: { id } });
    }
    async insertProvider(provider) {
        return await this.save(this.create(provider));
    }
    async updateProvider(id, changes) {
        await this.update({ id }, changes);
    }
    async updateProviderIfUnchanged(id, expected, changes) {
        const configUnchanged = this.manager.connection.options.type === 'postgres'
            ? 'CAST("config" AS jsonb) = CAST(:expectedConfig AS jsonb)'
            : '"config" = :expectedConfig';
        const result = await this.createQueryBuilder()
            .update(promotion_provider_entity_1.PromotionProvider)
            .set(changes)
            .where('"id" = :id', { id })
            .andWhere('"auth" = :expectedAuth', { expectedAuth: expected.auth })
            .andWhere(configUnchanged, { expectedConfig: JSON.stringify(expected.config) })
            .execute();
        return result.affected === 1;
    }
    async deleteProvider(id) {
        try {
            await this.delete({ id });
        }
        catch (error) {
            if ((0, db_1.isForeignKeyConstraintError)(error)) {
                throw new promotion_conflict_error_1.PromotionConflictError('provider-in-use', 'This provider is used by a connection');
            }
            throw error;
        }
    }
    async listProviders(options) {
        if (options.limit <= 0)
            return { count: await this.count(), data: [] };
        const [data, count] = await this.findAndCount({
            order: { id: 'ASC' },
            skip: options.offset,
            take: options.limit,
        });
        return { count, data };
    }
};
exports.PromotionProviderRepository = PromotionProviderRepository;
exports.PromotionProviderRepository = PromotionProviderRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], PromotionProviderRepository);
//# sourceMappingURL=promotion-provider.repository.js.map