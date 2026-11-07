"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeORMObservationLogStore = void 0;
const agents_1 = require("@n8n/agents");
const typeorm_1 = require("@n8n/typeorm");
const instance_ai_observation_lock_entity_1 = require("../entities/instance-ai-observation-lock.entity");
const instance_ai_observation_entity_1 = require("../entities/instance-ai-observation.entity");
function toObservationLogEntry(entity) {
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
class TypeORMObservationLogStore {
    constructor(observationRepo, observationCursorRepo, observationLockRepo, messageRepo, toAgentMessage) {
        this.observationRepo = observationRepo;
        this.observationCursorRepo = observationCursorRepo;
        this.observationLockRepo = observationLockRepo;
        this.messageRepo = messageRepo;
        this.toAgentMessage = toAgentMessage;
    }
    async appendObservationLogEntries(rows) {
        if (rows.length === 0)
            return [];
        const entities = await Promise.all(rows.map(async (row) => this.observationRepo.create({
            observationScopeId: row.observationScopeId,
            marker: row.marker,
            text: row.text,
            parentId: row.parentId ?? null,
            tokenCount: row.tokenCount ?? (await (0, agents_1.estimateObservationTokens)(row.text)),
            ...(0, agents_1.activeLifecycleState)(),
            createdAt: row.createdAt,
        })));
        const saved = await this.observationRepo.save(entities);
        return saved.map((entity) => toObservationLogEntry(entity));
    }
    async getActiveObservationLog(scope) {
        return await this.getObservationLog({ ...scope, status: 'active' });
    }
    async getObservationLog(opts) {
        const baseWhere = {
            observationScopeId: opts.observationScopeId,
            ...(opts.status !== undefined && { status: opts.status }),
            ...(opts.parentId !== undefined && { parentId: opts.parentId ?? (0, typeorm_1.IsNull)() }),
        };
        const entities = await this.observationRepo.find({
            where: [baseWhere],
            order: {
                createdAt: opts.order === 'desc' ? 'DESC' : 'ASC',
                id: opts.order === 'desc' ? 'DESC' : 'ASC',
            },
            ...(opts.limit !== undefined && { take: opts.limit }),
        });
        return entities.map((entity) => toObservationLogEntry(entity));
    }
    async getMessagesForObservationScope(observationScopeId, opts) {
        const baseWhere = {
            threadId: observationScopeId,
        };
        const where = opts?.since
            ? [
                { ...baseWhere, createdAt: (0, typeorm_1.MoreThan)(opts.since.sinceCreatedAt) },
                {
                    ...baseWhere,
                    createdAt: (0, typeorm_1.Equal)(opts.since.sinceCreatedAt),
                    id: (0, typeorm_1.MoreThan)(opts.since.sinceMessageId),
                },
            ]
            : [baseWhere];
        const entities = await this.messageRepo.find({
            where,
            order: { createdAt: 'ASC', id: 'ASC' },
        });
        return entities.flatMap((entity) => {
            const message = this.toAgentMessage(entity);
            return message ? [message] : [];
        });
    }
    async dropObservationLogEntries(ids) {
        if (ids.length === 0)
            return;
        await this.observationRepo.update({ id: (0, typeorm_1.In)(ids) }, (0, agents_1.droppedLifecycleState)());
    }
    async supersedeObservationLogEntries(ids, supersededBy) {
        if (ids.length === 0)
            return;
        await this.observationRepo.update({ id: (0, typeorm_1.In)(ids) }, (0, agents_1.supersededLifecycleState)(supersededBy));
    }
    async applyObservationLogReflection(scope, reflection) {
        return await this.observationRepo.manager.transaction(async (trx) => {
            const repo = trx.getRepository(instance_ai_observation_entity_1.InstanceAiObservation);
            const activeEntries = await repo.find({
                where: {
                    observationScopeId: scope.observationScopeId,
                    status: 'active',
                },
                order: { createdAt: 'ASC', id: 'ASC' },
            });
            const normalized = (0, agents_1.normalizeObservationLogReflection)(activeEntries.map((entry) => toObservationLogEntry(entry)), reflection);
            const inserted = normalized.merge.length
                ? await repo.save(await Promise.all(normalized.merge.map(async (entry) => repo.create({
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
                    observationScopeId: scope.observationScopeId,
                    id: (0, typeorm_1.In)(normalized.drop),
                }, (0, agents_1.droppedLifecycleState)());
            }
            for (const [index, merge] of normalized.merge.entries()) {
                const replacement = inserted[index];
                if (replacement && merge.supersedes.length > 0) {
                    await repo.update({
                        observationScopeId: scope.observationScopeId,
                        id: (0, typeorm_1.In)(merge.supersedes),
                    }, (0, agents_1.supersededLifecycleState)(replacement.id));
                }
            }
            return {
                droppedIds: [...normalized.drop],
                supersededIds: normalized.merge.flatMap((entry) => entry.supersedes),
                inserted: inserted.map((entry) => toObservationLogEntry(entry)),
            };
        });
    }
    async getCursor(observationScopeId) {
        const entity = await this.observationCursorRepo.findOneBy({ observationScopeId });
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
        await this.observationCursorRepo.upsert({
            observationScopeId: cursor.observationScopeId,
            lastObservedMessageId: cursor.lastObservedMessageId,
            lastObservedAt: cursor.lastObservedAt,
            updatedAt: cursor.updatedAt,
        }, {
            conflictPaths: ['observationScopeId'],
            skipUpdateIfNoValuesChanged: false,
        });
    }
    async acquireObservationLogTaskLock(observationScopeId, taskKind, opts) {
        const now = new Date();
        const heldUntil = new Date(now.getTime() + opts.ttlMs);
        const updateResult = await this.observationLockRepo
            .createQueryBuilder()
            .update(instance_ai_observation_lock_entity_1.InstanceAiObservationLock)
            .set({ taskKind, holderId: opts.holderId, heldUntil })
            .where('"observationScopeId" = :observationScopeId')
            .andWhere('"taskKind" = :taskKind')
            .andWhere('("holderId" = :holderId OR "heldUntil" <= :now)')
            .setParameters({
            observationScopeId,
            taskKind,
            holderId: opts.holderId,
            now,
        })
            .execute();
        if ((updateResult.affected ?? 0) > 0) {
            return { observationScopeId, taskKind, holderId: opts.holderId, heldUntil };
        }
        await this.observationLockRepo
            .createQueryBuilder()
            .insert()
            .into(instance_ai_observation_lock_entity_1.InstanceAiObservationLock)
            .values({
            observationScopeId,
            taskKind,
            holderId: opts.holderId,
            heldUntil,
        })
            .orIgnore()
            .execute();
        const claimed = await this.observationLockRepo.findOneBy({
            observationScopeId,
            taskKind,
            holderId: opts.holderId,
        });
        if (!claimed)
            return null;
        return { observationScopeId, taskKind, holderId: opts.holderId, heldUntil };
    }
    async releaseObservationLogTaskLock(handle) {
        await this.observationLockRepo.delete({
            observationScopeId: handle.observationScopeId,
            taskKind: handle.taskKind,
            holderId: handle.holderId,
        });
    }
}
exports.TypeORMObservationLogStore = TypeORMObservationLogStore;
//# sourceMappingURL=typeorm-observation-log-store.js.map