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
exports.AgentMessageQueueService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const agent_chat_attachment_service_1 = require("./agent-chat-attachment.service");
const agent_message_steering_service_1 = require("./agent-message-steering.service");
const agents_settings_service_1 = require("./agents-settings.service");
const agent_execution_update_broadcaster_1 = require("./agent-execution-update-broadcaster");
const agent_execution_service_1 = require("./agent-execution.service");
const execution_recorder_1 = require("./execution-recorder");
const n8n_checkpoint_storage_1 = require("./integrations/n8n-checkpoint-storage");
const agent_execution_repository_1 = require("./repositories/agent-execution.repository");
const agent_execution_thread_repository_1 = require("./repositories/agent-execution-thread.repository");
const agent_message_queue_repository_1 = require("./repositories/agent-message-queue.repository");
const agent_message_repository_1 = require("./repositories/agent-message.repository");
const agent_repository_1 = require("./repositories/agent.repository");
const agent_queued_message_1 = require("./types/agent-queued-message");
const agent_thread_access_1 = require("./utils/agent-thread-access");
const inbound_attachments_1 = require("./utils/inbound-attachments");
const queued_message_id_1 = require("./utils/queued-message-id");
let AgentMessageQueueService = class AgentMessageQueueService {
    constructor(txRunner, repository, threadRepository, executionRepository, executionService, checkpointStorage, agentRepository, attachments, updates, messages, steering, settingsService) {
        this.txRunner = txRunner;
        this.repository = repository;
        this.threadRepository = threadRepository;
        this.executionRepository = executionRepository;
        this.executionService = executionService;
        this.checkpointStorage = checkpointStorage;
        this.agentRepository = agentRepository;
        this.attachments = attachments;
        this.updates = updates;
        this.messages = messages;
        this.steering = steering;
        this.settingsService = settingsService;
    }
    async enqueue(input, onInserted) {
        await this.settingsService.assertEnabled();
        const agent = await this.agentRepository.findByIdAndProjectId(input.agentId, input.projectId);
        if (!agent)
            throw new n8n_workflow_1.UserError('Agent not found');
        const { payload } = input;
        const messageId = (0, queued_message_id_1.queuedMessageId)(input.agentId, input.threadId, payload);
        let item;
        try {
            item = await this.txRunner.run({}, async (ctx) => {
                await this.settingsService.assertEnabled(ctx);
                await this.executionService.prepareThread({
                    ...input,
                    agentName: agent.name,
                    userMessage: payload.message,
                    resourceId: payload.resourceId,
                    access: payload.kind === 'integration'
                        ? { accessScope: 'project', ownerId: null }
                        : { accessScope: 'user', ownerId: payload.userId },
                }, ctx);
                const inserted = await this.enqueueMessage(input.threadId, input.source, payload, ctx, messageId);
                onInserted?.(inserted.id);
                return inserted;
            });
        }
        catch (error) {
            if (error instanceof agent_message_repository_1.AgentMessageIdConflictError && error.messageId === messageId) {
                return { status: 'duplicate' };
            }
            throw error;
        }
        if (payload.kind !== 'integration')
            this.updates.notifyQueueUpdated(item.threadId);
        this.onAvailable?.(item.threadId);
        return { status: 'accepted', item };
    }
    async enqueueMessage(threadId, source, payload, ctx, messageId) {
        const { message, resourceId, attachments = [], ...dispatch } = payload;
        const [content] = (0, inbound_attachments_1.buildInboundUserMessage)(message, attachments);
        let queueDispatch;
        let modelContent;
        let author;
        let origin = { source };
        if (dispatch.kind === 'integration') {
            const { modelMessage, author: inputAuthor, platformThreadId, messageContext: fullContext, ...integrationDispatch } = dispatch;
            const { platform: _platform, integrationConnectionId, messageId: platformMessageId, ...messageContext } = fullContext;
            queueDispatch = { ...integrationDispatch, messageContext };
            [modelContent] = (0, inbound_attachments_1.buildInboundUserMessage)(modelMessage, attachments);
            author = inputAuthor;
            origin = {
                source,
                integrationConnectionId,
                platformMessageId,
                platformThreadId,
            };
        }
        else {
            queueDispatch = {
                kind: dispatch.kind,
                ...(dispatch.options ? { options: dispatch.options } : {}),
            };
            if (dispatch.hidden)
                origin = { source, hidden: true };
        }
        const input = await this.messages.createInput({ id: messageId, threadId, resourceId, content, modelContent, author, origin }, ctx);
        return await this.repository.enqueue(threadId, input.id, queueDispatch, ctx);
    }
    async listPending(input) {
        const { kind } = input;
        const thread = await this.threadRepository.findOneBy({ id: input.threadId });
        if (!thread)
            return { items: [], steerableExecutionId: null };
        await this.assertUserChatAccess(thread, input);
        const items = await this.repository.listPending(thread.id);
        const steerable = (0, agent_queued_message_1.acceptsSteering)(kind) ? await this.steering.findEligible(thread) : null;
        return {
            steerableExecutionId: steerable?.id ?? null,
            items: items
                .filter((item) => item.payload.kind === kind && !isHidden(item))
                .sort((a, b) => (a.steeringOrder ?? Number.MAX_SAFE_INTEGER) -
                (b.steeringOrder ?? Number.MAX_SAFE_INTEGER))
                .map((item) => ({
                id: item.id,
                ...(0, inbound_attachments_1.readInboundUserMessage)(item.message.content),
                steeringExecutionId: item.steeringExecutionId,
                createdAt: item.createdAt.toISOString(),
            })),
        };
    }
    async removePending(input) {
        const removed = await this.txRunner.run({}, async (ctx) => {
            const thread = await this.threadRepository.lockById(input.threadId, ctx);
            if (!thread)
                throw new errors_1.NotFoundError('Session not found');
            await this.assertUserChatAccess(thread, input, ctx);
            const item = await this.repository.findItem(thread.id, input.queueId, ctx);
            if (!item || item.payload.kind !== input.kind || isHidden(item))
                throw new errors_1.NotFoundError('Queued message not found');
            if (item.executionId !== null ||
                item.steeringExecutionId !== null ||
                !(await this.repository.removePending(thread.id, item.id, ctx))) {
                throw new errors_1.ConflictError('This message has already started');
            }
            const attachmentIds = (0, inbound_attachments_1.readInboundUserMessage)(item.message.content).attachments.map(({ id }) => id);
            await this.messages.clearPendingInput(item.messageId, ctx);
            return { threadId: item.threadId, attachmentIds };
        });
        this.updates.notifyQueueUpdated(removed.threadId);
        await this.attachments.deleteByIds(removed.attachmentIds);
    }
    async updatePending(input) {
        await this.txRunner.run({}, async (ctx) => {
            const thread = await this.threadRepository.lockById(input.threadId, ctx);
            if (!thread)
                throw new errors_1.NotFoundError('Session not found');
            await this.assertUserChatAccess(thread, input, ctx);
            const item = await this.repository.findItem(thread.id, input.queueId, ctx);
            if (!item || item.payload.kind !== input.kind || isHidden(item))
                throw new errors_1.NotFoundError('Queued message not found');
            if (item.executionId !== null)
                throw new errors_1.ConflictError('This message has already started');
            if (item.steeringExecutionId !== null)
                throw new errors_1.ConflictError('This message is no longer available');
            const message = input.message.trim();
            const { attachments } = (0, inbound_attachments_1.readInboundUserMessage)(item.message.content);
            if (!message && !attachments.length)
                throw new errors_1.BadRequestError('A message or attachment is required');
            const [content] = (0, inbound_attachments_1.buildInboundUserMessage)(message, attachments);
            await this.messages.updatePendingInput(item.messageId, content, ctx);
        });
        this.updates.notifyQueueUpdated(input.threadId);
    }
    async reorderPending(input) {
        await this.txRunner.run({}, async (ctx) => {
            const thread = await this.threadRepository.lockById(input.threadId, ctx);
            if (!thread)
                throw new errors_1.NotFoundError('Session not found');
            await this.assertUserChatAccess(thread, input, ctx);
            const moved = await this.repository.movePending(thread.id, input.queueId, input.targetQueueId, input.expectedQueueIds, input.kind, ctx);
            if (!moved) {
                throw new errors_1.ConflictError('The queue has changed. Refresh it and try again.');
            }
        });
        this.updates.notifyQueueUpdated(input.threadId);
    }
    async steer(input) {
        await this.txRunner.run({}, async (ctx) => {
            const thread = await this.threadRepository.lockById(input.threadId, ctx);
            if (!thread)
                throw new errors_1.NotFoundError('Session not found');
            await this.assertUserChatAccess(thread, input, ctx);
            const item = await this.repository.findItem(thread.id, input.queueId, ctx);
            if (!item || item.payload.kind !== input.kind || isHidden(item))
                throw new errors_1.ConflictError('This message is no longer available');
            const execution = await this.steering.findEligible(thread, ctx);
            if (execution?.id !== input.executionId ||
                item.executionId !== null ||
                item.steeringExecutionId !== null) {
                throw new errors_1.ConflictError('This message cannot be added to that execution');
            }
            if (!(await this.repository.reserveSteering(thread.id, item.id, execution.id, ctx))) {
                throw new errors_1.ConflictError('This message is no longer available');
            }
        });
        this.updates.notifyQueueUpdated(input.threadId);
    }
    async assertUserChatAccess(thread, input, ctx = {}) {
        const sources = await this.executionRepository.findFirstSourceByThreadIds([thread.id], ctx);
        const source = sources.get(thread.id);
        if (thread.projectId !== input.projectId ||
            thread.agentId !== input.agentId ||
            !(input.kind === 'n8n_chat'
                ? (0, agent_thread_access_1.canContinueThreadInN8nChat)(thread, input.userId, source)
                : (0, agent_thread_access_1.canContinueThreadInPreview)(thread, input.userId, source))) {
            throw new errors_1.NotFoundError('Session not found');
        }
    }
    async claimNext(threadId, canConsume) {
        let steeringChanged = false;
        const claimed = await this.txRunner.run({}, async (ctx) => {
            if (!(await this.settingsService.getEnabled(ctx)))
                return null;
            const thread = await this.threadRepository.lockById(threadId, ctx);
            if (!thread)
                return null;
            steeringChanged = await this.steering.releaseInactive(thread, ctx);
            if (await this.isBlocked(thread, ctx))
                return null;
            const active = await this.repository.findActive(threadId, ctx);
            if (active?.executionId)
                await this.repository.removeActive(threadId, active.executionId, ctx);
            const item = await this.repository.findHead(threadId, ctx);
            if (!item || item.steeringExecutionId !== null || !(await canConsume(item, thread, ctx)))
                return null;
            const payload = this.restoreInput(item);
            const recording = this.recordingFor(item, thread, payload);
            await this.threadRepository.bumpUpdatedAt(threadId, ctx);
            const reservation = await this.executionService.reserveExecution(recording, new Date(), ctx, thread);
            return { item, thread, payload, recording, reservation };
        });
        if (steeringChanged)
            this.updates.notifyQueueUpdated(threadId);
        if (!claimed)
            return null;
        this.executionService.activateExecution(claimed.reservation, claimed.recording);
        const { execution } = claimed.reservation;
        if (!execution.startedAt)
            throw new n8n_workflow_1.OperationalError('Queued execution has no start time');
        return {
            item: claimed.item,
            payload: claimed.payload,
            thread: claimed.thread,
            recording: claimed.recording,
            admission: {
                executionId: execution.id,
                startedAt: execution.startedAt,
                inputMessageIds: claimed.reservation.inputMessageIds,
            },
        };
    }
    async settle(threadId, executionId) {
        await this.txRunner.run({}, async (ctx) => {
            const thread = await this.threadRepository.lockById(threadId, ctx);
            if (!thread)
                return;
            await this.steering.release(threadId, executionId, ctx);
            const active = await this.repository.findActive(threadId, ctx);
            if (active?.executionId !== executionId || (await this.isBlocked(thread, ctx)))
                return;
            await this.repository.removeActive(threadId, executionId, ctx);
        });
        this.updates.notifyQueueUpdated(threadId);
        this.onAvailable?.(threadId);
    }
    async recordFailure(claim, error, signal) {
        const { executionId, startedAt } = claim.admission;
        const execution = await this.executionRepository.findExecution(executionId);
        if (execution?.status !== 'running')
            return;
        const recorder = new execution_recorder_1.ExecutionRecorder(undefined, undefined, undefined, startedAt);
        if (!signal?.aborted)
            recorder.record({ type: 'error', error });
        recorder.record({ type: 'finish', finishReason: 'error' });
        const record = recorder.getMessageRecord();
        if (execution.timeline)
            record.timeline = execution.timeline;
        await this.executionService.finalizeExecution(executionId, {
            ...claim.recording,
            record: signal?.aborted ? { ...record, finishReason: 'cancelled', error: null } : record,
        });
    }
    async isBlocked(thread, ctx) {
        if (await this.executionRepository.existsRunningByThread(thread.id, ctx))
            return true;
        return ((await this.checkpointStorage.findSuspendedForThread(thread.agentId, thread.id, ctx)) !== null);
    }
    recordingFor(item, thread, payload) {
        return {
            threadId: thread.id,
            agentId: thread.agentId,
            agentName: thread.agentName,
            projectId: thread.projectId,
            access: { accessScope: thread.accessScope, ownerId: thread.ownerId },
            sessionMode: 'existing',
            queueItemId: item.id,
            previewChat: item.payload.kind === 'preview',
            acceptsSteering: (0, agent_queued_message_1.acceptsSteering)(item.payload.kind),
            userMessage: payload.message,
            resourceId: payload.resourceId,
            source: item.message.origin?.source ?? undefined,
            attachments: payload.attachments,
            author: payload.kind === 'integration' ? payload.author : undefined,
        };
    }
    restoreInput(item) {
        const input = {
            ...(0, inbound_attachments_1.readInboundUserMessage)(item.message.content),
            resourceId: item.message.resourceId,
        };
        if (item.payload.kind !== 'integration')
            return { ...item.payload, ...input, ...(isHidden(item) ? { hidden: true } : {}) };
        if (!item.message.author)
            throw new n8n_workflow_1.UnexpectedError('Queued integration input has no author');
        const { origin } = item.message;
        if (!origin?.source || !origin.integrationConnectionId || !origin.platformThreadId)
            throw new n8n_workflow_1.UnexpectedError('Queued integration input has incomplete origin');
        return {
            ...item.payload,
            ...input,
            platformThreadId: origin.platformThreadId,
            messageContext: {
                ...item.payload.messageContext,
                platform: origin.source,
                integrationConnectionId: origin.integrationConnectionId,
                ...(origin.platformMessageId !== undefined ? { messageId: origin.platformMessageId } : {}),
            },
            author: item.message.author,
            modelMessage: (0, inbound_attachments_1.readInboundUserMessage)(item.message.modelContent ?? item.message.content)
                .message,
        };
    }
};
exports.AgentMessageQueueService = AgentMessageQueueService;
exports.AgentMessageQueueService = AgentMessageQueueService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.TransactionRunner, agent_message_queue_repository_1.AgentMessageQueueRepository, agent_execution_thread_repository_1.AgentExecutionThreadRepository, agent_execution_repository_1.AgentExecutionRepository, agent_execution_service_1.AgentExecutionService, n8n_checkpoint_storage_1.N8NCheckpointStorage, agent_repository_1.AgentRepository, agent_chat_attachment_service_1.AgentChatAttachmentService, agent_execution_update_broadcaster_1.AgentExecutionUpdateBroadcaster, agent_message_repository_1.AgentMessageRepository, agent_message_steering_service_1.AgentMessageSteeringService, agents_settings_service_1.AgentsSettingsService])
], AgentMessageQueueService);
function isHidden(item) {
    return item.message.origin?.hidden === true;
}
//# sourceMappingURL=agent-message-queue.service.js.map