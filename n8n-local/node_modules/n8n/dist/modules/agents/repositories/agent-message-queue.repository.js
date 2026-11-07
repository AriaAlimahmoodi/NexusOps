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
exports.AgentMessageQueueRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const api_types_1 = require("@n8n/api-types");
const agent_message_queue_entity_1 = require("../entities/agent-message-queue.entity");
const agent_entity_1 = require("../entities/agent.entity");
let AgentMessageQueueRepository = class AgentMessageQueueRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_message_queue_entity_1.AgentMessageQueue, dataSource.manager, transactionRunner);
    }
    async enqueue(threadId, messageId, payload, ctx) {
        const repository = this.managerFor(ctx).getRepository(agent_message_queue_entity_1.AgentMessageQueue);
        const last = await repository.findOne({ where: { threadId }, order: { position: 'DESC' } });
        return await repository.save(repository.create({
            threadId,
            messageId,
            position: (last?.position ?? -1) + 1,
            payload,
            executionId: null,
            steeringExecutionId: null,
            steeringOrder: null,
        }));
    }
    async listPending(threadId, ctx = {}) {
        return await this.managerFor(ctx).find(agent_message_queue_entity_1.AgentMessageQueue, {
            where: { threadId, executionId: (0, typeorm_1.IsNull)() },
            relations: { message: true },
            order: { position: 'ASC', id: 'ASC' },
        });
    }
    async hasItems(threadId, ctx = {}) {
        return await this.managerFor(ctx).existsBy(agent_message_queue_entity_1.AgentMessageQueue, { threadId });
    }
    async findItem(threadId, id, ctx) {
        return await this.managerFor(ctx).findOne(agent_message_queue_entity_1.AgentMessageQueue, {
            where: { threadId, id },
            relations: { message: true },
        });
    }
    async movePending(threadId, id, targetId, expectedIds, kind, ctx) {
        const manager = this.managerFor(ctx);
        const pending = await manager.find(agent_message_queue_entity_1.AgentMessageQueue, {
            where: { threadId, executionId: (0, typeorm_1.IsNull)(), steeringExecutionId: (0, typeorm_1.IsNull)() },
            relations: { message: true },
            order: { position: 'ASC', id: 'ASC' },
        });
        const items = pending.filter((entry) => entry.message.origin?.hidden !== true);
        if (items.length !== expectedIds.length ||
            items.some((item, index) => item.id !== expectedIds[index])) {
            return false;
        }
        const from = items.findIndex((item) => item.id === id);
        const to = items.findIndex((item) => item.id === targetId);
        const item = items[from];
        if (!item || to < 0 || from === to)
            return false;
        const start = Math.min(from, to);
        const end = Math.max(from, to);
        if (items.slice(start, end + 1).some((entry) => entry.payload.kind !== kind))
            return false;
        const reordered = [...items];
        reordered.splice(from, 1);
        reordered.splice(to, 0, item);
        for (let index = start; index <= end; index++) {
            await manager.update(agent_message_queue_entity_1.AgentMessageQueue, reordered[index].id, {
                position: items[index].position,
            });
        }
        return true;
    }
    async removePending(threadId, id, ctx) {
        const result = await this.managerFor(ctx).delete(agent_message_queue_entity_1.AgentMessageQueue, {
            threadId,
            id,
            executionId: (0, typeorm_1.IsNull)(),
            steeringExecutionId: (0, typeorm_1.IsNull)(),
        });
        return result.affected === 1;
    }
    async findHead(threadId, ctx) {
        return await this.managerFor(ctx).findOne(agent_message_queue_entity_1.AgentMessageQueue, {
            where: { threadId },
            relations: { message: true },
            order: { position: 'ASC', id: 'ASC' },
        });
    }
    async reserveSteering(threadId, id, executionId, ctx) {
        const last = await this.managerFor(ctx).findOne(agent_message_queue_entity_1.AgentMessageQueue, {
            where: { threadId, steeringExecutionId: executionId },
            order: { steeringOrder: 'DESC' },
        });
        const result = await this.managerFor(ctx).update(agent_message_queue_entity_1.AgentMessageQueue, { threadId, id, executionId: (0, typeorm_1.IsNull)(), steeringExecutionId: (0, typeorm_1.IsNull)() }, { steeringExecutionId: executionId, steeringOrder: (last?.steeringOrder ?? 0) + 1 });
        return result.affected === 1;
    }
    async findSteering(threadId, executionId, ctx) {
        return await this.managerFor(ctx).find(agent_message_queue_entity_1.AgentMessageQueue, {
            where: { threadId, executionId: (0, typeorm_1.IsNull)(), steeringExecutionId: executionId },
            relations: { message: true },
            order: { steeringOrder: 'ASC' },
        });
    }
    async hasSteeringFor(threadId, executionId, ctx = {}) {
        return await this.managerFor(ctx).existsBy(agent_message_queue_entity_1.AgentMessageQueue, {
            threadId,
            executionId: (0, typeorm_1.IsNull)(),
            steeringExecutionId: executionId,
        });
    }
    async findSteeringExecutionIds(threadId, ctx) {
        const items = await this.managerFor(ctx).find(agent_message_queue_entity_1.AgentMessageQueue, {
            select: ['steeringExecutionId'],
            where: { threadId, steeringExecutionId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) },
        });
        return [
            ...new Set(items.flatMap((item) => (item.steeringExecutionId ? [item.steeringExecutionId] : []))),
        ];
    }
    async releaseSteering(threadId, executionId, ctx) {
        const result = await this.managerFor(ctx).update(agent_message_queue_entity_1.AgentMessageQueue, { threadId, steeringExecutionId: executionId }, { steeringExecutionId: null, steeringOrder: null });
        return (result.affected ?? 0) > 0;
    }
    async consumeSteering(threadId, executionId, ids, ctx) {
        if (ids.length === 0)
            return;
        await this.managerFor(ctx).delete(agent_message_queue_entity_1.AgentMessageQueue, {
            threadId,
            steeringExecutionId: executionId,
            executionId: (0, typeorm_1.IsNull)(),
            id: (0, typeorm_1.In)(ids),
        });
    }
    async findActive(threadId, ctx) {
        return await this.managerFor(ctx).findOneBy(agent_message_queue_entity_1.AgentMessageQueue, {
            threadId,
            executionId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
        });
    }
    async findThreadIds(ctx = {}) {
        const rows = await this.managerFor(ctx)
            .createQueryBuilder(agent_message_queue_entity_1.AgentMessageQueue, 'queue')
            .select('queue.threadId', 'threadId')
            .distinct(true)
            .getRawMany();
        return rows.map(({ threadId }) => threadId);
    }
    async linkExecution(id, previousId, executionId, ctx) {
        const result = await this.managerFor(ctx).update(agent_message_queue_entity_1.AgentMessageQueue, { id, executionId: previousId ?? (0, typeorm_1.IsNull)() }, { executionId });
        return result.affected === 1;
    }
    async removeActive(threadId, executionId, ctx) {
        const result = await this.managerFor(ctx).delete(agent_message_queue_entity_1.AgentMessageQueue, { threadId, executionId });
        return result.affected === 1;
    }
    async findDeliveryState(id) {
        return await this.findOne({ where: { id }, relations: { execution: true } });
    }
    async findPublishedConnection(agentId, projectId, source, credentialId, ctx = {}) {
        const agent = await this.managerFor(ctx).findOne(agent_entity_1.Agent, {
            select: ['integrations', 'activeVersionId'],
            where: { id: agentId, projectId },
        });
        if (!agent?.activeVersionId)
            return undefined;
        return agent.integrations?.find((connection) => connection.type === source &&
            connection.credentialId === credentialId &&
            !(0, api_types_1.isDraftIntegration)(connection));
    }
};
exports.AgentMessageQueueRepository = AgentMessageQueueRepository;
exports.AgentMessageQueueRepository = AgentMessageQueueRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentMessageQueueRepository);
//# sourceMappingURL=agent-message-queue.repository.js.map