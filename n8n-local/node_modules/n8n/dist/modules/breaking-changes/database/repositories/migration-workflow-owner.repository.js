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
exports.MigrationWorkflowOwnerRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const migration_workflow_owner_entity_1 = require("../entities/migration-workflow-owner.entity");
let MigrationWorkflowOwnerRepository = class MigrationWorkflowOwnerRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(migration_workflow_owner_entity_1.MigrationWorkflowOwner, dataSource.manager, transactionRunner);
    }
    async findByWorkflowIds(workflowIds, ctx) {
        if (workflowIds.length === 0)
            return [];
        return await this.managerFor(ctx).find(migration_workflow_owner_entity_1.MigrationWorkflowOwner, {
            where: { workflowId: (0, typeorm_1.In)(workflowIds) },
        });
    }
    async assign(workflowId, userId, assignedById, ctx) {
        await this.managerFor(ctx).upsert(migration_workflow_owner_entity_1.MigrationWorkflowOwner, { workflowId, userId, source: 'assigned', assignedById, assignedAt: new Date() }, ['workflowId']);
    }
    async resetToSuggestion(workflowId, suggestedUserId, ctx) {
        await this.runInTransaction(ctx, async (manager) => {
            await manager.delete(migration_workflow_owner_entity_1.MigrationWorkflowOwner, { workflowId });
            if (!suggestedUserId)
                return;
            await manager.insert(migration_workflow_owner_entity_1.MigrationWorkflowOwner, {
                workflowId,
                userId: suggestedUserId,
                source: 'suggested',
                assignedById: null,
                assignedAt: null,
            });
        });
    }
    async replaceSuggestions(workflowIds, suggestions, ctx) {
        if (workflowIds.length === 0)
            return;
        await this.runInTransaction(ctx, async (manager) => {
            await manager.delete(migration_workflow_owner_entity_1.MigrationWorkflowOwner, {
                workflowId: (0, typeorm_1.In)(workflowIds),
                source: 'suggested',
            });
            const batch = new Set(workflowIds);
            const rows = suggestions
                .filter((suggestion) => batch.has(suggestion.workflowId))
                .map((suggestion) => ({
                ...suggestion,
                source: 'suggested',
                assignedById: null,
                assignedAt: null,
            }));
            if (rows.length === 0)
                return;
            await manager
                .createQueryBuilder()
                .insert()
                .into(migration_workflow_owner_entity_1.MigrationWorkflowOwner)
                .values(rows)
                .orIgnore()
                .execute();
        });
    }
};
exports.MigrationWorkflowOwnerRepository = MigrationWorkflowOwnerRepository;
exports.MigrationWorkflowOwnerRepository = MigrationWorkflowOwnerRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], MigrationWorkflowOwnerRepository);
//# sourceMappingURL=migration-workflow-owner.repository.js.map