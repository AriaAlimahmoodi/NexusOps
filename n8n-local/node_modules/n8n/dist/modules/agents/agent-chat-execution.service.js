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
var AgentChatExecutionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentChatExecutionService = exports.AgentTurnAlreadyRunningError = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const errors_1 = require("@n8n/errors");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const agent_execution_service_1 = require("./agent-execution.service");
const agent_message_steering_service_1 = require("./agent-message-steering.service");
const agent_execution_update_broadcaster_1 = require("./agent-execution-update-broadcaster");
const agent_background_job_service_1 = require("./background/agent-background-job.service");
const sub_agent_background_state_1 = require("./background/sub-agent-background-state");
const n8n_checkpoint_storage_1 = require("./integrations/n8n-checkpoint-storage");
const agent_execution_repository_1 = require("./repositories/agent-execution.repository");
const agent_memory_scope_1 = require("./utils/agent-memory-scope");
const agent_thread_access_1 = require("./utils/agent-thread-access");
const delegated_child_checkpoints_1 = require("./utils/delegated-child-checkpoints");
var agent_turn_already_running_error_1 = require("./agent-turn-already-running.error");
Object.defineProperty(exports, "AgentTurnAlreadyRunningError", { enumerable: true, get: function () { return agent_turn_already_running_error_1.AgentTurnAlreadyRunningError; } });
let AgentChatExecutionService = AgentChatExecutionService_1 = class AgentChatExecutionService {
    constructor(lockService, executionRepository, executionService, checkpointStorage, publisher, instanceSettings, executionUpdates, steering, backgroundJobService) {
        this.lockService = lockService;
        this.executionRepository = executionRepository;
        this.executionService = executionService;
        this.checkpointStorage = checkpointStorage;
        this.publisher = publisher;
        this.instanceSettings = instanceSettings;
        this.executionUpdates = executionUpdates;
        this.steering = steering;
        this.backgroundJobService = backgroundJobService;
        this.pendingCancellations = new Map();
        this.executions = new Map();
    }
    register(context, controller) {
        this.executions.set(context.executionId, { context, controller });
        const pending = this.pendingCancellations.get(context.executionId);
        if (pending) {
            clearTimeout(pending.timer);
            this.pendingCancellations.delete(context.executionId);
            this.cancelLocal(pending.context);
        }
    }
    async settle(executionId, finalize, suspendedRunId) {
        try {
            await finalize();
        }
        finally {
            await this.release(executionId, suspendedRunId);
        }
    }
    async release(executionId, suspendedRunId) {
        const execution = this.executions.get(executionId);
        try {
            if (!execution?.controller.signal.aborted || !suspendedRunId)
                return;
            const { context } = execution;
            await this.lockService.withLease(backend_common_1.LockNamespace.KNOWN_LOCKS, `agent-preview-turn:${context.threadId}`, async () => {
                const latest = await this.executionRepository.findLatestByThreadId(context.threadId);
                if (latest?.id !== executionId)
                    return;
                await this.cancelSuspended({
                    agentId: context.agentId,
                    runId: suspendedRunId,
                    resourceId: (0, agent_thread_access_1.chatSurfaceMemoryResourceId)(context.surface, context.userId),
                    cancelBackgroundJobs: execution.controller.signal.reason === sub_agent_background_state_1.PARENT_TASK_CANCELLED_REASON,
                });
            });
        }
        finally {
            this.executions.delete(executionId);
        }
    }
    async requestCancel(context) {
        return await this.lockService.withLease(backend_common_1.LockNamespace.KNOWN_LOCKS, `agent-preview-turn:${context.threadId}`, async () => {
            const execution = await this.getOwnedExecution(context);
            if (!execution)
                throw new errors_1.NotFoundError('Execution not found');
            if (execution.status !== 'running') {
                const latest = await this.executionRepository.findLatestByThreadId(context.threadId);
                if (latest?.id !== context.executionId)
                    return false;
            }
            try {
                await this.steering.close(context.threadId, context.executionId);
                if (this.cancelLocal(context))
                    return true;
                if (execution.status !== 'running')
                    return await this.cancelRecordedSuspension(context);
                this.cancelOrRemember(context);
                if (!this.instanceSettings.isMultiMain)
                    return true;
                const { surface, ...rest } = context;
                await this.publisher.publishCommand({
                    command: 'cancel-agent-chat-execution',
                    payload: { ...rest, surface, productionN8nChat: surface === 'n8n-chat' },
                });
                return true;
            }
            finally {
                await this.backgroundJobService.cancelForParent(context.agentId, context.threadId, (0, agent_thread_access_1.chatSurfaceMemoryResourceId)(context.surface, context.userId));
            }
        });
    }
    async handleCancel(payload) {
        const { productionN8nChat, surface, ...rest } = payload;
        const context = {
            ...rest,
            surface: surface ?? (productionN8nChat ? 'n8n-chat' : 'preview'),
        };
        if (await this.cancelLocalWithChildren(context))
            return;
        await this.lockService.withLease(backend_common_1.LockNamespace.KNOWN_LOCKS, `agent-preview-turn:${context.threadId}`, async () => {
            if (await this.cancelLocalWithChildren(context))
                return;
            const execution = await this.getOwnedExecution(context);
            if (!execution)
                return;
            if (execution.status === 'running')
                this.cancelOrRemember(context);
            await this.cancelRecordedSuspension(context);
        });
    }
    async cancelLocalWithChildren(context) {
        if (!this.cancelLocal(context))
            return false;
        await this.backgroundJobService.cancelForParent(context.agentId, context.threadId, (0, agent_thread_access_1.chatSurfaceMemoryResourceId)(context.surface, context.userId));
        return true;
    }
    cancelOrRemember(context) {
        if (this.cancelLocal(context) || this.pendingCancellations.has(context.executionId))
            return;
        const timer = setTimeout(() => this.pendingCancellations.delete(context.executionId), AgentChatExecutionService_1.PENDING_CANCEL_TTL_MS);
        timer.unref();
        this.pendingCancellations.set(context.executionId, { context, timer });
    }
    cancelLocal(context) {
        const execution = this.executions.get(context.executionId);
        if (!execution ||
            execution.context.projectId !== context.projectId ||
            execution.context.agentId !== context.agentId ||
            execution.context.threadId !== context.threadId ||
            execution.context.userId !== context.userId)
            return false;
        execution.controller.abort(sub_agent_background_state_1.PARENT_TASK_CANCELLED_REASON);
        return true;
    }
    async getOwnedExecution(context) {
        const { threadId, projectId, agentId, userId, executionId } = context;
        const thread = await this.executionService.findThreadById(threadId);
        if (!thread || !(0, agent_thread_access_1.threadBelongsTo)(thread, projectId, agentId, userId))
            return null;
        const execution = await this.executionRepository.findOneBy({ id: executionId, threadId });
        if (!execution || !this.canAccessExecution(context, thread, execution.source))
            return null;
        return execution;
    }
    canAccessExecution(context, thread, source) {
        switch (context.surface) {
            case 'n8n-chat':
                return (thread.accessScope === 'user' &&
                    thread.ownerId === context.userId &&
                    source === agent_thread_access_1.N8N_CHAT_PRODUCTION_SOURCE);
            case 'system':
                return (0, agent_thread_access_1.canContinueSystemThread)(thread, context.userId, source);
            case 'preview':
                return (0, agent_thread_access_1.canContinueThreadInPreview)(thread, context.userId, source);
        }
    }
    async cancelRecordedSuspension(context) {
        const latest = await this.executionRepository.findLatestByThreadId(context.threadId);
        if (latest?.id !== context.executionId || latest.hitlStatus !== 'suspended')
            return false;
        const checkpoint = await this.checkpointStorage.findSuspendedForThread(context.agentId, context.threadId);
        const pending = Object.values(checkpoint?.pendingToolCalls ?? {}).find((toolCall) => toolCall.suspended);
        if (!pending?.suspended)
            return false;
        return await this.cancelSuspended({
            agentId: context.agentId,
            runId: pending.runId,
            resourceId: (0, agent_thread_access_1.chatSurfaceMemoryResourceId)(context.surface, context.userId),
        });
    }
    async cancelSuspended(params) {
        const checkpointStatus = await this.checkpointStorage.getStatus(params.runId, params.agentId);
        if (checkpointStatus.status === 'not-found' || checkpointStatus.checkpoint === undefined)
            return false;
        const { checkpoint } = checkpointStatus;
        if (checkpoint.status !== 'suspended' ||
            checkpoint.persistence?.delegated === true ||
            checkpoint.persistence?.resourceId !== params.resourceId)
            return false;
        const thread = await this.executionService.findThreadById(checkpoint.persistence.threadId);
        const productionUserId = (0, agent_memory_scope_1.userIdFromProductionChatMemoryResourceId)(params.resourceId);
        const userId = (0, agent_memory_scope_1.userIdFromDraftChatMemoryResourceId)(params.resourceId) ??
            (0, agent_memory_scope_1.userIdFromSystemChatMemoryResourceId)(params.resourceId) ??
            productionUserId;
        if (productionUserId &&
            (!thread ||
                !(await this.executionService.canUseProductionChatThread(thread.id, thread.projectId, params.agentId, productionUserId, 'existing'))))
            return false;
        if (thread && (!userId || !(0, agent_thread_access_1.threadBelongsTo)(thread, thread.projectId, params.agentId, userId)))
            return false;
        const childCheckpoints = (0, delegated_child_checkpoints_1.getDelegatedChildCheckpoints)(checkpoint, params.agentId);
        if (checkpointStatus.status === 'active') {
            const cancelled = await this.checkpointStorage.cancelSuspended(params.runId, checkpoint, params.agentId);
            if (!cancelled)
                return false;
        }
        if (params.cancelBackgroundJobs !== false) {
            await this.backgroundJobService.cancelForParent(params.agentId, checkpoint.persistence.threadId, params.resourceId);
        }
        await Promise.all(childCheckpoints.map(async ({ runId, agentId }) => await this.checkpointStorage.delete(runId, agentId)));
        await this.checkpointStorage.delete(params.runId, params.agentId);
        const execution = thread && (await this.executionRepository.findLatestByThreadId(thread.id));
        if (thread && execution) {
            this.executionUpdates.notify({
                projectId: thread.projectId,
                agentId: params.agentId,
                threadId: thread.id,
                executionId: execution.id,
            });
        }
        return true;
    }
};
exports.AgentChatExecutionService = AgentChatExecutionService;
AgentChatExecutionService.PENDING_CANCEL_TTL_MS = 5 * 60 * 1000;
__decorate([
    (0, decorators_1.OnPubSubEvent)('cancel-agent-chat-execution', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatExecutionService.prototype, "handleCancel", null);
exports.AgentChatExecutionService = AgentChatExecutionService = AgentChatExecutionService_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.LockService, agent_execution_repository_1.AgentExecutionRepository, agent_execution_service_1.AgentExecutionService, n8n_checkpoint_storage_1.N8NCheckpointStorage, publisher_service_1.Publisher, n8n_core_1.InstanceSettings, agent_execution_update_broadcaster_1.AgentExecutionUpdateBroadcaster, agent_message_steering_service_1.AgentMessageSteeringService, agent_background_job_service_1.AgentBackgroundJobService])
], AgentChatExecutionService);
//# sourceMappingURL=agent-chat-execution.service.js.map