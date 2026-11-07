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
exports.TypeORMAgentMemory = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const instance_ai_1 = require("@n8n/instance-ai");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const errors_1 = require("@n8n/errors");
const typeorm_observation_log_store_1 = require("./typeorm-observation-log-store");
const instance_ai_message_repository_1 = require("../repositories/instance-ai-message.repository");
const instance_ai_observation_cursor_repository_1 = require("../repositories/instance-ai-observation-cursor.repository");
const instance_ai_observation_lock_repository_1 = require("../repositories/instance-ai-observation-lock.repository");
const instance_ai_observation_repository_1 = require("../repositories/instance-ai-observation.repository");
const instance_ai_resource_repository_1 = require("../repositories/instance-ai-resource.repository");
const instance_ai_thread_repository_1 = require("../repositories/instance-ai-thread.repository");
function parseJsonSafe(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return undefined;
    }
}
const activeSkillStatesSchema = zod_1.z.array(zod_1.z.object({
    agentName: zod_1.z.string(),
    resourceId: zod_1.z.string(),
    skillIds: zod_1.z.array(zod_1.z.string()),
}));
function activeSkillStates(metadata) {
    const parsed = activeSkillStatesSchema.safeParse(metadata?.activeSkillStates);
    return parsed.success ? parsed.data : [];
}
function isAgentMessage(value) {
    if (!(0, is_record_1.isRecord)(value))
        return false;
    if (value.type === 'custom') {
        return 'data' in value;
    }
    return typeof value.role === 'string' && Array.isArray(value.content);
}
function toThread(entity) {
    return {
        id: entity.id,
        resourceId: entity.resourceId,
        title: entity.title || undefined,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        metadata: entity.metadata ?? undefined,
    };
}
function getMessageRole(message) {
    return 'role' in message ? message.role : 'custom';
}
function getMessageType(message) {
    if (message.type === 'custom')
        return 'custom';
    if (message.type === 'llm')
        return 'llm';
    return null;
}
function parseJsonStringOrOriginal(value) {
    const parsed = parseJsonSafe(value);
    return parsed === undefined ? value : parsed;
}
function toJsonValue(value) {
    if (value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean') {
        return value;
    }
    if (Array.isArray(value))
        return value.map(toJsonValue);
    if ((0, is_record_1.isRecord)(value)) {
        const jsonObject = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            if (nestedValue !== undefined)
                jsonObject[key] = toJsonValue(nestedValue);
        }
        return jsonObject;
    }
    return String(value);
}
function toJsonObject(value) {
    const jsonObject = {};
    for (const [key, nestedValue] of Object.entries(value)) {
        if (nestedValue !== undefined)
            jsonObject[key] = toJsonValue(nestedValue);
    }
    return jsonObject;
}
function normalizeToolInput(input) {
    const parsed = typeof input === 'string' ? parseJsonStringOrOriginal(input) : input;
    if ((0, is_record_1.isRecord)(parsed))
        return toJsonObject(parsed);
    if (parsed === null || parsed === undefined)
        return {};
    return { value: toJsonValue(parsed) };
}
function normalizeAgentMessage(message) {
    if (message.type === 'custom')
        return message;
    return {
        ...message,
        content: message.content.map((part) => part.type === 'tool-call' ? { ...part, input: normalizeToolInput(part.input) } : part),
    };
}
function toAgentMessage(entity) {
    const parsed = parseJsonSafe(entity.content);
    if (!isAgentMessage(parsed))
        return undefined;
    return normalizeAgentMessage({ ...parsed, id: entity.id, createdAt: entity.createdAt });
}
function workingMemoryKey(params) {
    return params.scope === 'thread' ? `thread:${params.threadId}` : params.resourceId;
}
const PATCH_ONLY_METADATA_KEYS = new Set([
    'activeSkillStates',
    'instanceAiIterationLog',
    'instanceAiPlannedTasks',
    'instanceAiTasks',
    'instanceAiTerminalOutcomes',
    'instanceAiWorkflowLoop',
]);
function cloneThreadForPatch(thread) {
    return {
        ...thread,
        metadata: { ...(thread.metadata ?? {}) },
    };
}
function mergeSaveThreadMetadata(current, incoming) {
    const safeIncoming = { ...incoming };
    for (const key of PATCH_ONLY_METADATA_KEYS) {
        delete safeIncoming[key];
    }
    return {
        ...(current ?? {}),
        ...safeIncoming,
    };
}
let TypeORMAgentMemory = class TypeORMAgentMemory {
    constructor(threadRepo, messageRepo, resourceRepo, observationRepo, observationCursorRepo, observationLockRepo, logger) {
        this.threadRepo = threadRepo;
        this.messageRepo = messageRepo;
        this.resourceRepo = resourceRepo;
        this.skillState = {
            load: async ({ threadId, resourceId, agentName }) => {
                const thread = await this.getThread(threadId);
                return activeSkillStates(thread?.metadata).find((state) => state.resourceId === resourceId && state.agentName === agentName)?.skillIds;
            },
            save: async ({ threadId, resourceId, agentName }, skillIds) => {
                const updated = await this.patchThread({
                    threadId,
                    update: (thread) => ({
                        metadata: {
                            ...thread.metadata,
                            activeSkillStates: [
                                ...activeSkillStates(thread.metadata).filter((state) => state.resourceId !== resourceId || state.agentName !== agentName),
                                { resourceId, agentName, skillIds },
                            ],
                        },
                    }),
                });
                if (!updated)
                    throw new n8n_workflow_1.UnexpectedError('Cannot save active skills for a missing thread');
            },
        };
        this.threadMutationQueues = new Map();
        this.logger = logger.scoped('instance-ai');
        this.observationLog = new typeorm_observation_log_store_1.TypeORMObservationLogStore(observationRepo, observationCursorRepo, observationLockRepo, this.messageRepo, (entity) => this.toAgentMessage(entity));
    }
    describe() {
        return {
            name: 'typeorm-agent-memory',
            constructorName: this.constructor.name,
            connectionParams: null,
        };
    }
    async getThread(threadId) {
        const thread = await this.threadRepo.findOneBy({ id: threadId });
        return thread ? toThread(thread) : null;
    }
    async listThreadHistory(resourceId, limit, search, before) {
        return (await this.threadRepo.listHistoryPage(resourceId, limit, search, before)).map(toThread);
    }
    async listThreads(args) {
        const perPage = args.perPage ?? 100;
        const page = args.page ?? 0;
        const field = args.orderBy?.field ?? 'updatedAt';
        const direction = args.orderBy?.direction ?? 'DESC';
        const [threads, total] = await this.threadRepo.findAndCount({
            where: args.filter?.resourceId ? { resourceId: args.filter.resourceId } : {},
            order: { [field]: direction, id: direction },
            take: perPage,
            skip: page * perPage,
        });
        return {
            threads: threads.map(toThread),
            total,
            page,
            hasMore: (page + 1) * perPage < total,
        };
    }
    async saveThread(thread) {
        return await this.serializeThreadMutation(thread.id, async () => {
            const updated = await this.threadRepo.updateThread({
                threadId: thread.id,
                update: (current) => ({
                    resourceId: thread.resourceId,
                    ...(thread.title !== undefined ? { title: thread.title } : {}),
                    ...(thread.metadata !== undefined
                        ? { metadata: mergeSaveThreadMetadata(current.metadata, thread.metadata) }
                        : {}),
                }),
            });
            if (updated)
                return updated;
            const saved = await this.threadRepo.save(this.threadRepo.create({
                id: thread.id,
                resourceId: thread.resourceId,
                title: thread.title ?? '',
                metadata: thread.metadata ?? null,
                projectId: await this.resolveSubAgentProjectId(thread.resourceId),
            }));
            return toThread(saved);
        });
    }
    async resolveSubAgentProjectId(resourceId) {
        const parentThreadId = resourceId.startsWith(`${instance_ai_1.SUB_AGENT_RESOURCE_PREFIX}:`)
            ? resourceId.split(':')[1]
            : undefined;
        const parent = parentThreadId ? await this.threadRepo.findOneBy({ id: parentThreadId }) : null;
        if (!parent?.projectId) {
            throw new n8n_workflow_1.UnexpectedError(`Cannot create Instance AI thread for resource "${resourceId}" without a project`);
        }
        return parent.projectId;
    }
    async saveThreadWithProject(thread, projectId) {
        return await this.serializeThreadMutation(thread.id, async () => {
            const existing = await this.threadRepo.findOneBy({ id: thread.id });
            if (existing) {
                if (existing.resourceId !== thread.resourceId) {
                    throw new errors_1.ForbiddenError('Not authorized for this thread');
                }
                if (existing.projectId !== projectId) {
                    throw new errors_1.ConflictError(`Thread ${thread.id} already exists with a different project binding`);
                }
                return toThread(existing);
            }
            const saved = await this.threadRepo.save(this.threadRepo.create({
                id: thread.id,
                resourceId: thread.resourceId,
                title: thread.title ?? '',
                metadata: thread.metadata ?? null,
                projectId,
            }));
            return toThread(saved);
        });
    }
    async patchThread(args) {
        return await this.serializeThreadMutation(args.threadId, async () => await this.threadRepo.updateThread({
            threadId: args.threadId,
            update: (current) => args.update(cloneThreadForPatch(current)),
        }));
    }
    async deleteThread(threadId) {
        await this.threadRepo.delete({ id: threadId });
    }
    async getThreadProjectId(threadId) {
        const thread = await this.threadRepo.findOneBy({ id: threadId });
        return thread?.projectId ?? null;
    }
    async deleteThreadsByResourceIdPrefix(resourceIdPrefix) {
        const threads = await this.threadRepo.find({
            where: { resourceId: (0, typeorm_1.Like)(`${resourceIdPrefix}%`) },
        });
        if (threads.length === 0)
            return;
        const threadIds = threads.map((thread) => thread.id);
        const resourceIds = Array.from(new Set(threads.map((thread) => thread.resourceId)));
        await this.resourceRepo.delete({ id: (0, typeorm_1.In)(resourceIds) });
        await this.resourceRepo.delete({
            id: (0, typeorm_1.In)(threadIds.map((threadId) => `thread:${threadId}`)),
        });
        await this.threadRepo.delete({ id: (0, typeorm_1.In)(threadIds) });
    }
    async deleteThreadsByResourceId(resourceId) {
        const ownerThreads = await this.threadRepo.find({
            where: { resourceId },
            select: { id: true },
        });
        const resourceIdsToDelete = new Set([resourceId]);
        const threadIdsToDelete = ownerThreads.map((thread) => thread.id);
        for (const threadId of threadIdsToDelete) {
            resourceIdsToDelete.add(`thread:${threadId}`);
        }
        if (ownerThreads.length > 0) {
            const subAgentThreads = await this.threadRepo.find({
                where: ownerThreads.map((thread) => ({
                    resourceId: (0, typeorm_1.Like)(`${(0, instance_ai_1.createSubAgentResourceIdPrefix)(thread.id)}%`),
                })),
                select: { id: true, resourceId: true },
            });
            for (const subAgent of subAgentThreads) {
                threadIdsToDelete.push(subAgent.id);
                resourceIdsToDelete.add(subAgent.resourceId);
                resourceIdsToDelete.add(`thread:${subAgent.id}`);
            }
        }
        await this.resourceRepo.delete({ id: (0, typeorm_1.In)([...resourceIdsToDelete]) });
        if (threadIdsToDelete.length > 0) {
            await this.threadRepo.delete({ id: (0, typeorm_1.In)(threadIdsToDelete) });
        }
        return ownerThreads.length;
    }
    async getMessages(threadId, opts) {
        const where = opts?.before ? { threadId, createdAt: (0, typeorm_1.LessThan)(opts.before) } : { threadId };
        const entities = await this.messageRepo.find({
            where,
            order: opts?.limit ? { createdAt: 'DESC', id: 'DESC' } : { createdAt: 'ASC', id: 'ASC' },
            ...(opts?.limit ? { take: opts.limit } : {}),
        });
        const ordered = opts?.limit ? entities.reverse() : entities;
        return ordered.flatMap((entity) => {
            const message = this.toAgentMessage(entity);
            return message ? [message] : [];
        });
    }
    async listMessages(args) {
        const limit = args.limit ?? 50;
        const page = args.page ?? 0;
        const offset = page * limit;
        const withBoundary = args.withNewerBoundary === true && offset > 0;
        const entities = await this.messageRepo.find({
            where: { threadId: args.threadId },
            order: { createdAt: 'DESC', id: 'DESC' },
            take: withBoundary ? limit + 1 : limit,
            skip: withBoundary ? offset - 1 : offset,
        });
        const boundary = withBoundary ? entities.shift() : undefined;
        return {
            messages: entities.reverse().flatMap((entity) => {
                const message = this.toAgentMessage(entity);
                return message ? [message] : [];
            }),
            newerBoundaryAt: boundary?.createdAt,
        };
    }
    async saveMessages(args) {
        if (args.messages.length === 0)
            return;
        const entities = args.messages.map((message) => {
            const normalizedMessage = normalizeAgentMessage(message);
            return this.messageRepo.create({
                id: normalizedMessage.id,
                threadId: args.threadId,
                content: JSON.stringify(normalizedMessage),
                role: getMessageRole(normalizedMessage),
                type: getMessageType(normalizedMessage),
                resourceId: args.resourceId,
                createdAt: normalizedMessage.createdAt,
                updatedAt: normalizedMessage.createdAt,
            });
        });
        await this.messageRepo.save(entities);
        await this.threadRepo.update(args.threadId, { updatedAt: new Date() });
    }
    async deleteMessages(messageIds) {
        if (messageIds.length === 0)
            return;
        await this.messageRepo.delete({ id: (0, typeorm_1.In)(messageIds) });
    }
    async getWorkingMemory(params) {
        const resource = await this.resourceRepo.findOneBy({ id: workingMemoryKey(params) });
        return resource?.workingMemory ?? null;
    }
    async saveWorkingMemory(params, content) {
        const id = workingMemoryKey(params);
        const existing = await this.resourceRepo.findOneBy({ id });
        if (existing) {
            existing.workingMemory = content;
            await this.resourceRepo.save(existing);
            return;
        }
        await this.resourceRepo.save(this.resourceRepo.create({
            id,
            workingMemory: content,
            metadata: { scope: params.scope },
        }));
    }
    async appendObservationLogEntries(rows) {
        return await this.observationLog.appendObservationLogEntries(rows);
    }
    async getActiveObservationLog(scope) {
        return await this.observationLog.getActiveObservationLog(scope);
    }
    async getObservationLog(opts) {
        return await this.observationLog.getObservationLog(opts);
    }
    async getMessagesForObservationScope(observationScopeId, opts) {
        return await this.observationLog.getMessagesForObservationScope(observationScopeId, opts);
    }
    async dropObservationLogEntries(ids) {
        return await this.observationLog.dropObservationLogEntries(ids);
    }
    async supersedeObservationLogEntries(ids, supersededBy) {
        return await this.observationLog.supersedeObservationLogEntries(ids, supersededBy);
    }
    async applyObservationLogReflection(scope, reflection) {
        return await this.observationLog.applyObservationLogReflection(scope, reflection);
    }
    async getCursor(observationScopeId) {
        return await this.observationLog.getCursor(observationScopeId);
    }
    async setCursor(cursor) {
        return await this.observationLog.setCursor(cursor);
    }
    async acquireObservationLogTaskLock(observationScopeId, taskKind, opts) {
        return await this.observationLog.acquireObservationLogTaskLock(observationScopeId, taskKind, opts);
    }
    async releaseObservationLogTaskLock(handle) {
        return await this.observationLog.releaseObservationLogTaskLock(handle);
    }
    async serializeThreadMutation(threadId, mutation) {
        const previous = this.threadMutationQueues.get(threadId) ?? Promise.resolve();
        const next = previous.catch(() => undefined).then(mutation);
        this.threadMutationQueues.set(threadId, next);
        try {
            return await next;
        }
        finally {
            if (this.threadMutationQueues.get(threadId) === next) {
                this.threadMutationQueues.delete(threadId);
            }
        }
    }
    toAgentMessage(entity) {
        const message = toAgentMessage(entity);
        if (!message) {
            this.logger.warn('Skipping invalid Instance AI message row', {
                messageId: entity.id,
                threadId: entity.threadId,
                resourceId: entity.resourceId,
                role: entity.role,
                type: entity.type,
            });
        }
        return message;
    }
};
exports.TypeORMAgentMemory = TypeORMAgentMemory;
exports.TypeORMAgentMemory = TypeORMAgentMemory = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [instance_ai_thread_repository_1.InstanceAiThreadRepository, instance_ai_message_repository_1.InstanceAiMessageRepository, instance_ai_resource_repository_1.InstanceAiResourceRepository, instance_ai_observation_repository_1.InstanceAiObservationRepository, instance_ai_observation_cursor_repository_1.InstanceAiObservationCursorRepository, instance_ai_observation_lock_repository_1.InstanceAiObservationLockRepository, backend_common_1.Logger])
], TypeORMAgentMemory);
//# sourceMappingURL=typeorm-agent-memory.js.map