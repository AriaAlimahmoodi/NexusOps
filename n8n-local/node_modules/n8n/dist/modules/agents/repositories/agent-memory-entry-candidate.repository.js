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
exports.AgentMemoryEntryCandidateRepository = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const agent_memory_entry_candidate_entity_1 = require("../entities/agent-memory-entry-candidate.entity");
let AgentMemoryEntryCandidateRepository = class AgentMemoryEntryCandidateRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(agent_memory_entry_candidate_entity_1.AgentMemoryEntryCandidateEntity, dataSource.manager);
    }
    async enqueueCandidate(input) {
        const existing = await this.findOneBy({
            agentId: input.agentId,
            runId: input.runId,
            toolCallId: input.toolCallId,
        });
        if (existing)
            return existing;
        try {
            return await this.save(this.create({ ...input, status: 'pending', attemptCount: 0 }));
        }
        catch (error) {
            const concurrentlyInserted = await this.findOneBy({
                agentId: input.agentId,
                runId: input.runId,
                toolCallId: input.toolCallId,
            });
            if (concurrentlyInserted)
                return concurrentlyInserted;
            throw error;
        }
    }
    async findPendingForResource(agentId, resourceId, limit) {
        return await this.find({
            where: { agentId, resourceId, status: 'pending' },
            order: { createdAt: 'ASC', id: 'ASC' },
            take: limit,
        });
    }
    async markCandidatesCompleted(agentId, ids) {
        if (ids.length === 0)
            return;
        await this.update({ agentId, id: (0, typeorm_1.In)(ids), status: 'pending' }, { status: 'completed' });
    }
    async recordCandidateFailure(agentId, ids, maxAttempts) {
        if (ids.length === 0)
            return;
        await this.createQueryBuilder()
            .update(agent_memory_entry_candidate_entity_1.AgentMemoryEntryCandidateEntity)
            .set({
            attemptCount: () => '"attemptCount" + 1',
            status: () => "CASE WHEN \"attemptCount\" + 1 >= :maxAttempts THEN 'failed' ELSE 'pending' END",
        })
            .where('"agentId" = :agentId', { agentId })
            .andWhere('"id" IN (:...ids)', { ids })
            .andWhere('"status" = \'pending\'')
            .setParameter('maxAttempts', maxAttempts)
            .execute();
    }
};
exports.AgentMemoryEntryCandidateRepository = AgentMemoryEntryCandidateRepository;
exports.AgentMemoryEntryCandidateRepository = AgentMemoryEntryCandidateRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AgentMemoryEntryCandidateRepository);
//# sourceMappingURL=agent-memory-entry-candidate.repository.js.map