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
exports.AgentMessageSteeringService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const agent_execution_service_1 = require("./agent-execution.service");
const agent_execution_update_broadcaster_1 = require("./agent-execution-update-broadcaster");
const agent_message_mapper_1 = require("./agent-message-mapper");
const n8n_checkpoint_storage_1 = require("./integrations/n8n-checkpoint-storage");
const agent_execution_repository_1 = require("./repositories/agent-execution.repository");
const agent_execution_thread_repository_1 = require("./repositories/agent-execution-thread.repository");
const agent_message_queue_repository_1 = require("./repositories/agent-message-queue.repository");
const agent_message_repository_1 = require("./repositories/agent-message.repository");
const agent_queued_message_1 = require("./types/agent-queued-message");
let AgentMessageSteeringService = class AgentMessageSteeringService {
    constructor(txRunner, queue, threads, executions, messages, checkpoints, executionService, updates) {
        this.txRunner = txRunner;
        this.queue = queue;
        this.threads = threads;
        this.executions = executions;
        this.messages = messages;
        this.checkpoints = checkpoints;
        this.executionService = executionService;
        this.updates = updates;
    }
    async findEligible(thread, ctx = {}) {
        const execution = await this.executions.findSteerable(thread.id, ctx);
        if (!execution)
            return null;
        if (await this.checkpoints.findSuspendedForThread(thread.agentId, thread.id, ctx))
            return null;
        return execution;
    }
    async close(threadId, executionId) {
        await this.txRunner.run({}, async (ctx) => {
            if (!(await this.threads.lockById(threadId, ctx)))
                return;
            await this.release(threadId, executionId, ctx);
        });
        this.updates.notifyQueueUpdated(threadId);
    }
    async release(threadId, executionId, ctx) {
        await this.executions.closeSteering(threadId, executionId, ctx);
        return await this.queue.releaseSteering(threadId, executionId, ctx);
    }
    async releaseInactive(thread, ctx) {
        const ids = await this.queue.findSteeringExecutionIds(thread.id, ctx);
        if (ids.length === 0)
            return false;
        const checkpoint = await this.checkpoints.findSuspendedForThread(thread.agentId, thread.id, ctx);
        const suspendedExecutionId = checkpoint && (0, agent_queued_message_1.checkpointExecutionId)(checkpoint);
        let changed = false;
        for (const id of ids) {
            const execution = await this.executions.findExecution(id, ctx);
            if (execution?.status === 'running' &&
                execution.acceptsSteering &&
                id !== suspendedExecutionId)
                continue;
            changed = (await this.release(thread.id, id, ctx)) || changed;
        }
        return changed;
    }
    async consume(context, boundary, recorder, signal) {
        signal.throwIfAborted();
        if (boundary.canContinue && !boundary.completing && (await this.isIdleSteerableRun(context))) {
            return { messages: [], events: [], stopped: false };
        }
        const result = await this.executionService.withTimelineWritesPaused(context.executionId, async () => {
            try {
                const consumed = await this.txRunner.run({}, async (ctx) => await this.consumeLocked(context, boundary, recorder, signal, ctx));
                recorder.recordInputs(inputMarkers(consumed));
                return consumed;
            }
            catch (error) {
                await this.restoreCommittedInputs(context.executionId, recorder);
                throw error;
            }
        });
        if (result.events.length || boundary.completing || !boundary.canContinue || result.stopped) {
            this.updates.notifyQueueUpdated(context.threadId);
            this.updates.notify(context);
        }
        return result;
    }
    async isIdleSteerableRun({ threadId, executionId }) {
        const execution = await this.executions.findExecution(executionId);
        return (execution?.threadId === threadId &&
            execution.status === 'running' &&
            execution.acceptsSteering &&
            !(await this.queue.hasSteeringFor(threadId, executionId)));
    }
    async consumeLocked(context, boundary, recorder, signal, ctx) {
        const { threadId, executionId, resourceId } = context;
        const thread = await this.threads.lockById(threadId, ctx);
        const execution = await this.executions.findExecution(executionId, ctx);
        signal.throwIfAborted();
        if (!thread || execution?.threadId !== threadId || execution.status !== 'running') {
            throw new n8n_workflow_1.OperationalError('Agent execution ownership was lost');
        }
        if (!execution.acceptsSteering)
            return { messages: [], events: [], stopped: true };
        if (!boundary.canContinue) {
            await this.release(threadId, executionId, ctx);
            return { messages: [], events: [], stopped: false };
        }
        const items = (await this.queue.findSteering(threadId, executionId, ctx)).filter((item) => item.message.resourceId === resourceId);
        if (items.length === 0) {
            if (boundary.completing)
                await this.executions.closeSteering(threadId, executionId, ctx);
            return { messages: [], events: [], stopped: false };
        }
        const consumed = this.prepareInput(items, executionId, boundary.lastCreatedAt);
        for (const { messageId } of items) {
            await this.messages.linkExecutionInput(executionId, messageId, { threadId, resourceId }, ctx);
        }
        await this.messages.saveRuntimeMessages({ threadId, resourceId, executionId, messages: [...boundary.messages, ...consumed.messages] }, ctx);
        signal.throwIfAborted();
        const timeline = structuredClone(recorder.getMessageRecord().timeline);
        if (!(await this.executions.updateTimelineIfRunning(executionId, [...timeline, ...inputMarkers(consumed)], ctx))) {
            throw new n8n_workflow_1.OperationalError('Agent execution ownership was lost');
        }
        await this.queue.consumeSteering(threadId, executionId, items.map(({ id }) => id), ctx);
        return consumed;
    }
    prepareInput(items, executionId, lastCreatedAt) {
        let timestamp = Math.max(Date.now(), lastCreatedAt + 1);
        const messages = [];
        const events = [];
        for (const item of items) {
            if (!(0, agent_queued_message_1.acceptsSteering)(item.payload.kind))
                throw new n8n_workflow_1.UnexpectedError('Only chat input can be steered');
            const message = {
                ...(item.message.modelContent ?? item.message.content),
                id: item.messageId,
                createdAt: new Date(timestamp++),
            };
            const dto = (0, agent_message_mapper_1.messageToDto)({
                ...item.message.content,
                id: item.messageId,
                createdAt: item.message.createdAt,
            });
            if (dto?.role !== 'user')
                throw new n8n_workflow_1.UnexpectedError('Steering input must be a user message');
            messages.push(message);
            events.push({
                type: 'message-steered',
                queueId: item.id,
                executionId,
                message: {
                    ...dto,
                    executionId,
                    ...(item.message.author ? { author: item.message.author } : {}),
                },
            });
        }
        return { messages, events, stopped: false };
    }
    async restoreCommittedInputs(executionId, recorder) {
        try {
            const execution = await this.executions.findExecution(executionId);
            recorder.recordInputs((execution?.timeline ?? []).filter((event) => event.type === 'input'));
        }
        catch {
        }
    }
};
exports.AgentMessageSteeringService = AgentMessageSteeringService;
exports.AgentMessageSteeringService = AgentMessageSteeringService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.TransactionRunner, agent_message_queue_repository_1.AgentMessageQueueRepository, agent_execution_thread_repository_1.AgentExecutionThreadRepository, agent_execution_repository_1.AgentExecutionRepository, agent_message_repository_1.AgentMessageRepository, n8n_checkpoint_storage_1.N8NCheckpointStorage, agent_execution_service_1.AgentExecutionService, agent_execution_update_broadcaster_1.AgentExecutionUpdateBroadcaster])
], AgentMessageSteeringService);
function inputMarkers(consumed) {
    return consumed.messages.map((message) => ({
        type: 'input',
        messageId: message.id,
        timestamp: message.createdAt.getTime(),
    }));
}
//# sourceMappingURL=agent-message-steering.service.js.map