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
exports.InstanceAiMemoryService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const zod_1 = require("zod");
const node_crypto_1 = require("node:crypto");
const instance_ai_1 = require("@n8n/instance-ai");
const errors_1 = require("@n8n/errors");
const durable_log_metrics_1 = require("./event-bus/durable-log-metrics");
const internal_messages_1 = require("./internal-messages");
const message_parser_1 = require("./message-parser");
const instance_ai_checkpoint_repository_1 = require("./repositories/instance-ai-checkpoint.repository");
const instance_ai_event_log_repository_1 = require("./repositories/instance-ai-event-log.repository");
const instance_ai_pending_confirmation_repository_1 = require("./repositories/instance-ai-pending-confirmation.repository");
const typeorm_agent_memory_1 = require("./storage/typeorm-agent-memory");
function isRestorableMessage(value) {
    if (typeof value.id !== 'string' || value.id.length === 0)
        return false;
    if (value.type === 'custom')
        return typeof value.data === 'object' && value.data !== null;
    return typeof value.role === 'string' && Array.isArray(value.content);
}
function toRestorableMessage(value) {
    const rawCreatedAt = value.createdAt;
    const createdAt = rawCreatedAt instanceof Date
        ? rawCreatedAt
        : typeof rawCreatedAt === 'string'
            ? new Date(rawCreatedAt)
            : undefined;
    if (!createdAt || Number.isNaN(createdAt.getTime()))
        return undefined;
    const candidate = { ...value, createdAt };
    return isRestorableMessage(candidate) ? candidate : undefined;
}
function messageCreatedAtMs(message) {
    const at = message.createdAt;
    if (at instanceof Date)
        return at.getTime();
    const parsed = new Date(at).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}
