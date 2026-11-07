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
exports.TypeAvailabilityPolicyRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const node_util_1 = require("node:util");
const type_availability_policy_entity_1 = require("../entities/type-availability-policy.entity");
function rulesEqual(a, b) {
    return (0, node_util_1.isDeepStrictEqual)([...a], [...b]);
}
let TypeAvailabilityPolicyRepository = class TypeAvailabilityPolicyRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(type_availability_policy_entity_1.TypeAvailabilityPolicy, dataSource.manager, transactionRunner);
    }
    forUpdateLock(manager) {
        return manager.connection.options.type === 'postgres'
            ? { lock: { mode: 'pessimistic_write' } }
            : {};
    }
    async findByIdAndKind(id, kind, ctx, forUpdate = false) {
        const manager = this.managerFor(ctx);
        return await manager.findOne(type_availability_policy_entity_1.TypeAvailabilityPolicy, {
            where: { id, kind },
            ...(forUpdate ? this.forUpdateLock(manager) : {}),
        });
    }
    async findManyByIds(ids, ctx, forUpdate = false) {
        if (ids.length === 0)
            return [];
        const manager = this.managerFor(ctx);
        const found = [];
        for (const batch of (0, db_1.chunkIds)([...ids].sort())) {
            const rows = await manager.find(type_availability_policy_entity_1.TypeAvailabilityPolicy, {
                where: { id: (0, typeorm_1.In)(batch) },
                order: { id: 'ASC' },
                ...(forUpdate ? this.forUpdateLock(manager) : {}),
            });
            found.push(...rows);
        }
        return found;
    }
    async findByKind(kind, ctx) {
        return await this.managerFor(ctx).findBy(type_availability_policy_entity_1.TypeAvailabilityPolicy, { kind });
    }
    async findPageByKind(kind, offset, limit, ctx) {
        const [items, count] = await this.managerFor(ctx).findAndCount(type_availability_policy_entity_1.TypeAvailabilityPolicy, {
            where: { kind },
            order: { createdAt: 'ASC', id: 'ASC' },
            skip: offset,
            take: limit,
        });
        return { items, count };
    }
    async createPolicy(input, ctx) {
        const policy = this.create({
            kind: input.kind,
            rules: [...input.rules],
            updatedBy: input.updatedBy,
            version: 1,
        });
        return await this.managerFor(ctx).save(type_availability_policy_entity_1.TypeAvailabilityPolicy, policy);
    }
    async updateRules(id, rules, updatedBy, ctx) {
        return await this.runInTransaction(ctx, async (tx) => {
            const policy = await tx.findOneBy(type_availability_policy_entity_1.TypeAvailabilityPolicy, { id });
            if (!policy)
                return null;
            if (rulesEqual(policy.rules, rules))
                return policy;
            await tx.update(type_availability_policy_entity_1.TypeAvailabilityPolicy, { id }, { rules: [...rules], updatedBy });
            await tx.increment(type_availability_policy_entity_1.TypeAvailabilityPolicy, { id }, 'version', 1);
            return await tx.findOneBy(type_availability_policy_entity_1.TypeAvailabilityPolicy, { id });
        });
    }
    async deletePolicy(id, ctx) {
        await this.managerFor(ctx).delete(type_availability_policy_entity_1.TypeAvailabilityPolicy, { id });
    }
};
exports.TypeAvailabilityPolicyRepository = TypeAvailabilityPolicyRepository;
exports.TypeAvailabilityPolicyRepository = TypeAvailabilityPolicyRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], TypeAvailabilityPolicyRepository);
//# sourceMappingURL=type-availability-policy.repository.js.map