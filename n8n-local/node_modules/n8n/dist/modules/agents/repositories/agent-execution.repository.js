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
exports.AgentExecutionRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const agent_execution_entity_1 = require("../entities/agent-execution.entity");
const agent_execution_message_link_entity_1 = require("../entities/agent-execution-message-link.entity");
const agent_message_entity_1 = require("../entities/agent-message.entity");
let AgentExecutionRepository = class AgentExecutionRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_execution_entity_1.AgentExecution, dataSource.manager, transactionRunner);
    }
    async saveInContext(execution, ctx) {
        return await this.managerFor(ctx).save(execution);
    }
    async findByThreadIdOrdered(threadId) {
        return await this.find({ where: { threadId }, order: { createdAt: 'ASC', id: 'ASC' } });
    }
    async findRunning() {
        return await this.find({
            select: ['id', 'threadId', 'startedAt', 'updatedAt', 'timeline'],
            where: { status: 'running' },
        });
    }
    async existsRunningByThread(threadId, ctx = {}) {
        return await this.managerFor(ctx).existsBy(agent_execution_entity_1.AgentExecution, { threadId, status: 'running' });
    }
    async findRunningByThread(threadId, ctx) {
        return await this.managerFor(ctx).findBy(agent_execution_entity_1.AgentExecution, { threadId, status: 'running' });
    }
    async findExecution(executionId, ctx = {}) {
        return await this.managerFor(ctx).findOneBy(agent_execution_entity_1.AgentExecution, { id: executionId });
    }
    async findLatestByThreadId(threadId) {
        return await this.findOne({ where: { threadId }, order: { createdAt: 'DESC', id: 'DESC' } });
    }
    async touchRunning(executionId) {
        const result = await this.update({ id: executionId, status: 'running' }, { updatedAt: new Date() });
        return result.affected === 1;
    }
    async updateTimelineIfRunning(executionId, timeline, ctx = {}) {
        const result = await this.managerFor(ctx).update(agent_execution_entity_1.AgentExecution, { id: executionId, status: 'running' }, {
            timeline,
            updatedAt: new Date(),
        });
        return result.affected === 1;
    }
    async findSteerable(threadId, ctx = {}) {
        return await this.managerFor(ctx).findOne(agent_execution_entity_1.AgentExecution, {
            select: ['id'],
            where: {
                threadId,
                status: 'running',
                acceptsSteering: true,
            },
        });
    }
    async closeSteering(threadId, executionId, ctx) {
        await this.managerFor(ctx).update(agent_execution_entity_1.AgentExecution, { id: executionId, threadId, acceptsSteering: true }, {
            acceptsSteering: false,
        });
    }
    async updateIfRunning(executionId, values, staleBefore, ctx = {}, costIncrement) {
        const current = await this.managerFor(ctx).findOne(agent_execution_entity_1.AgentExecution, {
            select: ['timeline'],
            where: { id: executionId, status: 'running' },
        });
        const inputIds = new Set(values.timeline?.filter((event) => event.type === 'input').map((event) => event.messageId));
        if (current?.timeline?.some((event) => event.type === 'input' && !inputIds.has(event.messageId)))
            return false;
        const setValues = {
            ...values,
            acceptsSteering: false,
        };
        const params = { executionId, status: 'running' };
        if (costIncrement !== undefined && costIncrement > 0) {
            setValues.cost = () => 'COALESCE(cost, 0) + :costIncrement';
            params.costIncrement = costIncrement;
        }
        const qb = this.managerFor(ctx)
            .createQueryBuilder()
            .update(agent_execution_entity_1.AgentExecution)
            .set(setValues)
            .where('id = :executionId', { executionId })
            .andWhere('status = :status', { status: 'running' });
        if (staleBefore) {
            qb.andWhere('updatedAt <= :staleBefore', { staleBefore });
            params.staleBefore = staleBefore;
        }
        const result = await qb.setParameters(params).execute();
        return result.affected === 1;
    }
    async moveTimelineToBlob(executionId, storedAt) {
        await this.update({ id: executionId, storedAt: 'db' }, { storedAt, timeline: null });
    }
    async findTimelineStorageLocation(executionId) {
        const execution = await this.findOne({ select: ['storedAt'], where: { id: executionId } });
        return execution?.storedAt ?? null;
    }
    async findFirstUserMessageByThreadIds(threadIds) {
        if (threadIds.length === 0)
            return new Map();
        const isPostgres = this.manager.connection.options.type === 'postgres';
        const originalText = isPostgres
            ? "message.content->'content'->0->>'text'"
            : "json_extract(message.content, '$.content[0].text')";
        const hidden = isPostgres
            ? "message.origin->>'hidden'"
            : "json_extract(message.origin, '$.hidden')";
        const input = `CASE WHEN input.messageId IS NULL THEN e.userMessage WHEN CAST(${hidden} AS TEXT) IN ('true', '1') THEN NULL ELSE ${originalText} END`;
        const candidates = this.createQueryBuilder('e')
            .leftJoin(agent_execution_message_link_entity_1.AgentExecutionMessageLink, 'input', "input.executionId = e.id AND input.direction = 'input' AND input.position = 0")
            .leftJoin(agent_message_entity_1.AgentMessageEntity, 'message', 'message.id = input.messageId')
            .select('e.threadId', 'threadId')
            .addSelect(input, 'userMessage')
            .addSelect('ROW_NUMBER() OVER (PARTITION BY e.threadId ORDER BY e.createdAt, e.id)', 'rowNumber')
            .where('e.threadId IN (:...threadIds)', { threadIds })
            .andWhere(`${input} IS NOT NULL AND TRIM(${input}) != ''`);
        const rows = await this.manager
            .createQueryBuilder()
            .select('preview."threadId"', 'threadId')
            .addSelect('preview."userMessage"', 'userMessage')
            .from(`(${candidates.getQuery()})`, 'preview')
            .where('preview."rowNumber" = 1')
            .setParameters(candidates.getParameters())
            .getRawMany();
        return new Map(rows.map((r) => [r.threadId, r.userMessage]));
    }
    async findFirstSourceByThreadIds(threadIds, ctx = {}) {
        if (threadIds.length === 0)
            return new Map();
        const tableName = this.metadata.tablePath;
        const rows = await this.managerFor(ctx)
            .getRepository(agent_execution_entity_1.AgentExecution)
            .createQueryBuilder('e')
            .select(['e."threadId" AS "threadId"', 'e."source" AS "source"'])
            .where('e."threadId" IN (:...threadIds)', { threadIds })
            .andWhere('e."source" IS NOT NULL')
            .andWhere(`e.id = (SELECT e2.id FROM ${tableName} e2 ` +
            'WHERE e2."threadId" = e."threadId" AND e2."source" IS NOT NULL ' +
            'ORDER BY e2."createdAt" ASC, e2.id ASC LIMIT 1)')
            .getRawMany();
        const sources = new Map(rows.map((r) => [r.threadId, r.source]));
        const unrecorded = threadIds.filter((id) => !sources.has(id));
        if (unrecorded.length === 0)
            return sources;
        const inputs = await this.managerFor(ctx).find(agent_message_entity_1.AgentMessageEntity, {
            where: { threadId: (0, typeorm_1.In)(unrecorded), origin: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) },
            order: { createdAt: 'ASC', id: 'ASC' },
        });
        for (const input of inputs) {
            const source = input.origin?.source;
            if (source && !sources.has(input.threadId))
                sources.set(input.threadId, source);
        }
        return sources;
    }
    async findLatestStatusesByThreadIds(threadIds) {
        if (threadIds.length === 0)
            return new Map();
        const tableName = this.metadata.tablePath;
        const rows = await this.createQueryBuilder('e')
            .select(['e."threadId" AS "threadId"', 'e."status" AS "status"'])
            .where('e."threadId" IN (:...threadIds)', { threadIds })
            .andWhere(`e.id = (SELECT e2.id FROM ${tableName} e2 ` +
            'WHERE e2."threadId" = e."threadId" ' +
            'ORDER BY e2."createdAt" DESC, e2.id DESC LIMIT 1)')
            .getRawMany();
        return new Map(rows.map((row) => [row.threadId, row.status]));
    }
    async findFailureSummariesByThreadIds(threadIds) {
        if (threadIds.length === 0)
            return new Map();
        const executions = await this.createQueryBuilder('e')
            .select(['e.id', 'e.threadId', 'e.failureSummary'])
            .where('e."threadId" IN (:...threadIds)', { threadIds })
            .andWhere('e."failureSummary" IS NOT NULL')
            .getMany();
        const summaries = new Map();
        for (const execution of executions) {
            const summary = execution.failureSummary;
            if (!summary)
                continue;
            const latest = { ...summary.latest, executionId: execution.id };
            const current = summaries.get(execution.threadId);
            if (!current) {
                summaries.set(execution.threadId, { count: summary.count, latest });
                continue;
            }
            current.count += summary.count;
            if (latest.occurredAt >= current.latest.occurredAt)
                current.latest = latest;
        }
        return summaries;
    }
    async findSuspendedWithoutModel(threadId) {
        return await this.find({
            where: { threadId, hitlStatus: 'suspended', model: (0, typeorm_1.IsNull)() },
        });
    }
    async findLatestSuspendedByThreadId(threadId) {
        return await this.findOne({
            where: { threadId, hitlStatus: 'suspended' },
            order: { createdAt: 'DESC' },
        });
    }
    async backfillModel(executionIds, model) {
        if (executionIds.length === 0)
            return;
        await this.createQueryBuilder()
            .update(agent_execution_entity_1.AgentExecution)
            .set({ model })
            .whereInIds(executionIds)
            .execute();
    }
    async incrementCost(executionId, cost, ctx = {}) {
        if (cost <= 0)
            return;
        await this.managerFor(ctx)
            .createQueryBuilder()
            .update(agent_execution_entity_1.AgentExecution)
            .set({ cost: () => 'COALESCE(cost, 0) + :cost' })
            .where('id = :executionId', { executionId })
            .setParameters({ cost })
            .execute();
    }
    async deleteByThreadId(threadId) {
        await this.delete({ threadId });
    }
    async findBlobRefsByAgentId(agentId) {
        return await this.find({
            select: ['id', 'threadId', 'storedAt'],
            where: { thread: { agentId }, storedAt: (0, typeorm_1.Not)('db') },
        });
    }
};
exports.AgentExecutionRepository = AgentExecutionRepository;
exports.AgentExecutionRepository = AgentExecutionRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentExecutionRepository);
//# sourceMappingURL=agent-execution.repository.js.map