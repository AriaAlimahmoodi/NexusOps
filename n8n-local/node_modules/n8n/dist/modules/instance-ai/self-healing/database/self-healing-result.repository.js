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
exports.SelfHealingResultRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const typeorm_1 = require("@n8n/typeorm");
const self_healing_result_entity_1 = require("./self-healing-result.entity");
const inboxState = `CASE WHEN result.dismissedAt IS NULL
	AND (result.suggestionId IS NULL OR suggestion.state = 'pending')
	THEN 'open' ELSE 'closed' END`;
let SelfHealingResultRepository = class SelfHealingResultRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner, sharedWorkflows) {
        super(self_healing_result_entity_1.SelfHealingResult, dataSource.manager, transactionRunner);
        this.sharedWorkflows = sharedWorkflows;
    }
    inboxQuery({ user, ...roles }) {
        const accessible = this.sharedWorkflows.buildSharedWorkflowIdsSubquery(user, roles);
        return this.createQueryBuilder('result')
            .innerJoin(db_1.SharedWorkflow, 'owner', 'owner.workflowId = result.workflowId AND owner.projectId = result.projectId AND owner.role = :resultOwnerRole', { resultOwnerRole: 'workflow:owner' })
            .leftJoin('result.suggestion', 'suggestion')
            .where(`result.workflowId IN (${accessible.getQuery()})`)
            .setParameters(accessible.getParameters());
    }
    async listForInbox(access, { state, limit, boundary }) {
        const query = this.inboxQuery(access)
            .innerJoin('result.workflow', 'workflow')
            .select([
            'result.id',
            'result.projectId',
            'result.workflowId',
            'result.summary',
            'result.outcome',
            'result.createdAt',
            'result.updatedAt',
            'result.completedAt',
            'workflow.name',
        ])
            .andWhere(`(${inboxState}) = :state`, { state })
            .orderBy('result.updatedAt', 'DESC')
            .addOrderBy('result.id', 'ASC');
        if (boundary?.mode === 'afterItem') {
            query.andWhere('(result.updatedAt < :updatedAt OR (result.updatedAt = :updatedAt AND result.id > :id))', { updatedAt: boundary.updatedAt, id: boundary.id });
        }
        else if (boundary) {
            const operator = boundary.mode === 'beforeOrAtTime' ? '<=' : '<';
            query.andWhere(`result.updatedAt ${operator} :updatedAt`, { updatedAt: boundary.updatedAt });
        }
        const rows = await query.limit(limit).getMany();
        return rows.map((row) => ({
            id: row.id,
            state,
            projectId: row.projectId,
            workflowId: row.workflowId,
            workflowName: row.workflow.name,
            summary: row.summary,
            outcome: row.outcome,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            completedAt: row.completedAt,
        }));
    }
    async countForInbox(access) {
        const counts = await this.inboxQuery(access)
            .select(inboxState, 'state')
            .addSelect('COUNT(*)', 'count')
            .groupBy(inboxState)
            .getRawMany();
        return {
            open: Number(counts.find((row) => row.state === 'open')?.count ?? 0),
            closed: Number(counts.find((row) => row.state === 'closed')?.count ?? 0),
        };
    }
    async getResult(id, scope, ctx = {}) {
        const result = await this.managerFor(ctx).findOneBy(self_healing_result_entity_1.SelfHealingResult, {
            id,
            workflowId: scope.workflowId,
            projectId: scope.projectId,
        });
        if (!result)
            throw new errors_1.NotFoundError('Self-healing result not found.');
        return result;
    }
    async createResult(input, ctx) {
        const manager = this.managerFor(ctx);
        return await manager.save(manager.create(self_healing_result_entity_1.SelfHealingResult, {
            ...input,
            dismissedAt: null,
            dismissedById: null,
        }));
    }
    async dismissResult(id, userId, ctx) {
        const result = await this.managerFor(ctx).update(self_healing_result_entity_1.SelfHealingResult, { id, dismissedAt: (0, typeorm_1.IsNull)() }, { dismissedAt: new Date(), dismissedById: userId });
        return result.affected === 1;
    }
};
exports.SelfHealingResultRepository = SelfHealingResultRepository;
exports.SelfHealingResultRepository = SelfHealingResultRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner, db_1.SharedWorkflowRepository])
], SelfHealingResultRepository);
//# sourceMappingURL=self-healing-result.repository.js.map