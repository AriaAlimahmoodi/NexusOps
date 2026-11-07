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
exports.AgentMessageRepository = exports.AgentMessageIdConflictError = void 0;
const agents_1 = require("@n8n/agents");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const node_util_1 = require("node:util");
const agent_execution_message_link_entity_1 = require("../entities/agent-execution-message-link.entity");
const agent_execution_entity_1 = require("../entities/agent-execution.entity");
const agent_message_entity_1 = require("../entities/agent-message.entity");
const agent_resource_entity_1 = require("../entities/agent-resource.entity");
const agent_thread_entity_1 = require("../entities/agent-thread.entity");
class AgentMessageIdConflictError extends n8n_workflow_1.UserError {
    constructor(messageId) {
        super('A message with this ID already exists');
        this.messageId = messageId;
    }
}
exports.AgentMessageIdConflictError = AgentMessageIdConflictError;
let AgentMessageRepository = class AgentMessageRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_message_entity_1.AgentMessageEntity, dataSource.manager, transactionRunner);
    }
    async createInput(params, ctx) {
        const manager = this.managerFor(ctx);
        await manager
            .createQueryBuilder()
            .insert()
            .into(agent_resource_entity_1.AgentResourceEntity)
            .values({ id: params.resourceId, metadata: null })
            .orIgnore()
            .execute();
        await manager
            .createQueryBuilder()
            .insert()
            .into(agent_thread_entity_1.AgentThreadEntity)
            .values({ id: params.threadId, resourceId: params.resourceId, title: null, metadata: null })
            .orIgnore()
            .execute();
        const message = manager.create(agent_message_entity_1.AgentMessageEntity, {
            id: params.id ?? (0, node_crypto_1.randomUUID)(),
            threadId: params.threadId,
            resourceId: params.resourceId,
            role: 'user',
            type: null,
            content: params.content,
            author: params.author ?? null,
            origin: params.origin,
            modelContent: params.modelContent && !(0, node_util_1.isDeepStrictEqual)(params.content, params.modelContent)
                ? params.modelContent
                : null,
            modelContextAt: null,
        });
        try {
            await manager.insert(agent_message_entity_1.AgentMessageEntity, message);
        }
        catch (error) {
            if ((0, db_1.isUniqueConstraintError)(error))
                throw new AgentMessageIdConflictError(message.id);
            throw error;
        }
        return await manager.findOneByOrFail(agent_message_entity_1.AgentMessageEntity, { id: message.id });
    }
    async linkExecutionInput(executionId, messageId, scope, ctx) {
        const manager = this.managerFor(ctx);
        if (!(await manager.existsBy(agent_message_entity_1.AgentMessageEntity, {
            id: messageId,
            threadId: scope.threadId,
            resourceId: scope.resourceId,
        }))) {
            throw new n8n_workflow_1.UnexpectedError('The input message does not belong to this session and resource');
        }
        const inputs = await manager.find(agent_execution_message_link_entity_1.AgentExecutionMessageLink, {
            select: ['messageId', 'position'],
            where: { executionId, direction: 'input' },
            order: { position: 'DESC' },
        });
        if (inputs.some((input) => input.messageId === messageId))
            return;
        await manager.insert(agent_execution_message_link_entity_1.AgentExecutionMessageLink, {
            executionId,
            messageId,
            direction: 'input',
            position: (inputs[0]?.position ?? -1) + 1,
        });
    }
    async updatePendingInput(id, content, ctx) {
        await this.managerFor(ctx).save(this.create({ id, content, modelContent: null }));
    }
    async clearPendingInput(id, ctx) {
        await this.managerFor(ctx).update(agent_message_entity_1.AgentMessageEntity, id, {
            content: { role: 'user', content: [] },
            author: null,
            modelContent: null,
            modelContextAt: null,
        });
    }
    async copyExecutionInputs(executionId, predecessorId, threadId, ctx) {
        const manager = this.managerFor(ctx);
        const inputs = await manager.find(agent_execution_message_link_entity_1.AgentExecutionMessageLink, {
            where: { executionId: predecessorId, direction: 'input' },
            order: { position: 'ASC' },
        });
        if (inputs.length === 0)
            return [];
        if (!(await manager.existsBy(agent_execution_entity_1.AgentExecution, { id: predecessorId, threadId }))) {
            throw new n8n_workflow_1.UnexpectedError('The preceding execution does not belong to this session');
        }
        await manager.insert(agent_execution_message_link_entity_1.AgentExecutionMessageLink, inputs.map(({ messageId, position }) => ({
            executionId,
            messageId,
            position,
            direction: 'input',
        })));
        return inputs.map(({ messageId }) => messageId);
    }
    async findExecutionInputs(executionIds) {
        const inputs = new Map();
        for (const ids of (0, db_1.chunkIds)(executionIds)) {
            const links = await this.manager.find(agent_execution_message_link_entity_1.AgentExecutionMessageLink, {
                where: { executionId: (0, typeorm_1.In)(ids), direction: 'input' },
                relations: { message: true },
                order: { position: 'ASC' },
            });
            for (const link of links) {
                const messages = inputs.get(link.executionId) ?? [];
                messages.push(link.message);
                inputs.set(link.executionId, messages);
            }
        }
        return inputs;
    }
    async saveRuntimeMessages(params, ctx = {}) {
        if (params.messages.length === 0)
            return;
        await this.runInTransaction(ctx, async (manager) => {
            const now = new Date();
            if (params.executionId) {
                const ownership = await manager.update(agent_execution_entity_1.AgentExecution, { id: params.executionId, threadId: params.threadId, status: 'running' }, { updatedAt: now });
                if (ownership.affected !== 1)
                    throw new n8n_workflow_1.OperationalError('Execution no longer owns message persistence');
            }
            const ids = params.messages.map(({ id }) => id);
            const existing = new Map((await manager.findBy(agent_message_entity_1.AgentMessageEntity, { id: (0, typeorm_1.In)(ids) })).map((message) => [
                message.id,
                message,
            ]));
            const inputLinks = await manager.findBy(agent_execution_message_link_entity_1.AgentExecutionMessageLink, {
                messageId: (0, typeorm_1.In)(ids),
                direction: 'input',
            });
            const inputIds = new Set(inputLinks.map(({ messageId }) => messageId));
            const messages = params.messages.map((message) => this.runtimeMessageEntity(message, existing.get(message.id), inputIds.has(message.id), params, now));
            await manager.upsert(agent_message_entity_1.AgentMessageEntity, messages, ['id']);
            if (!params.executionId)
                return;
            const executionLinks = await manager.find(agent_execution_message_link_entity_1.AgentExecutionMessageLink, {
                where: { executionId: params.executionId },
                order: { position: 'ASC' },
            });
            if (!executionLinks.some(({ direction }) => direction === 'input'))
                return;
            const outputs = executionLinks.filter(({ direction }) => direction === 'output');
            const outputIds = new Set(outputs.map(({ messageId }) => messageId));
            let position = (outputs.at(-1)?.position ?? -1) + 1;
            const links = [];
            for (const id of ids) {
                if (inputIds.has(id) || outputIds.has(id))
                    continue;
                links.push({
                    executionId: params.executionId,
                    messageId: id,
                    direction: 'output',
                    position: position++,
                });
                outputIds.add(id);
            }
            if (links.length > 0)
                await manager.insert(agent_execution_message_link_entity_1.AgentExecutionMessageLink, links);
        });
    }
    runtimeMessageEntity(message, existing, isInput, scope, now) {
        if (existing && existing.threadId !== scope.threadId) {
            throw new n8n_workflow_1.UnexpectedError('The message does not belong to this session');
        }
        const { id, createdAt, ...content } = (0, agents_1.stripHydratedFileData)(message);
        if (existing && isInput) {
            existing.modelContent = (0, node_util_1.isDeepStrictEqual)(existing.content, content) ? null : content;
            existing.modelContextAt = existing.modelContextAt ?? createdAt;
            existing.updatedAt = now;
            return existing;
        }
        return this.create({
            id,
            threadId: scope.threadId,
            resourceId: scope.resourceId,
            role: 'role' in content ? content.role : 'custom',
            type: content.type ?? null,
            content,
            createdAt: existing?.createdAt ?? createdAt,
            updatedAt: now,
            modelContextAt: existing?.modelContextAt ?? createdAt,
            modelContent: null,
            author: existing?.author ?? null,
            origin: existing?.origin ?? null,
        });
    }
    async discardRuntimeInput(ids) {
        if (ids.length === 0)
            return;
        await this.runInTransaction({}, async (manager) => {
            const inputs = await manager.findBy(agent_execution_message_link_entity_1.AgentExecutionMessageLink, {
                messageId: (0, typeorm_1.In)(ids),
                direction: 'input',
            });
            const retainedIds = new Set(inputs.map(({ messageId }) => messageId));
            if (retainedIds.size > 0) {
                await manager.update(agent_message_entity_1.AgentMessageEntity, { id: (0, typeorm_1.In)([...retainedIds]) }, { modelContextAt: null, modelContent: null });
            }
            const deletedIds = ids.filter((id) => !retainedIds.has(id));
            if (deletedIds.length > 0)
                await manager.delete(agent_message_entity_1.AgentMessageEntity, deletedIds);
        });
    }
    async findRuntimeMessages(scope, opts) {
        const query = this.createQueryBuilder('message').where('message.threadId = :threadId', scope);
        query.andWhere('(message.modelContextAt IS NOT NULL OR message.origin IS NULL)');
        const timestamp = 'COALESCE(message.modelContextAt, message.createdAt)';
        if (scope.resourceId !== undefined)
            query.andWhere('message.resourceId = :resourceId', scope);
        if (opts?.before)
            query.andWhere(`${timestamp} < :before`, { before: opts.before });
        if (opts?.since) {
            query.andWhere(`(${timestamp} > :sinceCreatedAt OR (${timestamp} = :sinceCreatedAt AND message.id > :sinceMessageId))`, opts.since);
        }
        const direction = opts?.limit !== undefined ? 'DESC' : 'ASC';
        query.orderBy(timestamp, direction).addOrderBy('message.id', direction);
        if (opts?.limit !== undefined)
            query.take(opts.limit);
        const messages = await query.getMany();
        return opts?.limit !== undefined ? messages.reverse() : messages;
    }
    async findRecentThreadIdsByResourceId(agentId, resourceId, limit) {
        const rows = await this.createQueryBuilder('message')
            .select('message.threadId', 'threadId')
            .where('message.resourceId = :resourceId', { resourceId })
            .andWhere('message.threadId LIKE :threadPrefix', { threadPrefix: `${agentId}:%` })
            .groupBy('message.threadId')
            .orderBy('MAX(message.createdAt)', 'DESC')
            .limit(limit)
            .getRawMany();
        return rows.map(({ threadId }) => threadId);
    }
};
exports.AgentMessageRepository = AgentMessageRepository;
exports.AgentMessageRepository = AgentMessageRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentMessageRepository);
//# sourceMappingURL=agent-message.repository.js.map