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
exports.AgentBackgroundJobRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const agent_background_job_entity_1 = require("../entities/agent-background-job.entity");
const agent_checkpoint_entity_1 = require("../entities/agent-checkpoint.entity");
const agent_execution_entity_1 = require("../entities/agent-execution.entity");
const agent_execution_thread_repository_1 = require("./agent-execution-thread.repository");
let AgentBackgroundJobRepository = class AgentBackgroundJobRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner, threadRepository) {
        super(agent_background_job_entity_1.AgentBackgroundJob, dataSource.manager, transactionRunner);
        this.threadRepository = threadRepository;
    }
    async insertSubAgentJobIfCapacity(job, limit) {
        return await this.runInTransaction({}, async (manager, ctx) => {
            if (!(await this.threadRepository.lockById(job.parentThreadId, ctx))) {
                throw new n8n_workflow_1.UserError('Session not found');
            }
            if ((await this.countActiveSubAgentsByParentThread(job.parentThreadId, ctx)) >= limit)
                return false;
            await manager.insert(agent_background_job_entity_1.AgentBackgroundJob, { ...job, status: 'running' });
            return true;
        });
    }
    async insertWorkflowJobOrGetExisting(job) {
        await this.createQueryBuilder()
            .insert()
            .into(agent_background_job_entity_1.AgentBackgroundJob)
            .values({ ...job, status: 'running' })
            .orIgnore()
            .execute();
        const inserted = await this.existsBy({ id: job.id });
        if (inserted)
            return { inserted: true };
        const existing = await this.findOne({ where: { childExecutionId: job.childExecutionId } });
        if (existing)
            return { inserted: false, existing };
        throw new n8n_workflow_1.OperationalError('Failed to register workflow background job');
    }
    async countActiveSubAgentsByParentThread(parentThreadId, ctx = {}) {
        return await this.managerFor(ctx).count(agent_background_job_entity_1.AgentBackgroundJob, {
            where: { parentThreadId, kind: 'subagent', status: (0, typeorm_1.In)(['running', 'suspended']) },
        });
    }
    async findByParentThread(parentThreadId, ids) {
        return await this.find({
            where: ids?.length ? { parentThreadId, id: (0, typeorm_1.In)(ids) } : { parentThreadId },
            order: { createdAt: 'ASC' },
        });
    }
    async findGroupCandidates(parentAgentId, parentThreadId) {
        return await this.find({
            where: { parentAgentId, parentThreadId },
            select: [
                'id',
                'kind',
                'title',
                'status',
                'createdAt',
                'settledAt',
                'notifiedAt',
                'pauseRequestId',
            ],
            order: { createdAt: 'ASC' },
        });
    }
    async findById(id) {
        return await this.findOneBy({ id });
    }
    async findWakeableUnconsumed(parentThreadId) {
        return await this.createQueryBuilder('job')
            .where('job.parentThreadId = :parentThreadId', { parentThreadId })
            .andWhere("job.status <> 'running'")
            .andWhere('job.notifiedAt IS NULL')
            .andWhere(`(job.pauseRequestId IS NULL OR NOT EXISTS ${this.activePauseGroup()})`)
            .orderBy('COALESCE(job.settledAt, job.updatedAt)', 'ASC')
            .addOrderBy('job.createdAt', 'ASC')
            .getMany();
    }
    activePauseGroup() {
        return this.createQueryBuilder()
            .subQuery()
            .select('1')
            .from(agent_background_job_entity_1.AgentBackgroundJob, 'member')
            .leftJoin(agent_execution_entity_1.AgentExecution, 'execution', "execution.threadId = member.childThreadId AND execution.status = 'running'")
            .where('member.pauseRequestId = job.pauseRequestId')
            .andWhere('member.parentThreadId = job.parentThreadId')
            .andWhere("(member.status IN ('running', 'suspended') OR execution.id IS NOT NULL)")
            .getQuery();
    }
    async markMailConsumed(parentThreadId, ids, includePauseReports = false) {
        if (ids.length === 0)
            return 0;
        const query = this.createQueryBuilder()
            .update()
            .set({ notifiedAt: new Date() })
            .where({ parentThreadId, id: (0, typeorm_1.In)(ids) })
            .andWhere('settledAt IS NOT NULL')
            .andWhere('notifiedAt IS NULL');
        if (!includePauseReports)
            query.andWhere('pauseRequestId IS NULL');
        const result = await query.execute();
        return result.affected ?? 0;
    }
    async markApprovalDelivered(id, runId, state) {
        await this.createQueryBuilder()
            .update()
            .set({ notifiedAt: new Date() })
            .where({ id, status: 'suspended', notifiedAt: (0, typeorm_1.IsNull)() })
            .andWhere(this.matchCheckpoint(), { runId, state, expired: false })
            .execute();
    }
    matchCheckpoint() {
        const checkpoint = this.createQueryBuilder()
            .subQuery()
            .select('1')
            .from(agent_checkpoint_entity_1.AgentCheckpoint, 'checkpoint')
            .where('checkpoint.runId = :runId')
            .andWhere('checkpoint.state = :state')
            .andWhere('checkpoint.expired = :expired')
            .getQuery();
        return `EXISTS ${checkpoint}`;
    }
    async findThreadsWithUnconsumedMail() {
        const rows = await this.createQueryBuilder('job')
            .select('DISTINCT job.parentThreadId', 'parentThreadId')
            .where("job.status <> 'running'")
            .andWhere('job.notifiedAt IS NULL')
            .getRawMany();
        return rows.map(({ parentThreadId }) => parentThreadId);
    }
    async findRunningWorkflowJobByExecutionId(executionId) {
        return await this.findOne({
            where: { kind: 'workflow', status: 'running', childExecutionId: executionId },
        });
    }
    async findRunningJobs(kind) {
        return await this.find({ where: kind ? { status: 'running', kind } : { status: 'running' } });
    }
    async findRequestedPauses(parentThreadId) {
        return await this.find({
            where: {
                kind: 'subagent',
                pauseRequestId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
                status: (0, typeorm_1.In)(['running', 'suspended', 'paused']),
                ...(parentThreadId ? { parentThreadId } : {}),
            },
        });
    }
    async hasRequestedStop(parentThreadId, parentResourceId) {
        const scope = { parentThreadId, parentResourceId, pauseRequestId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) };
        return await this.existsBy([
            { ...scope, kind: 'subagent', status: (0, typeorm_1.In)(['running', 'suspended', 'paused']) },
            { ...scope, kind: 'workflow', notifiedAt: (0, typeorm_1.IsNull)() },
        ]);
    }
    async findSettledSubAgentsWithCheckpoints() {
        return await this.createQueryBuilder('job')
            .innerJoin(agent_checkpoint_entity_1.AgentCheckpoint, 'checkpoint', 'checkpoint.agentId = job.subAgentId AND checkpoint.threadId = job.childThreadId')
            .where("job.kind = 'subagent'")
            .andWhere("job.status NOT IN ('running', 'suspended', 'paused')")
            .andWhere('checkpoint.state IS NOT NULL')
            .distinct(true)
            .getMany();
    }
    async findPausedWithoutCheckpoint(updatedAfter, parentThreadId) {
        const checkpoint = this.createQueryBuilder()
            .subQuery()
            .select('1')
            .from(agent_checkpoint_entity_1.AgentCheckpoint, 'checkpoint')
            .where('checkpoint.agentId = job.subAgentId')
            .andWhere('checkpoint.threadId = job.childThreadId')
            .andWhere('checkpoint.expired = :expired')
            .andWhere('checkpoint.state IS NOT NULL')
            .andWhere('checkpoint.updatedAt > :updatedAfter')
            .getQuery();
        const query = this.createQueryBuilder('job')
            .where({ kind: 'subagent', status: 'paused' })
            .andWhere(`NOT EXISTS ${checkpoint}`, { expired: false, updatedAfter });
        if (parentThreadId)
            query.andWhere('job.parentThreadId = :parentThreadId', { parentThreadId });
        return await query.getMany();
    }
    async findActivePastTimeout(now) {
        return await this.find({
            where: { status: (0, typeorm_1.In)(['running', 'suspended']), timeoutAt: (0, typeorm_1.LessThan)(now) },
        });
    }
    async suspendIfRunning(id, timeoutAt, runId, state) {
        const result = await this.createQueryBuilder()
            .update()
            .set({ status: 'suspended', timeoutAt, notifiedAt: null })
            .where({ id, status: 'running' })
            .andWhere(this.matchCheckpoint(), { runId, state, expired: false })
            .execute();
        return result.affected === 1;
    }
    async resumeIfSuspended(id, timeoutAt) {
        const result = await this.update({ id, status: 'suspended', pauseRequestId: (0, typeorm_1.IsNull)() }, { status: 'running', timeoutAt, notifiedAt: null });
        return result.affected === 1;
    }
    async requestPause(parentAgentId, parentThreadId, parentResourceId, pauseRequestId) {
        await this.runInTransaction({}, async (manager, ctx) => {
            await this.threadRepository.lockById(parentThreadId, ctx);
            await manager
                .createQueryBuilder()
                .update(agent_background_job_entity_1.AgentBackgroundJob)
                .set({ pauseRequestId, notifiedAt: null })
                .where({ parentAgentId, parentThreadId, parentResourceId })
                .andWhere("status IN ('running', 'suspended')")
                .andWhere('(pauseRequestId IS NULL OR notifiedAt IS NOT NULL)')
                .execute();
        });
    }
    async pauseIfRequested(job, resultText, runId, state) {
        const running = this.createQueryBuilder()
            .subQuery()
            .select('1')
            .from(agent_execution_entity_1.AgentExecution, 'execution')
            .where('execution.threadId = :childThreadId')
            .andWhere("execution.status = 'running'")
            .getQuery();
        const result = await this.createQueryBuilder()
            .update()
            .set({
            status: 'paused',
            result: resultText,
            timeoutAt: null,
            settledAt: new Date(),
            notifiedAt: null,
        })
            .where({ id: job.id, status: (0, typeorm_1.In)(['running', 'suspended']), pauseRequestId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) })
            .andWhere('notifiedAt IS NULL')
            .andWhere(this.matchCheckpoint(), { runId, state, expired: false })
            .andWhere(`NOT EXISTS ${running}`, { childThreadId: job.childThreadId })
            .execute();
        return result.affected === 1;
    }
    async resumeIfPaused(id, pauseRequestId, status, timeoutAt, reservationTimeoutAt) {
        const result = await this.update({
            id,
            status: reservationTimeoutAt ? 'suspended' : 'paused',
            pauseRequestId,
            notifiedAt: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
            ...(reservationTimeoutAt ? { timeoutAt: reservationTimeoutAt } : {}),
        }, { status, pauseRequestId: null, timeoutAt, settledAt: null, notifiedAt: null, result: null });
        return result.affected === 1;
    }
    async reservePausedGroup(parentThreadId, pauseRequestId, ids, timeoutAt, limit) {
        return await this.runInTransaction({}, async (manager, ctx) => {
            if (!(await this.threadRepository.lockById(parentThreadId, ctx)))
                return 'changed';
            const requested = await manager.find(agent_background_job_entity_1.AgentBackgroundJob, {
                where: { parentThreadId, pauseRequestId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) },
            });
            const jobs = requested.filter((job) => job.kind === 'subagent' &&
                job.pauseRequestId === pauseRequestId &&
                job.status === 'paused');
            const first = jobs[0];
            if (!first ||
                jobs.length !== ids.length ||
                jobs.some((job) => !ids.includes(job.id)) ||
                requested.some((job) => job.parentAgentId === first.parentAgentId &&
                    job.parentResourceId === first.parentResourceId &&
                    (job.status === 'running' || job.status === 'suspended' || !job.notifiedAt)))
                return 'changed';
            if ((await this.countActiveSubAgentsByParentThread(parentThreadId, ctx)) + jobs.length >
                limit)
                return 'limit-reached';
            await manager.update(agent_background_job_entity_1.AgentBackgroundJob, { id: (0, typeorm_1.In)(ids), parentThreadId, status: 'paused', pauseRequestId }, { status: 'suspended', timeoutAt });
            return 'reserved';
        });
    }
    async releasePausedResume(id, pauseRequestId, timeoutAt) {
        const result = await this.update({ id, status: 'suspended', pauseRequestId, timeoutAt, notifiedAt: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) }, { status: 'paused', timeoutAt: null });
        return result.affected === 1;
    }
    async retainLatestStopGroup(parentAgentId, parentThreadId, parentResourceId, replacementNotice) {
        return await this.runInTransaction({}, async (manager, ctx) => {
            await this.threadRepository.lockById(parentThreadId, ctx);
            const scope = { parentAgentId, parentThreadId, parentResourceId };
            const latest = await manager
                .createQueryBuilder(agent_background_job_entity_1.AgentBackgroundJob, 'job')
                .where({ ...scope, pauseRequestId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) })
                .andWhere(`NOT EXISTS ${this.activePauseGroup()}`)
                .orderBy("CASE WHEN SUBSTR(CAST(job.pauseRequestId AS text), 15, 1) = '7' THEN 1 ELSE 0 END", 'DESC')
                .addOrderBy('job.pauseRequestId', 'DESC')
                .getOne();
            if (!latest?.pauseRequestId)
                return [];
            const latestId = latest.pauseRequestId;
            const older = (await manager.find(agent_background_job_entity_1.AgentBackgroundJob, {
                where: { ...scope, kind: 'subagent', status: 'paused', pauseRequestId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) },
            })).filter((job) => {
                if (!job.pauseRequestId || job.pauseRequestId === latestId)
                    return false;
                if (job.pauseRequestId[14] !== '7')
                    return true;
                return latestId[14] === '7' && job.pauseRequestId < latestId;
            });
            if (older.length === 0)
                return [];
            await manager.update(agent_background_job_entity_1.AgentBackgroundJob, { id: (0, typeorm_1.In)(older.map((job) => job.id)), status: 'paused' }, {
                status: 'cancelled',
                result: null,
                error: replacementNotice,
                settledAt: new Date(),
                notifiedAt: () => 'COALESCE("notifiedAt", CURRENT_TIMESTAMP)',
            });
            if (!latest.result?.includes(replacementNotice)) {
                await manager.update(agent_background_job_entity_1.AgentBackgroundJob, { id: latest.id, status: latest.status, pauseRequestId: latestId }, { result: `${latest.result ?? ''}\n${replacementNotice}` });
            }
            return older;
        });
    }
    async settleIfActive(id, settlement, expected) {
        const result = await this.update({
            id,
            status: expected?.status ?? (0, typeorm_1.In)(['running', 'suspended', 'paused']),
            ...(expected?.timeoutAt !== undefined ? { timeoutAt: expected.timeoutAt ?? (0, typeorm_1.IsNull)() } : {}),
            ...(expected?.pauseRequestId !== undefined
                ? { pauseRequestId: expected.pauseRequestId ?? (0, typeorm_1.IsNull)() }
                : {}),
        }, {
            status: settlement.status,
            result: settlement.result ?? null,
            error: settlement.error ?? null,
            settledAt: new Date(),
            notifiedAt: settlement.status === 'cancelled' || expected?.status === 'paused'
                ? () => 'CASE WHEN "status" = \'paused\' OR "pauseRequestId" IS NOT NULL THEN "notifiedAt" ELSE NULL END'
                : null,
        });
        return result.affected === 1;
    }
    async deleteSettledBefore(cutoff) {
        await this.delete({
            status: (0, typeorm_1.In)(['completed', 'failed', 'cancelled']),
            settledAt: (0, typeorm_1.LessThan)(cutoff),
            notifiedAt: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
        });
    }
};
exports.AgentBackgroundJobRepository = AgentBackgroundJobRepository;
exports.AgentBackgroundJobRepository = AgentBackgroundJobRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner, agent_execution_thread_repository_1.AgentExecutionThreadRepository])
], AgentBackgroundJobRepository);
//# sourceMappingURL=agent-background-job.repository.js.map