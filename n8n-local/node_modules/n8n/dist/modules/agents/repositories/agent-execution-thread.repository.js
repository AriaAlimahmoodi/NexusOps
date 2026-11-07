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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentExecutionThreadRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const chunk_1 = __importDefault(require("lodash/chunk"));
const n8n_workflow_1 = require("n8n-workflow");
const agent_chat_attachment_entity_1 = require("../entities/agent-chat-attachment.entity");
const agent_checkpoint_entity_1 = require("../entities/agent-checkpoint.entity");
const agent_execution_entity_1 = require("../entities/agent-execution.entity");
const agent_execution_thread_entity_1 = require("../entities/agent-execution-thread.entity");
const delegated_child_checkpoints_1 = require("../utils/delegated-child-checkpoints");
const agent_thread_access_1 = require("../utils/agent-thread-access");
const CHECKPOINT_BATCH_SIZE = 400;
function ownedSessionWhere(agentId, ownerId, threadId) {
    return {
        id: threadId,
        agentId,
        ownerId,
        accessScope: 'user',
        parentThreadId: (0, typeorm_1.IsNull)(),
    };
}
let AgentExecutionThreadRepository = class AgentExecutionThreadRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_execution_thread_entity_1.AgentExecutionThread, dataSource.manager, transactionRunner);
    }
    async lockById(threadId, ctx) {
        const manager = this.managerFor(ctx);
        return await manager.findOne(agent_execution_thread_entity_1.AgentExecutionThread, {
            where: { id: threadId },
            lock: manager.connection.options.type === 'postgres' ? { mode: 'pessimistic_write' } : undefined,
        });
    }
    async findOrCreate(threadId, agentId, agentName, projectId, access, ctx, metadata, taskId, taskVersionId, sessionMode = 'new') {
        const manager = this.managerFor(ctx);
        const repository = manager.getRepository(agent_execution_thread_entity_1.AgentExecutionThread);
        if (metadata?.parentThreadId) {
            const parent = await repository.findOneBy({
                id: metadata.parentThreadId,
                projectId,
                agentId: metadata.parentAgentId ?? (0, typeorm_1.IsNull)(),
            });
            if (parent) {
                access = { accessScope: parent.accessScope, ownerId: parent.ownerId };
            }
            else if (await repository.existsBy({ id: metadata.parentThreadId })) {
                throw new n8n_workflow_1.UserError('Session not found');
            }
        }
        if (access.accessScope === 'user' && !access.ownerId)
            throw new n8n_workflow_1.UserError('Session not found');
        const isPostgres = manager.connection.options.type === 'postgres';
        const findSession = async () => await repository.findOne({
            where: {
                id: threadId,
                agentId,
                projectId,
                ...access,
                ownerId: access.ownerId ?? (0, typeorm_1.IsNull)(),
            },
            lock: isPostgres ? { mode: 'pessimistic_write' } : undefined,
        });
        const existing = await findSession();
        if (existing)
            return { thread: existing, created: false };
        if (sessionMode === 'existing')
            throw new n8n_workflow_1.UserError('Session not found');
        const maxResult = await repository
            .createQueryBuilder('t')
            .select('MAX(t.sessionNumber)', 'max')
            .where('t.projectId = :projectId', { projectId })
            .getRawOne();
        const thread = {
            id: threadId,
            agentId,
            agentName,
            projectId,
            ...access,
            taskId: taskId ?? null,
            taskVersionId: taskVersionId ?? null,
            sessionNumber: (maxResult?.max ?? 0) + 1,
            parentThreadId: metadata?.parentThreadId ?? null,
            parentAgentId: metadata?.parentAgentId ?? null,
        };
        const insert = repository
            .createQueryBuilder()
            .insert()
            .values(thread)
            .orIgnore()
            .updateEntity(false);
        if (isPostgres)
            insert.returning('id');
        const result = await insert.execute();
        const persisted = await findSession();
        if (!persisted)
            throw new n8n_workflow_1.UserError('Session not found');
        return {
            thread: persisted,
            created: !isPostgres || (Array.isArray(result.raw) && result.raw.length > 0),
        };
    }
    async findByProjectIdPaginated(projectId, agentId, userId, limit, cursor, filters = {}) {
        const query = this.createQueryBuilder('thread')
            .where('thread.projectId = :projectId', { projectId })
            .andWhere('thread.agentId = :agentId', { agentId })
            .andWhere("(thread.accessScope = 'project' OR (thread.accessScope = 'user' AND thread.ownerId = :userId))", { userId });
        this.applyListFilters(query, filters, userId, this.updatedAtExpression());
        return await this.paginateByUpdatedAt(query, limit, cursor);
    }
    async findN8nChatThreadsForOwner(userId, agentIds, options) {
        const query = this.n8nChatThreadsQuery(userId, agentIds, options.search);
        if (!query)
            return { threads: [], nextCursor: null };
        return await this.paginateByUpdatedAt(query, options.limit, options.cursor);
    }
    async findN8nChatThreadForOwner(userId, agentIds, threadId) {
        const query = this.n8nChatThreadsQuery(userId, agentIds);
        if (!query)
            return null;
        return await query.andWhere('thread.id = :threadId', { threadId }).getOne();
    }
    n8nChatThreadsQuery(userId, agentIds, search) {
        if (agentIds.length === 0)
            return null;
        const query = this.createQueryBuilder('thread')
            .leftJoinAndSelect('thread.agent', 'agent')
            .leftJoinAndSelect('agent.activeVersion', 'activeVersion')
            .select([
            'thread.id',
            'thread.title',
            'thread.updatedAt',
            'agent.id',
            'agent.name',
            'agent.projectId',
            'activeVersion.versionId',
            'activeVersion.schema',
        ])
            .where('thread.ownerId = :userId', { userId })
            .andWhere("thread.accessScope = 'user'")
            .andWhere('thread.agentId IN (:...agentIds)', { agentIds });
        if (search) {
            query.andWhere(`LOWER(thread.title) LIKE :search ${db_1.LIKE_ESCAPE_CLAUSE}`, {
                search: `%${(0, db_1.escapeLike)(search.toLowerCase())}%`,
            });
        }
        this.applyOriginFilter(query, agent_thread_access_1.N8N_CHAT_PRODUCTION_SOURCE);
        return query;
    }
    async countN8nChatThreadsByAgent(userId, projectIds) {
        if (projectIds?.length === 0)
            return new Map();
        const query = this.createQueryBuilder('thread')
            .select('thread.agentId', 'agentId')
            .addSelect('COUNT(*)', 'count')
            .where('thread.ownerId = :userId', { userId })
            .andWhere("thread.accessScope = 'user'")
            .groupBy('thread.agentId');
        this.applyOriginFilter(query, agent_thread_access_1.N8N_CHAT_PRODUCTION_SOURCE);
        if (projectIds !== null) {
            query.andWhere('thread.projectId IN (:...projectIds)', { projectIds });
        }
        const rows = await query.getRawMany();
        return new Map(rows.map((row) => [row.agentId, Number(row.count)]));
    }
    updatedAtExpression() {
        return this.manager.connection.options.type === 'postgres'
            ? 'thread.updatedAt'
            : "STRFTIME('%Y-%m-%d %H:%M:%f', thread.updatedAt)";
    }
    async paginateByUpdatedAt(query, limit, cursor) {
        query.orderBy('thread.updatedAt', 'DESC').take(limit + 1);
        if (cursor) {
            query.andWhere(`${this.updatedAtExpression()} < :cursor`, { cursor: new Date(cursor) });
        }
        const threads = await query.getMany();
        const hasMore = threads.length > limit;
        if (hasMore)
            threads.pop();
        return {
            threads,
            nextCursor: hasMore ? threads[threads.length - 1].updatedAt.toISOString() : null,
        };
    }
    applyListFilters(query, filters, userId, updatedAt) {
        if (filters.scope === 'mine') {
            query.andWhere('thread.ownerId = :userId', { userId });
        }
        if (filters.updatedAfter) {
            query.andWhere(`${updatedAt} >= :updatedAfter`, {
                updatedAfter: filters.updatedAfter,
            });
        }
        if (filters.updatedBefore) {
            query.andWhere(`${updatedAt} <= :updatedBefore`, {
                updatedBefore: filters.updatedBefore,
            });
        }
        if (filters.status) {
            this.applyStatusFilter(query, filters.status);
        }
        if (filters.origin) {
            this.applyOriginFilter(query, filters.origin);
        }
        if (filters.previewOnly)
            this.applyPreviewFilter(query);
    }
    applyStatusFilter(query, status) {
        const latestStatus = this.latestExecutionStatusSubquery(query);
        if (status === 'succeeded') {
            query.andWhere(`(${latestStatus}) = 'success'`);
        }
        else {
            query.andWhere(`(${latestStatus}) = :sessionStatus`, { sessionStatus: status });
        }
    }
    applyPreviewFilter(query) {
        query
            .andWhere("thread.accessScope = 'user'")
            .andWhere('thread.parentThreadId IS NULL')
            .andWhere('thread.taskId IS NULL')
            .andWhere(`${this.normalizedFirstSource(query)} IN (:...previewThreadSources)`, {
            previewThreadSources: [...agent_thread_access_1.PREVIEW_THREAD_SOURCES],
        });
    }
    latestExecutionStatusSubquery(query) {
        return query
            .subQuery()
            .select('latestExecution.status')
            .from(agent_execution_entity_1.AgentExecution, 'latestExecution')
            .where('latestExecution.threadId = thread.id')
            .orderBy('latestExecution.createdAt', 'DESC')
            .addOrderBy('latestExecution.id', 'DESC')
            .limit(1)
            .getQuery();
    }
    normalizedFirstSource(query) {
        const firstSource = query
            .subQuery()
            .select('sourceExecution.source')
            .from(agent_execution_entity_1.AgentExecution, 'sourceExecution')
            .where('sourceExecution.threadId = thread.id')
            .andWhere('sourceExecution.source IS NOT NULL')
            .orderBy('sourceExecution.createdAt', 'ASC')
            .addOrderBy('sourceExecution.id', 'ASC')
            .limit(1)
            .getQuery();
        return `LOWER(TRIM(COALESCE((${firstSource}), '')))`;
    }
    applyOriginFilter(query, origin) {
        const normalizedSource = this.normalizedFirstSource(query);
        const isSubAgent = '(thread."parentThreadId" IS NOT NULL OR ' +
            `${normalizedSource} IN ('subagent', 'sub-agent'))`;
        const isSchedule = `(NOT ${isSubAgent} AND ` + `(thread."taskId" IS NOT NULL OR ${normalizedSource} = 'task'))`;
        const isDirect = `(NOT ${isSubAgent} AND NOT ${isSchedule})`;
        if (origin === 'sub-agent') {
            query.andWhere(isSubAgent);
        }
        else if (origin === 'schedule') {
            query.andWhere(isSchedule);
        }
        else if (origin === 'preview') {
            query.andWhere(`${isDirect} AND ${normalizedSource} IN (:...previewThreadSources)`, {
                previewThreadSources: [...agent_thread_access_1.PREVIEW_THREAD_SOURCES],
            });
        }
        else {
            query.andWhere(`${isDirect} AND ${normalizedSource} = :sessionOrigin`, {
                sessionOrigin: origin,
            });
        }
    }
    async findOwnedByAgent(agentId, ownerId, options = {}) {
        return await this.find({
            where: { agentId, ownerId, accessScope: 'user', parentThreadId: (0, typeorm_1.IsNull)() },
            order: { updatedAt: 'DESC', id: 'DESC' },
            ...(options.limit ? { take: options.limit } : {}),
        });
    }
    async findOwnedById(agentId, ownerId, threadId) {
        return await this.findOneBy(ownedSessionWhere(agentId, ownerId, threadId));
    }
    async renameOwned(agentId, ownerId, threadId, title, ctx) {
        const result = await this.managerFor(ctx).update(agent_execution_thread_entity_1.AgentExecutionThread, ownedSessionWhere(agentId, ownerId, threadId), { title });
        return result.affected === 1;
    }
    async moveOwned(agentId, ownerId, threadId, projectId, ctx) {
        const result = await this.managerFor(ctx).update(agent_execution_thread_entity_1.AgentExecutionThread, ownedSessionWhere(agentId, ownerId, threadId), { projectId });
        return result.affected === 1;
    }
    async findOwnedHistoryPage(agentId, ownerId, limit, search, before) {
        const updatedAt = this.updatedAtExpression();
        const query = this.createQueryBuilder('thread')
            .where('thread.agentId = :agentId', { agentId })
            .andWhere('thread.ownerId = :ownerId', { ownerId })
            .andWhere("thread.accessScope = 'user'")
            .andWhere('thread.parentThreadId IS NULL');
        const term = search?.trim().toLowerCase();
        if (term) {
            query.andWhere(`LOWER(thread.title) LIKE :search ${db_1.LIKE_ESCAPE_CLAUSE}`, {
                search: `%${(0, db_1.escapeLike)(term)}%`,
            });
        }
        if (before) {
            query.andWhere(`(${updatedAt} < :beforeAt OR (${updatedAt} = :beforeAt AND thread.id < :beforeId))`, { beforeAt: before.updatedAt, beforeId: before.id });
        }
        const threads = await query
            .orderBy(updatedAt, 'DESC')
            .addOrderBy('thread.id', 'DESC')
            .limit(limit + 1)
            .getMany();
        const hasMore = threads.length > limit;
        if (hasMore)
            threads.pop();
        return { threads, hasMore };
    }
    async findByAgentUpdatedBefore(agentId, cutoff, limit) {
        const updatedAt = this.updatedAtExpression();
        return await this.createQueryBuilder('thread')
            .where('thread.agentId = :agentId', { agentId })
            .andWhere(`${updatedAt} < :cutoff`, { cutoff })
            .orderBy(updatedAt, 'ASC')
            .addOrderBy('thread.id', 'ASC')
            .limit(limit)
            .getMany();
    }
    async findByParentThreadId(parentThreadId, projectId) {
        return await this.find({
            where: { parentThreadId, projectId },
            order: { createdAt: 'ASC' },
        });
    }
    async bumpUpdatedAt(threadId, ctx = {}) {
        await this.managerFor(ctx).update(agent_execution_thread_entity_1.AgentExecutionThread, threadId, { updatedAt: new Date() });
    }
    async incrementUsage(threadId, promptTokens, completionTokens, cost, duration, ctx = {}) {
        const set = {
            totalPromptTokens: () => '"totalPromptTokens" + :promptTokens',
            totalCompletionTokens: () => '"totalCompletionTokens" + :completionTokens',
        };
        if (cost > 0) {
            set.totalCost = () => '"totalCost" + :cost';
        }
        if (duration > 0) {
            set.totalDuration = () => '"totalDuration" + :duration';
        }
        await this.managerFor(ctx)
            .createQueryBuilder()
            .update(agent_execution_thread_entity_1.AgentExecutionThread)
            .set(set)
            .where('id = :threadId', { threadId })
            .setParameters({ promptTokens, completionTokens, cost, duration })
            .execute();
    }
    async deleteSession(projectId, agentId, threadId, userId, ctx) {
        const manager = this.managerFor(ctx);
        const thread = await manager.findOne(agent_execution_thread_entity_1.AgentExecutionThread, {
            where: [
                { id: threadId, projectId, agentId, accessScope: 'project' },
                { id: threadId, projectId, agentId, accessScope: 'user', ownerId: userId },
            ],
            lock: manager.connection.options.type === 'postgres' ? { mode: 'pessimistic_write' } : undefined,
        });
        if (!thread)
            return null;
        const hasRunningWork = await manager.exists(agent_execution_entity_1.AgentExecution, {
            where: { threadId, status: 'running' },
        });
        if (hasRunningWork)
            return { status: 'busy' };
        const { attachments, executionLogs } = await this.findExternalRefs(manager, projectId, threadId);
        const checkpointRunIds = await this.findSessionCheckpointRunIds(manager, agentId, threadId);
        for (const batch of (0, chunk_1.default)(checkpointRunIds, CHECKPOINT_BATCH_SIZE)) {
            await manager.delete(agent_checkpoint_entity_1.AgentCheckpoint, batch);
        }
        if (attachments.length > 0) {
            await manager.delete(agent_chat_attachment_entity_1.AgentChatAttachment, attachments.map(({ id }) => id));
        }
        await manager.delete(agent_execution_thread_entity_1.AgentExecutionThread, { id: threadId });
        return {
            status: 'deleted',
            refs: {
                executionLogs,
                attachmentBinaryDataIds: attachments.map(({ binaryDataId }) => binaryDataId),
            },
        };
    }
    async findSessionCheckpointRunIds(manager, agentId, threadId) {
        const parents = await manager.find(agent_checkpoint_entity_1.AgentCheckpoint, {
            select: ['runId', 'agentId', 'state'],
            where: { agentId, threadId },
        });
        const checkpoints = parents.map((row) => ({ row, agentId }));
        const visited = new Set(checkpoints.map(({ row }) => checkpointKey(agentId, row.runId)));
        let currentLevel = checkpoints;
        while (currentLevel.length > 0) {
            const children = collectUnvisitedChildCheckpoints(currentLevel, visited);
            if (children.length === 0)
                break;
            const childRows = await this.findCheckpointRows(manager, children);
            currentLevel = childRows.flatMap((row) => row.agentId ? [{ row, agentId: row.agentId }] : []);
            checkpoints.push(...currentLevel);
        }
        return checkpoints.map(({ row }) => row.runId);
    }
    async findCheckpointRows(manager, checkpoints) {
        const rows = [];
        for (const batch of (0, chunk_1.default)(checkpoints, CHECKPOINT_BATCH_SIZE)) {
            rows.push(...(await manager.find(agent_checkpoint_entity_1.AgentCheckpoint, {
                select: ['runId', 'agentId', 'state'],
                where: batch,
            })));
        }
        return rows;
    }
    async findExternalRefs(manager, projectId, threadId) {
        const executionLogs = await manager.find(agent_execution_entity_1.AgentExecution, {
            select: ['id', 'storedAt'],
            where: { threadId, storedAt: (0, typeorm_1.Not)('db') },
        });
        const attachments = await manager.find(agent_chat_attachment_entity_1.AgentChatAttachment, {
            select: ['id', 'binaryDataId'],
            where: { projectId, threadId },
        });
        return { executionLogs, attachments };
    }
};
exports.AgentExecutionThreadRepository = AgentExecutionThreadRepository;
exports.AgentExecutionThreadRepository = AgentExecutionThreadRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentExecutionThreadRepository);
function parseChildCheckpoints(state, parentAgentId) {
    if (!state)
        return [];
    try {
        return (0, delegated_child_checkpoints_1.getDelegatedChildCheckpoints)((0, n8n_workflow_1.jsonParse)(state), parentAgentId);
    }
    catch {
        return [];
    }
}
function collectUnvisitedChildCheckpoints(checkpoints, visited) {
    const children = [];
    for (const { row, agentId } of checkpoints) {
        for (const child of parseChildCheckpoints(row.state, agentId)) {
            const key = checkpointKey(child.agentId, child.runId);
            if (visited.has(key))
                continue;
            visited.add(key);
            children.push(child);
        }
    }
    return children;
}
function checkpointKey(agentId, runId) {
    return `${agentId}\0${runId}`;
}
//# sourceMappingURL=agent-execution-thread.repository.js.map