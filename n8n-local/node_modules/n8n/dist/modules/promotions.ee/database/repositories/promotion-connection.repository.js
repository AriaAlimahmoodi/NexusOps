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
exports.PromotionConnectionRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const promotion_connection_entity_1 = require("../entities/promotion-connection.entity");
const promotion_conflict_error_1 = require("../promotion-conflict.error");
let PromotionConnectionRepository = class PromotionConnectionRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(promotion_connection_entity_1.PromotionConnection, dataSource.manager, transactionRunner);
    }
    async findByIdWithProvider(id, ctx = {}) {
        return await this.managerFor(ctx).findOne(promotion_connection_entity_1.PromotionConnection, {
            where: { id },
            relations: { provider: true },
        });
    }
    async findInstanceConnection(ctx = {}) {
        return await this.managerFor(ctx).findOne(promotion_connection_entity_1.PromotionConnection, {
            where: { scope: 'instance' },
            relations: { provider: true },
        });
    }
    async insertConnection(connection, ctx = {}) {
        try {
            return await this.managerFor(ctx).save(promotion_connection_entity_1.PromotionConnection, this.create(connection));
        }
        catch (error) {
            if ((0, db_1.isUniqueConstraintError)(error)) {
                throw new promotion_conflict_error_1.PromotionConflictError('instance-connection', 'An instance promotion connection already exists');
            }
            throw error;
        }
    }
    async renameConnection(id, name) {
        await this.update({ id }, { name });
    }
    async updateConnection(id, expectedProviderId, changes) {
        const result = await this.update({ id, providerId: expectedProviderId }, changes);
        return result.affected === 1;
    }
    async deleteConnection(id) {
        await this.delete({ id });
    }
    async countByProviderId(providerId) {
        return await this.count({ where: { providerId } });
    }
    async listConnections(options) {
        const where = {};
        if (options.filter.scope)
            where.scope = options.filter.scope;
        if (options.filter.providerId)
            where.providerId = options.filter.providerId;
        if (options.limit <= 0)
            return { count: await this.count({ where }), data: [] };
        const [data, count] = await this.findAndCount({
            where,
            relations: { provider: true },
            order: { id: 'ASC' },
            skip: options.offset,
            take: options.limit,
        });
        return { count, data };
    }
};
exports.PromotionConnectionRepository = PromotionConnectionRepository;
exports.PromotionConnectionRepository = PromotionConnectionRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], PromotionConnectionRepository);
//# sourceMappingURL=promotion-connection.repository.js.map