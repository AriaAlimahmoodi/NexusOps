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
exports.AgentTaskRunLockRepository = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const agent_task_run_lock_entity_1 = require("../entities/agent-task-run-lock.entity");
let AgentTaskRunLockRepository = class AgentTaskRunLockRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(agent_task_run_lock_entity_1.AgentTaskRunLock, dataSource.manager);
    }
    async acquire(agentId, taskId, opts) {
        const now = new Date();
        const heldUntil = new Date(now.getTime() + opts.ttlMs);
        const updateResult = await this.createQueryBuilder()
            .update(agent_task_run_lock_entity_1.AgentTaskRunLock)
            .set({ holderId: opts.holderId, heldUntil })
            .where('"agentId" = :agentId')
            .andWhere('"taskId" = :taskId')
            .andWhere('("holderId" = :holderId OR "heldUntil" <= :now)')
            .setParameters({
            agentId,
            taskId,
            holderId: opts.holderId,
            now,
        })
            .execute();
        if ((updateResult.affected ?? 0) > 0) {
            return { agentId, taskId, holderId: opts.holderId, heldUntil };
        }
        await this.createQueryBuilder()
            .insert()
            .into(agent_task_run_lock_entity_1.AgentTaskRunLock)
            .values({ agentId, taskId, holderId: opts.holderId, heldUntil })
            .orIgnore()
            .execute();
        const claimed = await this.findOneBy({ agentId, taskId, holderId: opts.holderId });
        if (!claimed)
            return null;
        return { agentId, taskId, holderId: opts.holderId, heldUntil };
    }
    async renew(handle, ttlMs) {
        const heldUntil = new Date(Date.now() + ttlMs);
        const result = await this.update({
            agentId: handle.agentId,
            taskId: handle.taskId,
            holderId: handle.holderId,
        }, { heldUntil });
        return (result.affected ?? 0) > 0;
    }
    async release(handle) {
        await this.delete({
            agentId: handle.agentId,
            taskId: handle.taskId,
            holderId: handle.holderId,
        });
    }
};
exports.AgentTaskRunLockRepository = AgentTaskRunLockRepository;
exports.AgentTaskRunLockRepository = AgentTaskRunLockRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AgentTaskRunLockRepository);
//# sourceMappingURL=agent-task-run-lock.repository.js.map