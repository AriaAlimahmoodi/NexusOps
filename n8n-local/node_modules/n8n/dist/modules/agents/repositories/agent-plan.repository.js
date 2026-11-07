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
exports.AgentPlanRepository = exports.AgentPlanWriteConflictError = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const agent_plan_history_entity_1 = require("../entities/agent-plan-history.entity");
const agent_plan_entity_1 = require("../entities/agent-plan.entity");
class AgentPlanWriteConflictError extends n8n_workflow_1.UserError {
    constructor() {
        super('The plan write conflicts with the stored state');
    }
}
exports.AgentPlanWriteConflictError = AgentPlanWriteConflictError;
let AgentPlanRepository = class AgentPlanRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_plan_entity_1.AgentPlan, dataSource.manager, transactionRunner);
    }
    async createActivePlan(input, ctx) {
        if (!(0, uuid_1.validate)(input.id))
            throw new n8n_workflow_1.UserError('The plan ID must be a UUID');
        this.validateVersion(input.formatVersion);
        const data = this.serializeData(input.data);
        return await this.runInTransaction(ctx, async (manager) => {
            const now = new Date();
            try {
                await manager
                    .createQueryBuilder()
                    .insert()
                    .into(agent_plan_entity_1.AgentPlan)
                    .values({
                    id: input.id,
                    threadId: input.threadId,
                    formatVersion: input.formatVersion,
                    data: () => ':planData',
                    revision: 1,
                    closedAt: null,
                    createdAt: now,
                    updatedAt: now,
                })
                    .setParameter('planData', data)
                    .execute();
            }
            catch (error) {
                if ((0, db_1.isUniqueConstraintError)(error))
                    throw new AgentPlanWriteConflictError();
                throw error;
            }
            const plan = await manager.findOneByOrFail(agent_plan_entity_1.AgentPlan, {
                id: input.id,
                threadId: input.threadId,
            });
            await this.insertSnapshot(manager, plan);
            return plan;
        });
    }
    async findActivePlan(threadId, ctx) {
        return await this.managerFor(ctx).findOneBy(agent_plan_entity_1.AgentPlan, { threadId, closedAt: (0, typeorm_1.IsNull)() });
    }
    async findPlan(threadId, planId, ctx) {
        return await this.managerFor(ctx).findOneBy(agent_plan_entity_1.AgentPlan, { id: planId, threadId });
    }
    async findRevision(threadId, planId, revision, ctx) {
        return await this.managerFor(ctx).findOne(agent_plan_history_entity_1.AgentPlanHistory, {
            where: { planId, revision, plan: { threadId } },
        });
    }
    async listHistory(threadId, planId, options, ctx) {
        const limit = options.limit ?? 50;
        const afterRevision = options.afterRevision ?? 0;
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new n8n_workflow_1.UserError('The history limit must be an integer between 1 and 100');
        }
        if (!Number.isSafeInteger(afterRevision) || afterRevision < 0) {
            throw new n8n_workflow_1.UserError('The history cursor must be a non-negative integer');
        }
        const rows = await this.managerFor(ctx).find(agent_plan_history_entity_1.AgentPlanHistory, {
            where: { planId, plan: { threadId }, revision: (0, typeorm_1.MoreThan)(afterRevision) },
            select: {
                planId: true,
                revision: true,
                formatVersion: true,
                closedAt: true,
                createdAt: true,
            },
            order: { revision: 'ASC' },
            take: limit + 1,
        });
        const items = rows.slice(0, limit).map(({ revision, formatVersion, closedAt, createdAt }) => ({
            revision,
            formatVersion,
            closedAt,
            createdAt,
        }));
        return {
            items,
            nextCursor: rows.length > limit ? items[items.length - 1].revision : null,
        };
    }
    async replacePlan(input, ctx) {
        this.validateVersion(input.formatVersion);
        return await this.writeRevision(input, { ...input, data: this.serializeData(input.data) }, ctx);
    }
    async closePlan(input, ctx) {
        return await this.writeRevision(input, null, ctx);
    }
    async writeRevision(input, document, ctx) {
        this.validateVersion(input.expectedRevision);
        return await this.runInTransaction(ctx, async (manager) => {
            const now = new Date();
            const query = manager
                .createQueryBuilder()
                .update(agent_plan_entity_1.AgentPlan)
                .set({
                revision: () => 'revision + 1',
                updatedAt: now,
                ...(document
                    ? { formatVersion: document.formatVersion, data: () => ':planData' }
                    : { closedAt: now }),
            })
                .where({
                id: input.planId,
                threadId: input.threadId,
                revision: input.expectedRevision,
                closedAt: (0, typeorm_1.IsNull)(),
            });
            if (document)
                query.setParameter('planData', document.data);
            const result = await query.execute();
            if (result.affected !== 1)
                throw new AgentPlanWriteConflictError();
            const plan = await manager.findOneByOrFail(agent_plan_entity_1.AgentPlan, {
                id: input.planId,
                threadId: input.threadId,
            });
            await this.insertSnapshot(manager, plan);
            return plan;
        });
    }
    async insertSnapshot(manager, plan) {
        await manager
            .createQueryBuilder()
            .insert()
            .into(agent_plan_history_entity_1.AgentPlanHistory)
            .values({
            planId: plan.id,
            revision: plan.revision,
            formatVersion: plan.formatVersion,
            data: () => ':planData',
            closedAt: plan.closedAt,
            createdAt: plan.updatedAt,
        })
            .setParameter('planData', JSON.stringify(plan.data))
            .execute();
    }
    validateVersion(value) {
        if (!Number.isInteger(value) || value < 1 || value > 2_147_483_647) {
            throw new n8n_workflow_1.UserError('Plan versions must be positive 32-bit integers');
        }
    }
    serializeData(data) {
        if (!(0, is_record_1.isRecord)(data))
            throw new n8n_workflow_1.UserError('The plan document must be a JSON object');
        return JSON.stringify(data);
    }
};
exports.AgentPlanRepository = AgentPlanRepository;
exports.AgentPlanRepository = AgentPlanRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentPlanRepository);
//# sourceMappingURL=agent-plan.repository.js.map