function historyWindow(messages, page, newerBoundaryAt) {
    if (messages.length === 0)
        return page === 0 ? {} : undefined;
    const since = new Date(messageCreatedAtMs(messages[0]));
    return newerBoundaryAt ? { since, before: newerBoundaryAt } : { since };
}
function expandRunIdsToGroups(runIds, runStarts) {
    const groupByRun = new Map();
    const runsByGroup = new Map();
    for (const { runId, messageGroupId } of runStarts) {
        if (!messageGroupId)
            continue;
        groupByRun.set(runId, messageGroupId);
        const siblings = runsByGroup.get(messageGroupId);
        if (siblings)
            siblings.push(runId);
        else
            runsByGroup.set(messageGroupId, [runId]);
    }
    const expanded = new Set(runIds);
    for (const runId of runIds) {
        const groupId = groupByRun.get(runId);
        if (!groupId)
            continue;
        for (const sibling of runsByGroup.get(groupId) ?? [])
            expanded.add(sibling);
    }
    return [...expanded];
}
function collectUnfinishedRunIds(rows) {
    const unfinished = new Set();
    for (const row of rows) {
        if (row.event.type === 'run-start')
            unfinished.add(row.runId);
        else if (row.event.type === 'run-finish')
            unfinished.delete(row.runId);
    }
    return unfinished;
}
function collectSuspendedHostRunIds(checkpoints) {
    const suspended = new Set();
    for (const checkpoint of checkpoints) {
        if (checkpoint.state?.status === 'suspended' && checkpoint.hostRunId) {
            suspended.add(checkpoint.hostRunId);
        }
    }
    return suspended;
}
function buildLogDerivedSnapshots(rows, skipRunIds, skipGroupIds) {
    const groupKeyByRun = new Map();
    for (const row of rows) {
        if (row.event.type === 'run-start') {
            const groupId = row.event.payload.messageGroupId;
            if (typeof groupId === 'string' && groupId)
                groupKeyByRun.set(row.runId, groupId);
        }
    }
    const skipGroupKeys = new Set(skipGroupIds);
    for (const runId of skipRunIds) {
        const groupId = groupKeyByRun.get(runId);
        if (groupId)
            skipGroupKeys.add(groupId);
    }
    const groups = new Map();
    for (const row of rows) {
        if (!row.runId)
            continue;
        const messageGroupId = groupKeyByRun.get(row.runId);
        const key = messageGroupId ?? row.runId;
        if (skipRunIds.has(row.runId) || skipGroupKeys.has(key))
            continue;
        let group = groups.get(key);
        if (!group) {
            group = {
                runIds: [],
                events: [],
                messageGroupId,
                anchorAt: row.createdAt,
                lastAt: row.createdAt,
            };
            groups.set(key, group);
        }
        if (!group.runIds.includes(row.runId))
            group.runIds.push(row.runId);
        group.events.push(row.event);
        if (row.runId === group.runIds[0] &&
            row.event.type !== 'preference-card' &&
            row.createdAt > group.anchorAt) {
            group.anchorAt = row.createdAt;
        }
        if (row.createdAt > group.lastAt)
            group.lastAt = row.createdAt;
    }
    const entries = [];
    for (const group of groups.values()) {
        const hasContent = group.events.some((e) => e.type !== 'run-start' && e.type !== 'run-finish');
        if (!hasContent)
            continue;
        entries.push({
            tree: (0, instance_ai_1.buildAgentTreeFromEvents)(group.events),
            runId: group.runIds[group.runIds.length - 1],
            messageGroupId: group.messageGroupId,
            runIds: group.runIds,
            createdAt: group.anchorAt,
            updatedAt: group.lastAt,
        });
    }
    return { entries };
}
let InstanceAiMemoryService = class InstanceAiMemoryService {
    constructor(logger, globalConfig, agentMemory, checkpointRepository, pendingConfirmationRepository, eventLogRepository, durableLogMetrics) {
        this.logger = logger;
        this.agentMemory = agentMemory;
        this.checkpointRepository = checkpointRepository;
        this.pendingConfirmationRepository = pendingConfirmationRepository;
        this.eventLogRepository = eventLogRepository;
        this.durableLogMetrics = durableLogMetrics;
        this.instanceAiConfig = globalConfig.instanceAi;
    }
    async getThreadInfo(threadId) {
        const thread = await this.agentMemory.getThread(threadId);
        if (!thread)
            throw new errors_1.NotFoundError('Thread not found');
        return this.toThreadInfo(thread);
    }
    async listThreadHistory(userId, query) {
        let before;
        if (query.cursor) {
            try {
                const parsed = zod_1.z
                    .object({ updatedAt: zod_1.z.string().datetime(), id: zod_1.z.string().min(1).max(256) })
                    .parse(JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')));
                before = { updatedAt: new Date(parsed.updatedAt), id: parsed.id };
            }
            catch {
                throw new errors_1.BadRequestError('Invalid thread history cursor');
            }
        }
        const rows = await this.agentMemory.listThreadHistory(userId, query.limit, query.search, before);
        const hasMore = rows.length > query.limit;
        const threads = rows.slice(0, query.limit).map((thread) => this.toThreadInfo(thread));
        const last = threads.at(-1);
        return {
            threads,
            hasMore,
            nextCursor: hasMore && last
                ? Buffer.from(JSON.stringify({ updatedAt: last.updatedAt, id: last.id })).toString('base64url')
                : null,
        };
    }
    async listThreads(userId, page = 0, perPage = 100) {
        const result = await this.agentMemory.listThreads({
            filter: { resourceId: userId },
            perPage,
            page,
            orderBy: { field: 'updatedAt', direction: 'DESC' },
        });
        return {
            threads: result.threads.map((t) => this.toThreadInfo(t)),
            total: result.total,
            page: result.page,
            hasMore: result.hasMore,
        };
    }
    async ensureThread(userId, threadId, projectId, launchMetadata, title = '') {
        const existing = await this.agentMemory.getThread(threadId);
        if (existing) {
            if (existing.resourceId !== userId) {
                throw new Error(`Thread ${threadId} is not owned by user ${userId}`);
            }
            return {
                thread: this.toThreadInfo(existing),
                created: false,
            };
        }
        const created = await this.agentMemory.saveThreadWithProject({
            id: threadId,
            resourceId: userId,
            title,
            metadata: {
                source: launchMetadata.source,
                origin: launchMetadata.origin,
                ...(launchMetadata.sourceContext ? { sourceContext: launchMetadata.sourceContext } : {}),
            },
        }, projectId);
        return {
            thread: this.toThreadInfo(created),
            created: true,
        };
    }
    async seedOpeningMessages(threadId, userId, greeting, hiddenUserText = internal_messages_1.AUTO_FOLLOW_UP_MESSAGE) {
        const now = Date.now();
        const userMessageId = (0, node_crypto_1.randomUUID)();
        await this.agentMemory.saveMessages({
            threadId,
            resourceId: userId,
            messages: [
                {
                    id: userMessageId,
                    createdAt: new Date(now - 1),
                    type: 'llm',
                    role: 'user',
                    content: [{ type: 'text', text: hiddenUserText }],
                },
                {
                    id: (0, node_crypto_1.randomUUID)(),
                    createdAt: new Date(now),
                    type: 'llm',
                    role: 'assistant',
                    content: [{ type: 'text', text: greeting }],
                },
            ],
        });
        return { userMessageId };
    }
    async restoreThreadMessages(userId, threadId, messages) {
        const restorable = [];
        for (const [index, raw] of messages.entries()) {
            const message = toRestorableMessage(raw);
            if (!message) {
                throw new errors_1.BadRequestError(`Seed message at index ${index} is not a valid agent message (id, createdAt, and role+content or type:custom+data are required)`);
            }
            restorable.push(message);
        }
        await this.agentMemory.saveMessages({ threadId, resourceId: userId, messages: restorable });
        return { restored: restorable.length };
    }
    async getThreadProjectId(threadId) {
        return (await this.agentMemory.getThreadProjectId(threadId)) ?? undefined;
    }
    async getThreadMessages(_userId, threadId, options) {
        const result = await this.agentMemory.listMessages({
            threadId,
            limit: options?.limit ?? 50,
            page: options?.page ?? 0,
        });
        return {
            threadId,
            messages: result.messages.map((m) => this.toThreadMessage(m)),
        };
    }
    async getRichMessages(_userId, threadId, options) {
        const page = options?.page ?? 0;
        const result = await this.agentMemory.listMessages({
            threadId,
            limit: options?.limit ?? 50,
            page,
            withNewerBoundary: true,
        });
        const pageWindow = historyWindow(result.messages, page, result.newerBoundaryAt);
        const activeCheckpoints = await this.loadActiveCheckpoints(threadId);
        const snapshots = !pageWindow
            ? []
            : await this.foldSnapshotsFromLog(threadId, collectSuspendedHostRunIds(activeCheckpoints), pageWindow, options?.excludeRunIds, options?.excludeMessageGroupIds);
        const messages = (0, message_parser_1.parseStoredMessages)(result.messages, snapshots);
        await this.flagExpiredConfirmations(messages);
        const projectId = await this.agentMemory.getThreadProjectId(threadId);
        return { threadId, projectId: projectId ?? undefined, messages };
    }
    async foldSnapshotsFromLog(threadId, suspendedRunIds, pageWindow, excludeRunIds, excludeMessageGroupIds) {
        const start = Date.now();
        let rows;
        try {
            const runStarts = await this.eventLogRepository.getRunStarts(threadId);
            if (runStarts.length === 0)
                return [];
            const windowedRunIds = await this.eventLogRepository.findRunIdsInWindow(threadId, pageWindow);
            rows = await this.eventLogRepository.getForThreadRuns(threadId, expandRunIdsToGroups(windowedRunIds, runStarts));
        }
        catch (error) {
            this.logger.warn('Failed to read Instance AI event log for history', {
                threadId,
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
        if (rows.length === 0)
            return [];
        const skipRunIds = new Set(excludeRunIds ?? []);
        for (const runId of collectUnfinishedRunIds(rows)) {
            if (!suspendedRunIds.has(runId))
                skipRunIds.add(runId);
        }
        const { entries } = buildLogDerivedSnapshots(rows, skipRunIds, new Set(excludeMessageGroupIds ?? []));
        if (entries.length === 0)
            return [];
        entries.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
        this.durableLogMetrics.recordFoldRead(Date.now() - start, entries.length);
        return entries;
    }
    async flagExpiredConfirmations(messages) {
        const requestIds = (0, message_parser_1.collectConfirmationRequestIds)(messages);
        if (requestIds.length === 0)
            return;
        try {
            const live = await this.pendingConfirmationRepository.findLiveRequestIds(requestIds, new Date());
            (0, message_parser_1.markExpiredConfirmations)(messages, live);
        }
        catch (error) {
            this.logger.warn('Failed to flag expired confirmation cards', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async loadActiveCheckpoints(threadId) {
        try {
            return await this.checkpointRepository.findActiveByThreadId(threadId);
        }
        catch (error) {
            this.logger.warn('Failed to load in-flight checkpoints', {
                threadId,
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    async validateThreadOwnership(userId, threadId) {
        return (await this.checkThreadOwnership(userId, threadId)) === 'owned';
    }
    async checkThreadOwnership(userId, threadId) {
        const thread = await this.agentMemory.getThread(threadId);
        if (!thread)
            return 'not_found';
        return thread.resourceId === userId ? 'owned' : 'other_user';
    }
    async deleteThread(threadId) {
        await this.agentMemory.deleteThreadsByResourceIdPrefix((0, instance_ai_1.createSubAgentResourceIdPrefix)(threadId));
        await this.agentMemory.deleteThread(threadId);
    }
    async deleteThreadsForUser(userId) {
        return await this.agentMemory.deleteThreadsByResourceId(userId);
    }
    async renameThread(threadId, title) {
        return await this.updateThread(threadId, { title });
    }
    async updateThread(threadId, updates) {
        const updated = await (0, instance_ai_1.patchThread)(this.agentMemory, {
            threadId,
            update: ({ metadata }) => {
                const patch = {
                    metadata: { ...metadata, ...updates.metadata },
                };
                if (updates.title !== undefined) {
                    patch.title = updates.title;
                    patch.metadata.titleRefined = true;
                }
                return patch;
            },
        });
        if (!updated) {
            throw new errors_1.NotFoundError(`Thread ${threadId} not found`);
        }
        return this.toThreadInfo(updated);
    }
    async bindAgentBuilderTarget(userId, threadId, target) {
        const updated = await (0, instance_ai_1.patchThread)(this.agentMemory, {
            threadId,
            update: (thread) => {
                if (thread.resourceId !== userId) {
                    throw new errors_1.ForbiddenError('Not authorized for this thread');
                }
                return { metadata: (0, instance_ai_1.withBoundAgentTarget)(thread.metadata ?? {}, target) };
            },
        });
        if (!updated) {
            throw new errors_1.NotFoundError(`Thread ${threadId} not found`);
        }
        return this.toThreadInfo(updated);
    }
    async getThreadMetadata(userId, threadId) {
        const thread = await this.agentMemory.getThread(threadId);
        if (!thread || thread.resourceId !== userId)
            return undefined;
        return thread.metadata;
    }
    async cleanupExpiredThreads(onThreadDeleted, signal) {
        const ttlDays = this.instanceAiConfig.threadTtlDays;
        if (!ttlDays || ttlDays <= 0)
            return 0;
        const cutoff = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000);
        let deletedCount = 0;
        const perPage = 100;
        let hasMore = true;
        while (hasMore && !signal?.aborted) {
            const result = await this.agentMemory.listThreads({
                perPage,
                page: 0,
                orderBy: { field: 'updatedAt', direction: 'ASC' },
            });
            let deletedInPage = 0;
            for (const thread of result.threads) {
                if (signal?.aborted)
                    break;
                if (thread.updatedAt < cutoff) {
                    try {
                        await onThreadDeleted?.(thread.id);
                        await this.deleteThread(thread.id);
                        deletedCount++;
                        deletedInPage++;
                    }
                    catch (error) {
                        this.logger.warn('Failed to delete expired thread', {
                            threadId: thread.id,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }
            }
            hasMore = deletedInPage > 0 && result.hasMore;
        }
        if (deletedCount > 0) {
            this.logger.info(`Cleaned up ${deletedCount} expired conversation threads (TTL: ${ttlDays} days)`);
        }
        return deletedCount;
    }
    toThreadInfo(thread) {
        return {
            id: thread.id,
            title: thread.title,
            resourceId: thread.resourceId,
            createdAt: thread.createdAt.toISOString(),
            updatedAt: thread.updatedAt.toISOString(),
            metadata: thread.metadata,
        };
    }
    toThreadMessage(message) {
        return {
            id: message.id,
            role: 'role' in message ? message.role : 'custom',
            content: 'content' in message ? message.content : message.data,
            type: message.type,
            createdAt: message.createdAt.toISOString(),
        };
    }
};
exports.InstanceAiMemoryService = InstanceAiMemoryService;
exports.InstanceAiMemoryService = InstanceAiMemoryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, typeorm_agent_memory_1.TypeORMAgentMemory, instance_ai_checkpoint_repository_1.InstanceAiCheckpointRepository, instance_ai_pending_confirmation_repository_1.InstanceAiPendingConfirmationRepository, instance_ai_event_log_repository_1.InstanceAiEventLogRepository, durable_log_metrics_1.DurableLogMetrics])
], InstanceAiMemoryService);
//# sourceMappingURL=instance-ai-memory.service.js.map