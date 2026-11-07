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
exports.AgentCheckpointRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const agent_checkpoint_entity_1 = require("../entities/agent-checkpoint.entity");
let AgentCheckpointRepository = class AgentCheckpointRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_checkpoint_entity_1.AgentCheckpoint, dataSource.manager, transactionRunner);
    }
    async findByRunId(runId, ctx = {}) {
        return await this.managerFor(ctx).findOneBy(agent_checkpoint_entity_1.AgentCheckpoint, { runId });
    }
    async findByRunIdAndAgentId(runId, agentId, ctx = {}) {
        return await this.managerFor(ctx).findOneBy(agent_checkpoint_entity_1.AgentCheckpoint, { runId, agentId });
    }
    async findActiveForThread(agentId, threadId, updatedAfter, ctx = {}) {
        return await this.managerFor(ctx).find(agent_checkpoint_entity_1.AgentCheckpoint, {
            where: { agentId, threadId, expired: false, updatedAt: (0, typeorm_1.MoreThan)(updatedAfter) },
            order: { updatedAt: 'DESC' },
        });
    }
    async saveCheckpoint(checkpoint, ctx) {
        await this.managerFor(ctx).save(agent_checkpoint_entity_1.AgentCheckpoint, checkpoint);
    }
    async findRetainedByThreadId(threadId) {
        return await this.find({ where: { threadId } });
    }
    async findForSandboxReconciliation(agentId) {
        return await this.find({
            where: { agentId, expired: false },
            order: { updatedAt: 'DESC' },
            take: 101,
        });
    }
    async claimForResume(runId, agentId, suspendedState, runningState, updatedAfter) {
        const result = await this.update({ runId, agentId, expired: false, state: suspendedState, updatedAt: (0, typeorm_1.MoreThan)(updatedAfter) }, { state: runningState });
        return (result.affected ?? 0) > 0;
    }
    async cancelSuspended(runId, agentId, suspendedState, ctx = {}) {
        const result = await this.managerFor(ctx).update(agent_checkpoint_entity_1.AgentCheckpoint, { runId, agentId, expired: false, state: suspendedState }, { expired: true });
        return (result.affected ?? 0) > 0;
    }
    async markUserPaused(runId, agentId, state, pausedState, updatedAt) {
        const result = await this.update({ runId, agentId, state, expired: false, updatedAt }, { state: pausedState, updatedAt });
        return result.affected === 1;
    }
    async expireByRunIdAndAgentId(runId, agentId, ctx = {}) {
        await this.managerFor(ctx).update(agent_checkpoint_entity_1.AgentCheckpoint, { runId, agentId }, { expired: true, state: null });
    }
    async markExpired(olderThan) {
        const result = await this.createQueryBuilder()
            .update()
            .set({ expired: true, state: null })
            .where('updatedAt < :olderThan', { olderThan })
            .andWhere('state IS NOT NULL')
            .execute();
        return result.affected ?? 0;
    }
};
exports.AgentCheckpointRepository = AgentCheckpointRepository;
exports.AgentCheckpointRepository = AgentCheckpointRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentCheckpointRepository);
//# sourceMappingURL=agent-checkpoint.repository.js.map