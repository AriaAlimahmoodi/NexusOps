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
exports.TypeORMAgentCheckpointStore = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const instance_ai_checkpoint_repository_1 = require("../repositories/instance-ai-checkpoint.repository");
const EXPIRED_CHECKPOINT_MESSAGE = 'This action has expired and cannot be resumed. Please start a new turn.';
let TypeORMAgentCheckpointStore = class TypeORMAgentCheckpointStore {
    constructor(checkpointRepo) {
        this.checkpointRepo = checkpointRepo;
    }
    async save(key, state) {
        const threadId = state.persistence?.threadId;
        if (!threadId) {
            throw new n8n_workflow_1.UnexpectedError('Instance AI checkpoint state is missing a thread id', {
                extra: { key },
            });
        }
        const existing = await this.checkpointRepo.findOne({ where: { key } });
        if (existing) {
            existing.runId = this.getRunId(key);
            existing.hostRunId = state.persistence?.hostRunId ?? null;
            existing.threadId = threadId;
            existing.resourceId = state.persistence?.resourceId ?? null;
            existing.state = state;
            existing.expiredAt = null;
            await this.checkpointRepo.save(existing);
            return;
        }
        const checkpoint = this.checkpointRepo.create({
            key,
            runId: this.getRunId(key),
            hostRunId: state.persistence?.hostRunId ?? null,
            threadId,
            resourceId: state.persistence?.resourceId ?? null,
            state,
            expiredAt: null,
        });
        await this.checkpointRepo.save(checkpoint);
    }
    async load(key) {
        const checkpoint = await this.checkpointRepo.findOne({ where: { key } });
        if (!checkpoint)
            return undefined;
        if (checkpoint.expiredAt !== null || checkpoint.state === null) {
            throw new n8n_workflow_1.UserError(EXPIRED_CHECKPOINT_MESSAGE);
        }
        return checkpoint.state;
    }
    async claimForResume(key, state) {
        return await this.checkpointRepo.claimSuspendedForResume(key, state);
    }
    async delete(key) {
        await this.checkpointRepo.update({ key }, { expiredAt: new Date(), state: null });
    }
    async markExpiredOlderThan(olderThan) {
        const result = await this.checkpointRepo
            .createQueryBuilder()
            .update()
            .set({ expiredAt: new Date(), state: null })
            .where('updatedAt < :olderThan', { olderThan })
            .andWhere('expiredAt IS NULL')
            .execute();
        return result.affected ?? 0;
    }
    async deleteOlderThan(olderThan) {
        return await this.markExpiredOlderThan(olderThan);
    }
    async findSuspendedSubAgentResumeInfo(resourceId) {
        const row = await this.checkpointRepo.findActiveByResourceId(resourceId);
        if (!row?.state)
            return undefined;
        const suspendedEntry = Object.entries(row.state.pendingToolCalls ?? {}).find(([, call]) => call.suspended);
        const persistence = row.state.persistence;
        if (!suspendedEntry || !persistence?.threadId || !persistence.resourceId)
            return undefined;
        return {
            runId: row.key,
            toolCallId: suspendedEntry[0],
            persistence: { threadId: persistence.threadId, resourceId: persistence.resourceId },
        };
    }
    async hardDeleteExpiredOlderThan(olderThan) {
        const result = await this.checkpointRepo.delete({
            expiredAt: (0, typeorm_1.LessThan)(olderThan),
        });
        return result.affected ?? 0;
    }
    getRunId(key) {
        const separatorIndex = key.lastIndexOf(':');
        if (separatorIndex < 0 || separatorIndex === key.length - 1)
            return null;
        return key.slice(separatorIndex + 1);
    }
};
exports.TypeORMAgentCheckpointStore = TypeORMAgentCheckpointStore;
exports.TypeORMAgentCheckpointStore = TypeORMAgentCheckpointStore = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [instance_ai_checkpoint_repository_1.InstanceAiCheckpointRepository])
], TypeORMAgentCheckpointStore);
//# sourceMappingURL=typeorm-agent-checkpoint-store.js.map