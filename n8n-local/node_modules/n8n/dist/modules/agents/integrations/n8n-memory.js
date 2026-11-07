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
exports.N8nMemoryImpl = exports.N8nMemory = void 0;
const agents_1 = require("@n8n/agents");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const response_helper_1 = require("../../../response-helper");
const agent_memory_entry_lock_entity_1 = require("../entities/agent-memory-entry-lock.entity");
const agent_memory_entry_source_entity_1 = require("../entities/agent-memory-entry-source.entity");
const agent_memory_entry_entity_1 = require("../entities/agent-memory-entry.entity");
const agent_observation_cursor_entity_1 = require("../entities/agent-observation-cursor.entity");
const agent_observation_lock_entity_1 = require("../entities/agent-observation-lock.entity");
const agent_observation_entity_1 = require("../entities/agent-observation.entity");
const agent_thread_entity_1 = require("../entities/agent-thread.entity");
const agent_memory_entry_candidate_repository_1 = require("../repositories/agent-memory-entry-candidate.repository");
const agent_memory_entry_lock_repository_1 = require("../repositories/agent-memory-entry-lock.repository");
const agent_memory_entry_source_repository_1 = require("../repositories/agent-memory-entry-source.repository");
const agent_memory_entry_repository_1 = require("../repositories/agent-memory-entry.repository");
const agent_message_repository_1 = require("../repositories/agent-message.repository");
const agent_observation_cursor_repository_1 = require("../repositories/agent-observation-cursor.repository");
const agent_observation_lock_repository_1 = require("../repositories/agent-observation-lock.repository");
const agent_observation_repository_1 = require("../repositories/agent-observation.repository");
const agent_resource_repository_1 = require("../repositories/agent-resource.repository");
const agent_thread_repository_1 = require("../repositories/agent-thread.repository");
const agent_queued_message_1 = require("../types/agent-queued-message");
const agent_memory_scope_1 = require("../utils/agent-memory-scope");
const EPISODIC_MEMORY_MAX_THREAD_SCOPES = 200;
let N8nMemory = class N8nMemory {
    constructor(threadRepository, messageRepository, resourceRepository, observationRepository, observationCursorRepository, observationLockRepository, memoryEntryRepository, memoryEntryCandidateRepository, memoryEntryLockRepository, memoryEntrySourceRepository) {
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.resourceRepository = resourceRepository;
        this.observationRepository = observationRepository;
        this.observationCursorRepository = observationCursorRepository;
        this.observationLockRepository = observationLockRepository;
        this.memoryEntryRepository = memoryEntryRepository;
        this.memoryEntryCandidateRepository = memoryEntryCandidateRepository;
        this.memoryEntryLockRepository = memoryEntryLockRepository;
        this.memoryEntrySourceRepository = memoryEntrySourceRepository;
    }
    getImplementation(agentId) {
        return new N8nMemoryImpl(agentId, this.threadRepository, this.messageRepository, this.resourceRepository, this.observationRepository, this.observationCursorRepository, this.observationLockRepository, this.memoryEntryRepository, this.memoryEntryCandidateRepository, this.memoryEntryLockRepository, this.memoryEntrySourceRepository);
    }
};
exports.N8nMemory = N8nMemory;
exports.N8nMemory = N8nMemory = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_thread_repository_1.AgentThreadRepository, agent_message_repository_1.AgentMessageRepository, agent_resource_repository_1.AgentResourceRepository, agent_observation_repository_1.AgentObservationRepository, agent_observation_cursor_repository_1.AgentObservationCursorRepository, agent_observation_lock_repository_1.AgentObservationLockRepository, agent_memory_entry_repository_1.AgentMemoryEntryRepository, agent_memory_entry_candidate_repository_1.AgentMemoryEntryCandidateRepository, agent_memory_entry_lock_repository_1.AgentMemoryEntryLockRepository, agent_memory_entry_source_repository_1.AgentMemoryEntrySourceRepository])
], N8nMemory);
class N8nMemoryImpl {
    constructor(agentId, threadRepository, messageRepository, resourceRepository, observationRepository, observationCursorRepository, observationLockRepository, memoryEntryRepository, memoryEntryCandidateRepository, memoryEntryLockRepository, memoryEntrySourceRepository) {
        this.agentId = agentId;
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.resourceRepository = resourceRepository;
        this.observationRepository = observationRepository;
        this.observationCursorRepository = observationCursorRepository;
        this.observationLockRepository = observationLockRepository;
        this.memoryEntryRepository = memoryEntryRepository;
        this.memoryEntryCandidateRepository = memoryEntryCandidateRepository;
        this.memoryEntryLockRepository = memoryEntryLockRepository;
        this.memoryEntrySourceRepository = memoryEntrySourceRepository;
        this.episodic = {
            saveEntryWithSources: async (entry, sources) => await this.saveEpisodicMemoryEntryWithSources(entry, sources),
            searchEntries: async (scope, query, opts) => await this.searchEpisodicMemoryEntries(scope, query, opts),
            getEntrySources: async (entryIds) => await this.getEpisodicMemoryEntrySources(entryIds),
            applyReflection: async (scope, reflection) => await this.applyEpisodicMemoryReflection(scope, reflection),
            enqueueCaptureCandidate: async (candidate) => await this.enqueueEpisodicMemoryCaptureCandidate(candidate),
            getPendingCaptureCandidates: async (scope, opts) => await this.getPendingEpisodicMemoryCaptureCandidates(scope, opts),
            completeCaptureCandidates: async (ids) => await this.completeEpisodicMemoryCaptureCandidates(ids),
            recordCaptureCandidateFailure: async (ids, maxAttempts) => await this.recordEpisodicMemoryCaptureCandidateFailure(ids, maxAttempts),
            taskLock: {
                acquire: async (scope, opts) => await this.acquireEpisodicMemoryTaskLock(scope, opts),
                release: async (handle) => await this.releaseEpisodicMemoryTaskLock(handle),
            },
        };
    }
    async getThread(threadId) {
        const entity = await this.threadRepository.findOneBy({ id: threadId });
        if (!entity)
            return null;
        return this.toThread(entity);
    }
    async saveThread(thread) {
        await this.resourceRepository.ensureExists(thread.resourceId);
        const updated = await this.threadRepository.patchThread(thread.id, (row) => {
            if (thread.title === undefined && thread.metadata === undefined)
                return null;
            return {
                title: thread.title,
                metadata: thread.metadata === undefined
                    ? undefined
                    : this.mergeThreadMetadata(row.metadata, thread.metadata),
            };
        }, {});
        if (updated)
            return this.toThread(updated);
        const entity = this.threadRepository.create({
            id: thread.id,
            resourceId: thread.resourceId,
            title: thread.title ?? null,
            metadata: thread.metadata ? JSON.stringify(thread.metadata) : null,
        });
        const saved = await this.threadRepository.save(entity);
        return this.toThread(saved);
    }
    async patchThread(args, ctx = {}) {
        const row = await this.threadRepository.patchThread(args.threadId, (locked) => {
            const patch = args.update(this.toThread(locked));
            if (!patch)
                return null;
            return {
                title: patch.title,
                metadata: patch.metadata === undefined ? undefined : JSON.stringify(patch.metadata),
            };
        }, ctx);
        return row ? this.toThread(row) : null;
    }
    async deleteThread(threadId, ctx = {}) {
        await this.threadRepository.runInTransaction(ctx, async (trx) => {
            await this.dropEpisodicEntriesWithoutSources(trx, threadId);
            const observationScope = { agentId: this.agentId, observationScopeId: threadId };
            await trx.delete(agent_observation_entity_1.AgentObservationEntity, observationScope);
            await trx.delete(agent_observation_cursor_entity_1.AgentObservationCursorEntity, observationScope);
            await trx.delete(agent_observation_lock_entity_1.AgentObservationLockEntity, observationScope);
            await trx.delete(agent_thread_entity_1.AgentThreadEntity, { id: threadId });
        });
    }
    async deleteThreadsByPrefix(threadIdPrefix) {
        const observationScopeId = (0, typeorm_1.Like)(`${threadIdPrefix}%`);
        await this.threadRepository.manager.transaction(async (trx) => {
            await this.dropEpisodicEntriesWithoutSources(trx, observationScopeId);
            const observationScope = { agentId: this.agentId, observationScopeId };
            await trx.delete(agent_observation_entity_1.AgentObservationEntity, observationScope);
            await trx.delete(agent_observation_cursor_entity_1.AgentObservationCursorEntity, observationScope);
            await trx.delete(agent_observation_lock_entity_1.AgentObservationLockEntity, observationScope);
            await trx.delete(agent_thread_entity_1.AgentThreadEntity, { id: observationScopeId });
        });
    }
    async dropEpisodicEntriesWithoutSources(trx, threadId) {
        const sourceRepo = trx.getRepository(agent_memory_entry_source_entity_1.AgentMemoryEntrySourceEntity);
        const entryRepo = trx.getRepository(agent_memory_entry_entity_1.AgentMemoryEntryEntity);
        const affectedSources = await sourceRepo.find({
            select: { memoryEntryId: true },
            where: { agentId: this.agentId, threadId },
        });
        const affectedEntryIds = (0, agents_1.uniqueStrings)(affectedSources.map((source) => source.memoryEntryId));
        if (affectedEntryIds.length === 0)
            return;
        await trx.delete(agent_memory_entry_source_entity_1.AgentMemoryEntrySourceEntity, {
            agentId: this.agentId,
            threadId,
        });
        const remainingSources = await sourceRepo.find({
            select: { memoryEntryId: true },
            where: { agentId: this.agentId, memoryEntryId: (0, typeorm_1.In)(affectedEntryIds) },
        });
        const entriesWithSources = new Set(remainingSources.map((source) => source.memoryEntryId));
        const orphanedEntryIds = affectedEntryIds.filter((id) => !entriesWithSources.has(id));
        if (orphanedEntryIds.length === 0)
            return;
        await entryRepo.update({ agentId: this.agentId, id: (0, typeorm_1.In)(orphanedEntryIds), status: 'active' }, (0, agents_1.droppedLifecycleState)());
    }
    async getMessages(threadId, opts) {
        const filterByResource = opts?.resourceId !== undefined && !(0, agent_memory_scope_1.isIntegrationMemoryResourceId)(opts.resourceId);
        const entities = await this.messageRepository.findRuntimeMessages({ threadId, ...(filterByResource && { resourceId: opts?.resourceId }) }, opts);
        return entities.map((e) => this.toAgentDbMessage(e));
    }
    async saveMessages(args) {
        const executionId = args.hostMetadata?.[agent_queued_message_1.EXECUTION_METADATA_KEY];
        await this.messageRepository.saveRuntimeMessages({
            threadId: args.threadId,
            resourceId: args.resourceId,
            messages: args.messages,
            ...(typeof executionId === 'string' && { executionId }),
        });
    }
    async deleteMessages(messageIds) {
        await this.messageRepository.discardRuntimeInput(messageIds);
    }
    async appendObservationLogEntries(rows) {
        if (rows.length === 0)
            return [];
        const entities = await Promise.all(rows.map(async (row) => this.observationRepository.create({
            agentId: this.agentId,
            observationScopeId: row.observationScopeId,
            marker: row.marker,
            text: row.text,
            parentId: row.parentId ?? null,
            tokenCount: row.tokenCount ?? (await (0, agents_1.estimateObservationTokens)(row.text)),
            ...(0, agents_1.activeLifecycleState)(),
            createdAt: row.createdAt,
        })));
        const saved = await this.observationRepository.save(entities);
        return saved.map((e) => this.toObservationLogEntry(e));
    }
    async getActiveObservationLog(scope) {
        return await this.getObservationLog({ ...scope, status: 'active' });
    }
    async getObservationLog(opts) {
        const baseWhere = {
            agentId: this.agentId,
            observationScopeId: opts.observationScopeId,
            ...(opts.status !== undefined && { status: opts.status }),
            ...(opts.parentId !== undefined && { parentId: opts.parentId ?? (0, typeorm_1.IsNull)() }),
        };
        const entities = await this.observationRepository.find({
            where: [baseWhere],
            order: {
                createdAt: opts.order === 'desc' ? 'DESC' : 'ASC',
                id: opts.order === 'desc' ? 'DESC' : 'ASC',
            },
            ...(opts.limit !== undefined && { take: opts.limit }),
        });
        return entities.map((e) => this.toObservationLogEntry(e));
    }
    async getMessagesForObservationScope(observationScopeId, opts) {
        const entities = await this.messageRepository.findRuntimeMessages({ threadId: observationScopeId }, opts);
        return entities.map((e) => this.toAgentDbMessage(e));
    }
    async dropObservationLogEntries(ids) {
        if (ids.length === 0)
            return;
        await this.observationRepository.update({ id: (0, typeorm_1.In)(ids) }, (0, agents_1.droppedLifecycleState)());
    }
    async supersedeObservationLogEntries(ids, supersededBy) {
        if (ids.length === 0)
            return;
        await this.observationRepository.update({ id: (0, typeorm_1.In)(ids) }, (0, agents_1.supersededLifecycleState)(supersededBy));
    }
    async applyObservationLogReflection(scope, reflection) {
        return await this.observationRepository.manager.transaction(async (trx) => {
            const repo = trx.getRepository(agent_observation_entity_1.AgentObservationEntity);
            const activeEntries = await repo.find({
                where: {
                    agentId: this.agentId,
                    observationScopeId: scope.observationScopeId,
                    status: 'active',
                },
                order: { createdAt: 'ASC', id: 'ASC' },
            });
            const normalized = (0, agents_1.normalizeObservationLogReflection)(activeEntries.map((entry) => this.toObservationLogEntry(entry)), reflection);
            const inserted = normalized.merge.length
                ? await repo.save(await Promise.all(normalized.merge.map(async (entry) => repo.create({
                    agentId: this.agentId,
                    observationScopeId: scope.observationScopeId,
                    marker: entry.marker,
                    text: entry.text,
                    parentId: entry.parentId ?? null,
                    tokenCount: entry.tokenCount ?? (await (0, agents_1.estimateObservationTokens)(entry.text)),
                    ...(0, agents_1.activeLifecycleState)(),
                    createdAt: entry.createdAt,
                }))))
                : [];
            if (normalized.drop.length > 0) {
                await repo.update({
                    agentId: this.agentId,
                    observationScopeId: scope.observationScopeId,
                    id: (0, typeorm_1.In)(normalized.drop),
                }, (0, agents_1.droppedLifecycleState)());
            }
            for (const [index, merge] of normalized.merge.entries()) {
                const replacement = inserted[index];
                if (replacement && merge.supersedes.length > 0) {
                    await repo.update({
                        agentId: this.agentId,
                        observationScopeId: scope.observationScopeId,
                        id: (0, typeorm_1.In)(merge.supersedes),
                    }, (0, agents_1.supersededLifecycleState)(replacement.id));
                }
            }
            return {
                droppedIds: [...normalized.drop],
                supersededIds: normalized.merge.flatMap((entry) => entry.supersedes),
                inserted: inserted.map((entry) => this.toObservationLogEntry(entry)),
            };
        });
    }
    async getCursor(observationScopeId) {
        const entity = await this.observationCursorRepository.findOneBy({
            agentId: this.agentId,
            observationScopeId,
        });
        if (!entity)
            return null;
        return {
            observationScopeId: entity.observationScopeId,
            lastObservedMessageId: entity.lastObservedMessageId,
            lastObservedAt: entity.lastObservedAt,
            updatedAt: entity.updatedAt,
        };
    }
    async setCursor(cursor) {
        await this.observationCursorRepository.upsert({
            agentId: this.agentId,
            observationScopeId: cursor.observationScopeId,
            lastObservedMessageId: cursor.lastObservedMessageId,
            lastObservedAt: cursor.lastObservedAt,
            updatedAt: cursor.updatedAt,
        }, {
            conflictPaths: ['agentId', 'observationScopeId'],
            skipUpdateIfNoValuesChanged: false,
        });
    }
    async acquireObservationLogTaskLock(observationScopeId, taskKind, opts) {
        const now = new Date();
        const heldUntil = new Date(now.getTime() + opts.ttlMs);
        const updateResult = await this.observationLockRepository
            .createQueryBuilder()
            .update(agent_observation_lock_entity_1.AgentObservationLockEntity)
            .set({ taskKind, holderId: opts.holderId, heldUntil })
            .where('"agentId" = :agentId')
            .andWhere('"observationScopeId" = :observationScopeId')
            .andWhere('"taskKind" = :taskKind')
            .andWhere('("holderId" = :holderId OR "heldUntil" <= :now)')
            .setParameters({
            agentId: this.agentId,
            observationScopeId,
            taskKind,
            holderId: opts.holderId,
            now,
        })
            .execute();
        if ((updateResult.affected ?? 0) > 0) {
            return { observationScopeId, taskKind, holderId: opts.holderId, heldUntil };
        }
        await this.observationLockRepository
            .createQueryBuilder()
            .insert()
            .into(agent_observation_lock_entity_1.AgentObservationLockEntity)
            .values({
            agentId: this.agentId,
            observationScopeId,
            taskKind,
            holderId: opts.holderId,
            heldUntil,
        })
            .orIgnore()
            .execute();
        const claimed = await this.observationLockRepository.findOneBy({
            agentId: this.agentId,
            observationScopeId,
            taskKind,
            holderId: opts.holderId,
        });
        if (!claimed)
            return null;
        return { observationScopeId, taskKind, holderId: opts.holderId, heldUntil };
    }
    async releaseObservationLogTaskLock(handle) {
        await this.releaseScopeLock(handle);
    }
    async releaseScopeLock(handle) {
        await this.observationLockRepository.delete({
            agentId: this.agentId,
            observationScopeId: handle.observationScopeId,
            taskKind: handle.taskKind,
            holderId: handle.holderId,
        });
    }
    async enqueueEpisodicMemoryCaptureCandidate(candidate) {
        const resourceId = (0, agent_memory_scope_1.episodicMemoryWriteScopeId)(candidate);
        await this.resourceRepository.ensureExists(resourceId);
        const entity = await this.memoryEntryCandidateRepository.enqueueCandidate({
            agentId: this.agentId,
            ...candidate,
            resourceId,
        });
        return this.toEpisodicMemoryCaptureCandidate(entity);
    }
    async getPendingEpisodicMemoryCaptureCandidates(scope, opts) {
        const entities = await this.memoryEntryCandidateRepository.findPendingForResource(this.agentId, (0, agent_memory_scope_1.episodicMemoryWriteScopeId)(scope), opts?.limit ?? 100);
        return entities.map((entity) => this.toEpisodicMemoryCaptureCandidate(entity));
    }
    async completeEpisodicMemoryCaptureCandidates(ids) {
        await this.memoryEntryCandidateRepository.markCandidatesCompleted(this.agentId, ids);
    }
    async recordEpisodicMemoryCaptureCandidateFailure(ids, maxAttempts) {
        await this.memoryEntryCandidateRepository.recordCandidateFailure(this.agentId, ids, maxAttempts);
    }
    async acquireEpisodicMemoryTaskLock(scope, opts) {
        const resourceId = (0, agent_memory_scope_1.episodicMemoryWriteScopeId)(scope);
        await this.resourceRepository.ensureExists(resourceId);
        const now = new Date();
        const heldUntil = new Date(now.getTime() + opts.ttlMs);
        const updateResult = await this.memoryEntryLockRepository
            .createQueryBuilder()
            .update(agent_memory_entry_lock_entity_1.AgentMemoryEntryLockEntity)
            .set({ holderId: opts.holderId, heldUntil })
            .where('"agentId" = :agentId')
            .andWhere('"resourceId" = :resourceId')
            .andWhere('("holderId" = :holderId OR "heldUntil" <= :now)')
            .setParameters({
            agentId: this.agentId,
            resourceId,
            holderId: opts.holderId,
            now,
        })
            .execute();
        if ((updateResult.affected ?? 0) > 0) {
            return { resourceId, holderId: opts.holderId, heldUntil };
        }
        await this.memoryEntryLockRepository
            .createQueryBuilder()
            .insert()
            .into(agent_memory_entry_lock_entity_1.AgentMemoryEntryLockEntity)
            .values({ agentId: this.agentId, resourceId, holderId: opts.holderId, heldUntil })
            .orIgnore()
            .execute();
        const claimed = await this.memoryEntryLockRepository.findOneBy({
            agentId: this.agentId,
            resourceId,
            holderId: opts.holderId,
        });
        if (!claimed)
            return null;
        return { resourceId, holderId: opts.holderId, heldUntil };
    }
    async releaseEpisodicMemoryTaskLock(handle) {
        await this.memoryEntryLockRepository.delete({
            agentId: this.agentId,
            resourceId: handle.resourceId,
            holderId: handle.holderId,
        });
    }
    async saveEpisodicMemoryEntryWithSources(entry, sources) {
        const sourceThreadId = sources[0]?.threadId;
        const resourceId = sourceThreadId
            ? (0, agent_memory_scope_1.episodicMemoryWriteScopeId)({ resourceId: entry.resourceId, threadId: sourceThreadId })
            : entry.resourceId;
        await this.resourceRepository.ensureExists(resourceId);
        return await this.memoryEntryRepository.manager.transaction(async (trx) => {
            const entryRepo = trx.getRepository(agent_memory_entry_entity_1.AgentMemoryEntryEntity);
            const sourceRepo = trx.getRepository(agent_memory_entry_source_entity_1.AgentMemoryEntrySourceEntity);
            const contentHash = entry.contentHash ?? (0, agents_1.hashEpisodicMemoryContent)(entry.content);
            const now = new Date();
            const entity = entryRepo.create({
                agentId: this.agentId,
                resourceId,
                content: entry.content,
                contentHash,
                ...(0, agents_1.activeLifecycleState)(),
                embeddingModel: entry.embeddingModel ?? null,
                embedding: entry.embedding ?? null,
                metadata: entry.metadata ?? null,
                createdAt: entry.createdAt ?? now,
                lastSeenAt: entry.lastSeenAt ?? now,
            });
            let persisted = null;
            try {
                const [saved] = await entryRepo.save([entity]);
                persisted = saved ?? null;
            }
            catch (error) {
                if (!(error instanceof Error) || !(0, response_helper_1.isUniqueConstraintError)(error))
                    throw error;
                const existing = await entryRepo.findOneBy({
                    agentId: this.agentId,
                    resourceId,
                    contentHash,
                });
                if (!existing)
                    throw error;
                (0, agents_1.markLifecycleActive)(existing);
                existing.lastSeenAt = entry.lastSeenAt ?? now;
                existing.updatedAt = now;
                const [saved] = await entryRepo.save([existing]);
                persisted = saved ?? existing;
            }
            if (!persisted)
                return null;
            for (const source of sources) {
                const evidenceHash = (0, agents_1.hashEpisodicMemoryEvidence)(source.evidenceText);
                const sourceEntity = sourceRepo.create({
                    agentId: this.agentId,
                    memoryEntryId: persisted.id,
                    observationId: source.observationId ?? null,
                    candidateId: source.candidateId ?? null,
                    threadId: source.threadId,
                    evidenceHash,
                    evidenceText: source.evidenceText,
                    createdAt: source.createdAt,
                });
                try {
                    await sourceRepo.save([sourceEntity]);
                }
                catch (error) {
                    if (!(error instanceof Error) || !(0, response_helper_1.isUniqueConstraintError)(error))
                        throw error;
                    const existing = await sourceRepo.findOneBy({
                        agentId: this.agentId,
                        memoryEntryId: persisted.id,
                        observationId: source.observationId ?? (0, typeorm_1.IsNull)(),
                        candidateId: source.candidateId ?? (0, typeorm_1.IsNull)(),
                        evidenceHash,
                    });
                    if (!existing)
                        throw error;
                }
            }
            return this.toEpisodicMemoryEntry(persisted);
        });
    }
    async searchEpisodicMemoryEntries(scope, query, opts) {
        const statuses = opts?.includeStatuses ?? ['active'];
        const resourceIds = opts?.writeScopeOnly
            ? [(0, agent_memory_scope_1.episodicMemoryWriteScopeId)(scope)]
            : await this.episodicMemoryReadScopeIds(scope);
        const entities = await this.memoryEntryRepository.find({
            where: {
                agentId: this.agentId,
                resourceId: (0, typeorm_1.In)(resourceIds),
                status: (0, typeorm_1.In)(statuses),
            },
        });
        const newestByContent = new Map();
        for (const entity of entities) {
            const key = `${entity.status}\n${entity.contentHash}`;
            const seen = newestByContent.get(key);
            if (!seen || entity.lastSeenAt > seen.lastSeenAt)
                newestByContent.set(key, entity);
        }
        return (0, agents_1.rankEpisodicMemoryEntries)([...newestByContent.values()].map((entity) => this.toEpisodicMemoryEntry(entity)), query, opts);
    }
    async episodicMemoryReadScopeIds(scope) {
        if (!(0, agent_memory_scope_1.isIntegrationMemoryResourceId)(scope.resourceId))
            return [scope.resourceId];
        const threadIds = await this.messageRepository.findRecentThreadIdsByResourceId(this.agentId, scope.resourceId, EPISODIC_MEMORY_MAX_THREAD_SCOPES);
        return (0, agents_1.uniqueStrings)([
            scope.resourceId,
            (0, agent_memory_scope_1.threadMemoryResourceId)(scope.threadId),
            ...threadIds.map(agent_memory_scope_1.threadMemoryResourceId),
        ]);
    }
    async getEpisodicMemoryEntrySources(entryIds) {
        if (entryIds.length === 0)
            return [];
        const entities = await this.memoryEntrySourceRepository.find({
            where: { agentId: this.agentId, memoryEntryId: (0, typeorm_1.In)(entryIds) },
            order: { createdAt: 'ASC', id: 'ASC' },
        });
        return entities.map((entity) => this.toEpisodicMemoryEntrySource(entity));
    }
    async applyEpisodicMemoryReflection(scope, reflection) {
        const resourceId = (0, agent_memory_scope_1.episodicMemoryWriteScopeId)(scope);
        return await this.memoryEntryRepository.manager.transaction(async (trx) => {
            const entryRepo = trx.getRepository(agent_memory_entry_entity_1.AgentMemoryEntryEntity);
            const sourceRepo = trx.getRepository(agent_memory_entry_source_entity_1.AgentMemoryEntrySourceEntity);
            const actionIds = (0, agents_1.uniqueStrings)([
                ...reflection.drop,
                ...reflection.merge.flatMap((merge) => merge.supersedes),
            ]);
            if (actionIds.length === 0)
                return { droppedIds: [], supersededIds: [], inserted: [] };
            const activeEntries = await entryRepo.find({
                where: {
                    agentId: this.agentId,
                    resourceId,
                    id: (0, typeorm_1.In)(actionIds),
                    status: 'active',
                },
            });
            const activeIds = new Set(activeEntries.map((entry) => entry.id));
            const normalized = (0, agents_1.normalizeFlatReflectionActions)({
                activeIds,
                drop: reflection.drop,
                merge: reflection.merge,
                normalizeMerge: (entry, supersedes) => ({ ...entry, supersedes }),
            });
            const now = new Date();
            const replacementHashes = (0, agents_1.uniqueStrings)(normalized.merge.map((item) => item.entry.contentHash ?? (0, agents_1.hashEpisodicMemoryContent)(item.entry.content)));
            const existingReplacements = replacementHashes.length
                ? await entryRepo.find({
                    where: {
                        agentId: this.agentId,
                        resourceId,
                        contentHash: (0, typeorm_1.In)(replacementHashes),
                    },
                })
                : [];
            const existingByHash = new Map(existingReplacements.map((entry) => [entry.contentHash, entry]));
            const replacements = [];
            for (const item of normalized.merge) {
                const contentHash = item.entry.contentHash ?? (0, agents_1.hashEpisodicMemoryContent)(item.entry.content);
                const existing = existingByHash.get(contentHash);
                const update = {
                    ...(0, agents_1.activeLifecycleState)(),
                    lastSeenAt: item.entry.lastSeenAt ?? now,
                    updatedAt: now,
                };
                if (item.entry.embedding !== undefined)
                    update.embedding = item.entry.embedding;
                if (item.entry.embeddingModel !== undefined) {
                    update.embeddingModel = item.entry.embeddingModel;
                }
                if (item.entry.metadata !== undefined)
                    update.metadata = item.entry.metadata;
                if (existing) {
                    await entryRepo.update({ agentId: this.agentId, resourceId, id: existing.id }, update);
                    replacements.push({
                        ...existing,
                        ...update,
                    });
                    continue;
                }
                const entity = entryRepo.create({
                    agentId: this.agentId,
                    resourceId,
                    content: item.entry.content,
                    contentHash,
                    ...(0, agents_1.activeLifecycleState)(),
                    embeddingModel: item.entry.embeddingModel ?? null,
                    embedding: item.entry.embedding ?? null,
                    metadata: item.entry.metadata ?? null,
                    createdAt: item.entry.createdAt ?? now,
                    lastSeenAt: item.entry.lastSeenAt ?? now,
                });
                try {
                    const [persisted] = await entryRepo.save([entity]);
                    if (persisted) {
                        existingByHash.set(contentHash, persisted);
                        replacements.push(persisted);
                    }
                }
                catch (error) {
                    if (!(error instanceof Error) || !(0, response_helper_1.isUniqueConstraintError)(error))
                        throw error;
                    const persisted = await entryRepo.findOneBy({
                        agentId: this.agentId,
                        resourceId,
                        contentHash,
                    });
                    if (!persisted)
                        throw error;
                    await entryRepo.update({ agentId: this.agentId, resourceId, id: persisted.id }, update);
                    existingByHash.set(contentHash, persisted);
                    replacements.push({
                        ...persisted,
                        ...update,
                    });
                }
            }
            const replacementIds = new Set(replacements.map((entry) => entry.id));
            const effectiveDrop = normalized.drop.filter((id) => !replacementIds.has(id));
            if (effectiveDrop.length > 0) {
                await entryRepo.update({
                    agentId: this.agentId,
                    resourceId,
                    id: (0, typeorm_1.In)(effectiveDrop),
                    status: 'active',
                }, (0, agents_1.droppedLifecycleState)());
            }
            const supersededIds = [];
            for (const [index, item] of normalized.merge.entries()) {
                const replacement = replacements[index];
                if (!replacement)
                    continue;
                const sourceRows = await sourceRepo.find({
                    where: { agentId: this.agentId, memoryEntryId: (0, typeorm_1.In)(item.supersedes) },
                    order: { createdAt: 'ASC', id: 'ASC' },
                });
                const existingReplacementSources = await sourceRepo.find({
                    where: { agentId: this.agentId, memoryEntryId: replacement.id },
                });
                const existingKeys = new Set(existingReplacementSources.map((source) => `${source.observationId ?? source.candidateId}\n${source.evidenceHash}`));
                const copiedSources = sourceRows.flatMap((source) => {
                    const key = `${source.observationId ?? source.candidateId}\n${source.evidenceHash}`;
                    if (existingKeys.has(key))
                        return [];
                    existingKeys.add(key);
                    return [
                        sourceRepo.create({
                            agentId: this.agentId,
                            memoryEntryId: replacement.id,
                            observationId: source.observationId,
                            candidateId: source.candidateId,
                            threadId: source.threadId,
                            evidenceHash: source.evidenceHash,
                            evidenceText: source.evidenceText,
                            createdAt: now,
                        }),
                    ];
                });
                if (copiedSources.length > 0)
                    await sourceRepo.save(copiedSources);
                const itemSupersededIds = item.supersedes.filter((id) => id !== replacement.id);
                if (itemSupersededIds.length > 0) {
                    await entryRepo.update({
                        agentId: this.agentId,
                        resourceId,
                        id: (0, typeorm_1.In)(itemSupersededIds),
                        status: 'active',
                    }, (0, agents_1.supersededLifecycleState)(replacement.id));
                    supersededIds.push(...itemSupersededIds);
                }
            }
            return {
                droppedIds: effectiveDrop,
                supersededIds,
                inserted: replacements.map((entry) => this.toEpisodicMemoryEntry(entry)),
            };
        });
    }
    describe() {
        return { name: 'n8n', connectionParams: {}, constructorName: this.constructor.name };
    }
    toAgentDbMessage(entity) {
        return {
            ...(entity.modelContent ?? entity.content),
            id: entity.id,
            createdAt: entity.modelContextAt ?? entity.createdAt,
        };
    }
    toObservationLogEntry(entity) {
        return {
            id: entity.id,
            observationScopeId: entity.observationScopeId,
            marker: entity.marker,
            text: entity.text,
            parentId: entity.parentId,
            tokenCount: Number(entity.tokenCount),
            status: entity.status,
            supersededBy: entity.supersededBy,
            createdAt: entity.createdAt,
        };
    }
    toEpisodicMemoryEntry(entity) {
        return {
            id: entity.id,
            resourceId: entity.resourceId,
            content: entity.content,
            contentHash: entity.contentHash,
            status: entity.status,
            supersededBy: entity.supersededBy,
            ...(entity.embedding ? { embedding: entity.embedding } : {}),
            ...(entity.embeddingModel ? { embeddingModel: entity.embeddingModel } : {}),
            metadata: entity.metadata,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            lastSeenAt: entity.lastSeenAt,
        };
    }
    toEpisodicMemoryCaptureCandidate(entity) {
        return {
            id: entity.id,
            resourceId: entity.resourceId,
            threadId: entity.threadId,
            sourceMessageId: entity.sourceMessageId,
            runId: entity.runId,
            toolCallId: entity.toolCallId,
            content: entity.content,
            evidenceText: entity.evidenceText,
            kind: entity.kind,
            status: entity.status,
            attemptCount: entity.attemptCount,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
    toEpisodicMemoryEntrySource(entity) {
        const source = {
            id: entity.id,
            memoryEntryId: entity.memoryEntryId,
            threadId: entity.threadId,
            evidenceText: entity.evidenceText,
            createdAt: entity.createdAt,
        };
        if (entity.observationId)
            return { ...source, observationId: entity.observationId };
        if (entity.candidateId)
            return { ...source, candidateId: entity.candidateId };
        throw new n8n_workflow_1.UnexpectedError('Episodic memory entry source has no provenance');
    }
    mergeThreadMetadata(existingMetadata, nextMetadata) {
        return JSON.stringify({
            ...this.parseThreadMetadata(existingMetadata),
            ...nextMetadata,
        });
    }
    parseThreadMetadata(value) {
        if (!value)
            return undefined;
        try {
            return JSON.parse(value);
        }
        catch {
            return undefined;
        }
    }
    toThread(entity) {
        return {
            id: entity.id,
            resourceId: entity.resourceId,
            title: entity.title ?? undefined,
            metadata: this.parseThreadMetadata(entity.metadata),
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
exports.N8nMemoryImpl = N8nMemoryImpl;
//# sourceMappingURL=n8n-memory.js.map