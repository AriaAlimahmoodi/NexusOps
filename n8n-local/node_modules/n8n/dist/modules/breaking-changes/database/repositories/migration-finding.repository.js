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
exports.MigrationFindingRepository = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const migration_finding_entity_1 = require("../entities/migration-finding.entity");
const LISTED_STATUSES = api_types_1.migrationFindingListedStatusSchema.options;
const UNRESOLVED_STATUSES = ['open', 'notified'];
function hasListedStatus(finding) {
    return api_types_1.migrationFindingListedStatusSchema.safeParse(finding.status).success;
}
function triagePatch(status) {
    return {
        status,
        statusChangedAt: new Date(),
        ...(status === 'open' ? { notifiedAt: null } : {}),
    };
}
function chunksOrAll(workflowIds) {
    return workflowIds === undefined ? [undefined] : (0, db_1.chunkIds)(workflowIds);
}
let MigrationFindingRepository = class MigrationFindingRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(migration_finding_entity_1.MigrationFinding, dataSource.manager, transactionRunner);
    }
    async listForWorkflows(targetVersion, workflowIds, ctx) {
        if (workflowIds.length === 0)
            return [];
        return await this.managerFor(ctx).find(migration_finding_entity_1.MigrationFinding, {
            where: { targetVersion, workflowId: (0, typeorm_1.In)(workflowIds) },
            order: { id: 'ASC' },
        });
    }
    async countUnresolvedByRule(targetVersion, workflowIds, ctx) {
        return await this.countByRuleWithStatus(targetVersion, UNRESOLVED_STATUSES, workflowIds, ctx);
    }
    async countWontFixByRule(targetVersion, workflowIds, ctx) {
        return await this.countByRuleWithStatus(targetVersion, ['wont_fix'], workflowIds, ctx);
    }
    async countDistinctUnresolvedWorkflows(targetVersion, workflowIds, ctx) {
        let total = 0;
        for (const chunk of chunksOrAll(workflowIds)) {
            const query = this.managerFor(ctx)
                .createQueryBuilder(migration_finding_entity_1.MigrationFinding, 'finding')
                .select('COUNT(DISTINCT finding.workflowId)', 'count')
                .where('finding.targetVersion = :targetVersion', { targetVersion })
                .andWhere('finding.status IN (:...statuses)', { statuses: UNRESOLVED_STATUSES });
            if (chunk)
                query.andWhere('finding.workflowId IN (:...workflowIds)', { workflowIds: chunk });
            const row = await query.getRawOne();
            total += Number(row?.count ?? 0);
        }
        return total;
    }
    async listWorkflowIdsWithUnresolvedFindings(targetVersion, workflowIds, ctx) {
        if (workflowIds.length === 0)
            return [];
        const rows = await this.managerFor(ctx).find(migration_finding_entity_1.MigrationFinding, {
            select: { workflowId: true },
            where: { targetVersion, status: (0, typeorm_1.In)(UNRESOLVED_STATUSES), workflowId: (0, typeorm_1.In)(workflowIds) },
        });
        return [...new Set(rows.map((row) => row.workflowId))];
    }
    async listTriageableForRule(targetVersion, ruleId, workflowIds, ctx) {
        const findings = [];
        for (const chunk of chunksOrAll(workflowIds)) {
            const rows = await this.managerFor(ctx).find(migration_finding_entity_1.MigrationFinding, {
                select: {
                    id: true,
                    ruleId: true,
                    workflowId: true,
                    status: true,
                    notifiedAt: true,
                    workflow: { id: true, name: true, activeVersionId: true, updatedAt: true },
                },
                where: {
                    targetVersion,
                    ruleId,
                    status: (0, typeorm_1.In)(LISTED_STATUSES),
                    ...(chunk ? { workflowId: (0, typeorm_1.In)(chunk) } : {}),
                },
                relations: { workflow: true },
            });
            findings.push(...rows);
        }
        return findings.sort((a, b) => a.id - b.id).filter(hasListedStatus);
    }
    async setTriageStatus(targetVersion, ruleId, workflowId, status, ctx) {
        const manager = this.managerFor(ctx);
        const finding = await manager.findOne(migration_finding_entity_1.MigrationFinding, {
            select: { id: true, status: true },
            where: { targetVersion, ruleId, workflowId, status: (0, typeorm_1.In)(LISTED_STATUSES) },
        });
        if (!finding)
            return false;
        if (finding.status === status)
            return true;
        const result = await manager.update(migration_finding_entity_1.MigrationFinding, { id: finding.id, status: (0, typeorm_1.In)(LISTED_STATUSES) }, triagePatch(status));
        return (result.affected ?? 0) > 0;
    }
    async setTriageStatusForWorkflows(targetVersion, ruleId, workflowIds, status, ctx) {
        const otherListedStatuses = LISTED_STATUSES.filter((listed) => listed !== status);
        await this.runInTransaction(ctx, async (manager) => {
            for (const chunk of (0, db_1.chunkIds)(workflowIds)) {
                await manager.update(migration_finding_entity_1.MigrationFinding, { targetVersion, ruleId, workflowId: (0, typeorm_1.In)(chunk), status: (0, typeorm_1.In)(otherListedStatuses) }, triagePatch(status));
            }
        });
    }
    async insertMany(findings, ctx) {
        if (findings.length === 0)
            return;
        const statusChangedAt = new Date();
        await this.managerFor(ctx)
            .createQueryBuilder()
            .insert()
            .into(migration_finding_entity_1.MigrationFinding)
            .values(findings.map((finding) => ({ ...finding, status: 'open', statusChangedAt })))
            .orIgnore()
            .execute();
    }
    async updateStatusForIds(ids, status, note, ctx) {
        if (ids.length === 0)
            return;
        const manager = this.managerFor(ctx);
        await this.transitionStatus(manager, ids, status);
        if (note !== undefined) {
            await manager.update(migration_finding_entity_1.MigrationFinding, { id: (0, typeorm_1.In)(ids) }, { note });
        }
    }
    async countByRuleWithStatus(targetVersion, statuses, workflowIds, ctx) {
        const countByRule = new Map();
        for (const chunk of chunksOrAll(workflowIds)) {
            const query = this.managerFor(ctx)
                .createQueryBuilder(migration_finding_entity_1.MigrationFinding, 'finding')
                .select('finding.ruleId', 'ruleId')
                .addSelect('COUNT(finding.id)', 'count')
                .where('finding.targetVersion = :targetVersion', { targetVersion })
                .andWhere('finding.status IN (:...statuses)', { statuses })
                .groupBy('finding.ruleId');
            if (chunk)
                query.andWhere('finding.workflowId IN (:...workflowIds)', { workflowIds: chunk });
            const rows = await query.getRawMany();
            for (const row of rows) {
                countByRule.set(row.ruleId, (countByRule.get(row.ruleId) ?? 0) + Number(row.count));
            }
        }
        return [...countByRule].map(([ruleId, count]) => ({ ruleId, count }));
    }
    async transitionStatus(manager, ids, status) {
        await manager.update(migration_finding_entity_1.MigrationFinding, { id: (0, typeorm_1.In)(ids), status: (0, typeorm_1.Not)(status) }, { status, statusChangedAt: new Date() });
    }
    async markFixedForIds(ids, ctx) {
        await this.updateStatusForIds(ids, 'fixed', undefined, ctx);
    }
    async markNotifiedForIds(ids, ctx) {
        if (ids.length === 0)
            return;
        await this.runInTransaction(ctx, async (manager) => {
            await manager.update(migration_finding_entity_1.MigrationFinding, { id: (0, typeorm_1.In)(ids), status: 'open' }, { status: 'notified', statusChangedAt: new Date() });
            await manager.update(migration_finding_entity_1.MigrationFinding, { id: (0, typeorm_1.In)(ids), status: 'notified' }, { notifiedAt: new Date() });
        });
    }
};
exports.MigrationFindingRepository = MigrationFindingRepository;
exports.MigrationFindingRepository = MigrationFindingRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], MigrationFindingRepository);
//# sourceMappingURL=migration-finding.repository.js.map