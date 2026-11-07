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
exports.InstanceAiPendingConfirmationRepository = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const instance_ai_pending_confirmation_entity_1 = require("../entities/instance-ai-pending-confirmation.entity");
let InstanceAiPendingConfirmationRepository = class InstanceAiPendingConfirmationRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(instance_ai_pending_confirmation_entity_1.InstanceAiPendingConfirmation, dataSource.manager);
    }
    async claim(requestId, userId) {
        return await this.manager.transaction(async (manager) => {
            const repo = manager.getRepository(instance_ai_pending_confirmation_entity_1.InstanceAiPendingConfirmation);
            const now = new Date();
            const liveWhere = {
                requestId,
                userId,
                expiresAt: (0, typeorm_1.Or)((0, typeorm_1.IsNull)(), (0, typeorm_1.MoreThanOrEqual)(now)),
            };
            const row = await repo.findOne({
                where: liveWhere,
                ...(manager.connection.options.type === 'postgres'
                    ? { lock: { mode: 'pessimistic_write' } }
                    : {}),
            });
            if (!row)
                return undefined;
            const result = await repo.delete(liveWhere);
            if (result.affected === 0)
                return undefined;
            return row;
        });
    }
    async deleteByRequestId(requestId) {
        const result = await this.delete({ requestId });
        return result.affected ?? 0;
    }
    async deleteByThreadId(threadId) {
        const result = await this.delete({ threadId });
        return result.affected ?? 0;
    }
    async deleteByRunId(runId) {
        const result = await this.delete({ runId });
        return result.affected ?? 0;
    }
    async deleteExpired(now) {
        const result = await this.delete({ expiresAt: (0, typeorm_1.LessThan)(now) });
        return result.affected ?? 0;
    }
    async isPastExpiry(requestId, userId, now) {
        const count = await this.count({ where: { requestId, userId, expiresAt: (0, typeorm_1.LessThan)(now) } });
        return count > 0;
    }
    async findByThreadId(threadId) {
        return await this.find({ where: { threadId } });
    }
    async findLiveRequestIds(requestIds, now) {
        if (requestIds.length === 0)
            return new Set();
        const rows = await this.find({
            where: {
                requestId: (0, typeorm_1.In)(requestIds),
                expiresAt: (0, typeorm_1.Or)((0, typeorm_1.IsNull)(), (0, typeorm_1.MoreThanOrEqual)(now)),
            },
            select: ['requestId'],
        });
        return new Set(rows.map((row) => row.requestId));
    }
};
exports.InstanceAiPendingConfirmationRepository = InstanceAiPendingConfirmationRepository;
exports.InstanceAiPendingConfirmationRepository = InstanceAiPendingConfirmationRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], InstanceAiPendingConfirmationRepository);
//# sourceMappingURL=instance-ai-pending-confirmation.repository.js.map