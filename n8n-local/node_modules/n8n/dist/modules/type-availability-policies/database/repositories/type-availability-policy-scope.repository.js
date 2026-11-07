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
exports.TypeAvailabilityPolicyScopeRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const type_availability_policy_scope_entity_1 = require("../entities/type-availability-policy-scope.entity");
const isProjectScope = (scope) => scope.projectId !== null;
let TypeAvailabilityPolicyScopeRepository = class TypeAvailabilityPolicyScopeRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, dataSource.manager, transactionRunner);
    }
    forUpdateLock(manager) {
        return manager.connection.options.type === 'postgres'
            ? { lock: { mode: 'pessimistic_write' } }
            : {};
    }
    async findScopeByKindAndProject(kind, projectId, ctx, forUpdate = false) {
        const manager = this.managerFor(ctx);
        return await manager.findOne(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, {
            where: { kind, projectId: projectId ?? (0, typeorm_1.IsNull)() },
            ...(forUpdate ? this.forUpdateLock(manager) : {}),
        });
    }
    async findScopeById(id, ctx, forUpdate = false) {
        const manager = this.managerFor(ctx);
        return await manager.findOne(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, {
            where: { id },
            ...(forUpdate ? this.forUpdateLock(manager) : {}),
        });
    }
    async findScopeByIdAndKind(id, kind, ctx, forUpdate = false) {
        const manager = this.managerFor(ctx);
        return await manager.findOne(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, {
            where: { id, kind },
            ...(forUpdate ? this.forUpdateLock(manager) : {}),
        });
    }
    async lockScopesByIds(ids, ctx) {
        if (ids.length === 0)
            return [];
        const manager = this.managerFor(ctx);
        const found = [];
        for (const batch of (0, db_1.chunkIds)([...ids].sort())) {
            const rows = await manager.find(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, {
                select: { id: true },
                where: { id: (0, typeorm_1.In)(batch) },
                order: { id: 'ASC' },
                ...this.forUpdateLock(manager),
            });
            found.push(...rows.map((row) => row.id));
        }
        return found;
    }
    async findAllScopes(ctx) {
        return await this.managerFor(ctx).find(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope);
    }
    async readFingerprint(ctx) {
        const row = await this.managerFor(ctx)
            .createQueryBuilder(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, 'scope')
            .select('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(scope.version), 0)', 'versionSum')
            .addSelect('MAX(scope.createdAt)', 'newestCreatedAt')
            .getRawOne();
        return {
            count: Number(row?.count ?? 0),
            versionSum: Number(row?.versionSum ?? 0),
            newestCreatedAt: row?.newestCreatedAt ? new Date(row.newestCreatedAt).getTime() : 0,
        };
    }
    async findProjectScopes(kind, ctx) {
        const scopes = await this.managerFor(ctx).findBy(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, {
            kind,
            projectId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
        });
        return scopes.filter(isProjectScope);
    }
    async containsProjectScope(ids, ctx) {
        const manager = this.managerFor(ctx);
        for (const batch of (0, db_1.chunkIds)(ids)) {
            const count = await manager.count(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, {
                where: { id: (0, typeorm_1.In)(batch), projectId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) },
            });
            if (count > 0)
                return true;
        }
        return false;
    }
    async createScopeIfAbsent(input, ctx) {
        return await this.runInTransaction(ctx, async (tx, txCtx) => {
            const id = (0, db_1.generateNanoId)();
            await tx
                .createQueryBuilder()
                .insert()
                .into(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope)
                .values(this.create({ ...input, id, version: 1 }))
                .orIgnore()
                .execute();
            const scope = await this.findScopeByKindAndProject(input.kind, input.projectId, txCtx, true);
            if (!scope) {
                throw new n8n_workflow_1.UnexpectedError('Policy scope is missing right after insert-or-ignore');
            }
            return { scope, created: scope.id === id };
        });
    }
    async updateDefaultAction(id, defaultAction, updatedBy, ctx) {
        return await this.runInTransaction(ctx, async (tx) => {
            const scope = await tx.findOneBy(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, { id });
            if (!scope)
                return null;
            if (scope.defaultAction === defaultAction)
                return scope;
            await tx.update(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, { id }, { defaultAction, updatedBy });
            await tx.increment(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, { id }, 'version', 1);
            return await tx.findOneBy(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, { id });
        });
    }
    async bumpVersion(id, ctx) {
        await this.managerFor(ctx).increment(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, { id }, 'version', 1);
    }
    async bumpVersions(ids, ctx) {
        if (ids.length === 0)
            return;
        const batches = (0, db_1.chunkIds)(ids);
        if (batches.length === 1) {
            await this.managerFor(ctx).increment(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, { id: (0, typeorm_1.In)(batches[0]) }, 'version', 1);
            return;
        }
        await this.runInTransaction(ctx, async (tx) => {
            for (const batch of batches) {
                await tx.increment(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, { id: (0, typeorm_1.In)(batch) }, 'version', 1);
            }
        });
    }
};
exports.TypeAvailabilityPolicyScopeRepository = TypeAvailabilityPolicyScopeRepository;
exports.TypeAvailabilityPolicyScopeRepository = TypeAvailabilityPolicyScopeRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], TypeAvailabilityPolicyScopeRepository);
//# sourceMappingURL=type-availability-policy-scope.repository.js.map