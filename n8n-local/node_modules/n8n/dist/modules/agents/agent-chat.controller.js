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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentChatController = void 0;
const api_types_1 = require("@n8n/api-types");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const scrub_secrets_1 = require("@n8n/utils/scrub-secrets");
const redact_text_1 = require("@n8n/utils/redaction/redact-text");
const node_crypto_1 = require("node:crypto");
const credentials_service_1 = require("../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const agents_credential_provider_1 = require("./adapters/agents-credential-provider");
const agent_chat_attachment_service_1 = require("./agent-chat-attachment.service");
const agent_n8n_chat_unavailable_error_1 = require("./agent-n8n-chat-unavailable.error");
const agent_chat_relay_service_1 = require("./agent-chat-relay.service");
const agent_execution_orchestrator_service_1 = require("./agent-execution-orchestrator.service");
const agent_message_queue_service_1 = require("./agent-message-queue.service");
const agent_chat_execution_service_1 = require("./agent-chat-execution.service");
const agent_execution_service_1 = require("./agent-execution.service");
const agent_thread_access_1 = require("./utils/agent-thread-access");
const agent_message_mapper_1 = require("./agent-message-mapper");
const agent_sse_stream_1 = require("./agent-sse-stream");
const agent_test_chat_service_1 = require("./agent-test-chat.service");
const agent_test_run_service_1 = require("./agent-test-run.service");
const agents_service_1 = require("./agents.service");
const agent_background_job_service_1 = require("./background/agent-background-job.service");
const n8n_checkpoint_storage_1 = require("./integrations/n8n-checkpoint-storage");
const agent_memory_scope_1 = require("./utils/agent-memory-scope");
const messages_envelope_1 = require("./utils/messages-envelope");
let AgentChatController = class AgentChatController {
    constructor(agentExecutionOrchestratorService, agentTestRunService, agentTestChatService, checkpointStorage, credentialsService, agentsService, agentChatAttachmentService, agentExecutionService, backgroundJobService, chatExecutionService, messageQueue, agentsConfig, chatRelay) {
        this.agentExecutionOrchestratorService = agentExecutionOrchestratorService;
        this.agentTestRunService = agentTestRunService;
        this.agentTestChatService = agentTestChatService;
        this.checkpointStorage = checkpointStorage;
        this.credentialsService = credentialsService;
        this.agentsService = agentsService;
        this.agentChatAttachmentService = agentChatAttachmentService;
        this.agentExecutionService = agentExecutionService;
        this.backgroundJobService = backgroundJobService;
        this.chatExecutionService = chatExecutionService;
        this.messageQueue = messageQueue;
        this.agentsConfig = agentsConfig;
        this.chatRelay = chatRelay;
    }
    async requireProductionChat(agentId, projectId) {
        if (!(await this.agentsService.isN8nChatPublished(agentId, projectId))) {
            throw new errors_1.NotFoundError('Agent is not available in n8n Chat');
        }
    }
    async requireProductionThread(threadId, projectId, agentId, userId, sessionMode = 'existing') {
        if (!(await this.agentExecutionService.canUseProductionChatThread(threadId, projectId, agentId, userId, sessionMode)))
            throw new errors_1.NotFoundError('Session not found');
    }
    async requirePreviewThread(threadId, projectId, agentId, userId) {
        if (!(await this.agentExecutionService.canUseDraftThread(threadId, projectId, agentId, userId, {
            previewChat: true,
            sessionMode: 'existing',
        })))
            throw new errors_1.NotFoundError(`Thread "${threadId}" not found`);
    }
    assertQueueId(queueId) {
        if (!/^[1-9]\d*$/.test(queueId))
            throw new errors_1.BadRequestError('Invalid queue ID');
    }
    async productionChat(req, res, agentId, payload) {
        const { projectId } = req.params;
        const resourceId = (0, agent_memory_scope_1.productionChatMemoryResourceId)(req.user.id);
        await this.chatRelay.relayQueuedMessage(res, async () => {
            if (!(await this.agentsService.isN8nChatPublished(agentId, projectId))) {
                throw new agent_n8n_chat_unavailable_error_1.AgentN8nChatUnavailableError();
            }
            const sessionMode = payload.sessionId && !payload.newSession ? 'existing' : 'new';
            const threadId = payload.sessionId ?? (0, node_crypto_1.randomUUID)();
            await this.requireProductionThread(threadId, projectId, agentId, req.user.id, sessionMode);
            const attachments = await this.chatRelay.storeChatAttachments({
                attachments: payload.attachments,
                agentId,
                projectId,
                threadId,
                resourceId,
                source: agent_thread_access_1.N8N_CHAT_PRODUCTION_SOURCE,
            });
            return {
                agentId,
                projectId,
                threadId,
                sessionMode,
                source: agent_thread_access_1.N8N_CHAT_PRODUCTION_SOURCE,
                payload: {
                    kind: 'n8n_chat',
                    message: payload.message,
                    messageId: payload.messageId,
                    attachments,
                    userId: req.user.id,
                    resourceId,
                },
            };
        });
    }
    async productionChatResume(req, res, agentId, payload) {
        const execution = this.chatRelay.createChatExecution(res);
        const { send, onChunk, abortSignal, onExecutionStarted } = execution;
        let executionId;
        try {
            abortSignal.throwIfAborted();
            const stream = this.agentExecutionOrchestratorService.resumeForChat({
                agentId,
                projectId: req.params.projectId,
                runId: payload.runId,
                toolCallId: payload.toolCallId,
                resumeData: payload.resumeData,
                user: req.user,
                usePublishedVersion: true,
                integrationType: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
                chatSurface: 'n8n-chat',
                expectedMemory: { resourceId: (0, agent_memory_scope_1.productionChatMemoryResourceId)(req.user.id) },
                onExecutionStarted,
                onExecutionRecorded: (id) => {
                    executionId = id;
                },
                abortSignal,
            });
            let suspended = false;
            let failed = false;
            for await (const chunk of stream) {
                onChunk(chunk);
                if (chunk.type === 'tool-call-suspended')
                    suspended = true;
                if (chunk.type === 'error')
                    failed = true;
            }
            if (!suspended && !failed) {
                send({ type: 'done', ...(executionId ? { executionId } : {}) });
            }
        }
        catch (error) {
            send((0, agent_sse_stream_1.toChatErrorEvent)(error, 'Resume failed'));
        }
        finally {
            execution.close();
        }
    }
    async chat(req, res, agentId, payload) {
        const { projectId } = req.params;
        const { message, sessionId, messageId, newSession, attachments } = payload;
        const credentialProvider = new agents_credential_provider_1.AgentsCredentialProvider(this.credentialsService, projectId, req.user, agentId);
        await this.chatRelay.relayQueuedMessage(res, async (send, abortSignal) => {
            const prepared = await this.agentTestRunService.prepareDraftRun({
                agentId,
                projectId,
                user: req.user,
                sessionId,
                previewChat: true,
                newSession,
                credentialProvider,
            });
            if (abortSignal.aborted)
                return undefined;
            if (prepared.status === 'session_not_found') {
                send({ type: 'error', message: 'Session not found' });
                return undefined;
            }
            if (prepared.status === 'agent_misconfigured') {
                send({
                    type: 'error',
                    message: 'This agent is not ready to run yet.',
                    errorCode: 'agent_misconfigured',
                    missing: prepared.missing,
                });
                return undefined;
            }
            const threadId = prepared.sessionId;
            const resourceId = (0, agent_memory_scope_1.draftChatMemoryResourceId)(req.user.id);
            return {
                agentId,
                projectId,
                threadId,
                sessionMode: prepared.sessionMode,
                source: 'chat',
                payload: {
                    kind: 'preview',
                    message,
                    messageId,
                    attachments: await this.chatRelay.storeChatAttachments({
                        attachments,
                        agentId,
                        projectId,
                        threadId,
                        resourceId,
                    }),
                    userId: req.user.id,
                    resourceId,
                },
            };
        });
    }
    async chatResume(req, res, agentId, payload) {
        const { projectId } = req.params;
        const { runId, toolCallId, resumeData } = payload;
        const execution = this.chatRelay.createChatExecution(res);
        const { send, onChunk, abortSignal, onExecutionStarted } = execution;
        try {
            abortSignal.throwIfAborted();
            const result = await this.agentTestRunService.resumePreparedDraftRun({
                agentId,
                projectId,
                runId,
                toolCallId,
                resumeData,
                user: req.user,
                chatSurface: 'preview',
                errorMode: 'forward',
                onChunk,
                onBudgetNotice: (notice) => send({ type: 'budget-notice', ...notice }),
                onExecutionStarted,
                abortSignal,
            });
            if (result.status === 'completed') {
                send({
                    type: 'done',
                    ...(result.executionId ? { executionId: result.executionId } : {}),
                });
            }
        }
        catch (error) {
            send((0, agent_sse_stream_1.toChatErrorEvent)(error, 'Resume failed'));
        }
        finally {
            execution.close();
        }
    }
    async cancelChatExecution(req, _res, agentId, threadId, executionId) {
        const cancelRequested = await this.chatExecutionService.requestCancel({
            projectId: req.params.projectId,
            agentId,
            threadId,
            executionId,
            userId: req.user.id,
            surface: 'preview',
        });
        return { cancelRequested };
    }
    async cancelChatRun(req, _res, agentId, runId) {
        const { projectId } = req.params;
        const agent = await this.agentsService.findById(agentId, projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        const cancelled = await this.agentExecutionOrchestratorService.cancelChatRun({
            agentId,
            runId,
            resourceId: (0, agent_memory_scope_1.draftChatMemoryResourceId)(req.user.id),
        });
        return { cancelled };
    }
    async cancelProductionChatExecution(req, _res, agentId, threadId, executionId) {
        await this.requireProductionChat(agentId, req.params.projectId);
        await this.requireProductionThread(threadId, req.params.projectId, agentId, req.user.id);
        return {
            cancelRequested: await this.chatExecutionService.requestCancel({
                projectId: req.params.projectId,
                agentId,
                threadId,
                executionId,
                userId: req.user.id,
                surface: 'n8n-chat',
            }),
        };
    }
    async cancelProductionChatRun(req, _res, agentId, runId) {
        await this.requireProductionChat(agentId, req.params.projectId);
        return {
            cancelled: await this.agentExecutionOrchestratorService.cancelChatRun({
                agentId,
                runId,
                resourceId: (0, agent_memory_scope_1.productionChatMemoryResourceId)(req.user.id),
            }),
        };
    }
    async getProductionChatMessages(req) {
        const { projectId, agentId, threadId } = req.params;
        await this.requireProductionChat(agentId, projectId);
        await this.requireProductionThread(threadId, projectId, agentId, req.user.id);
        const history = await this.agentExecutionOrchestratorService.getConversationHistory({
            threadId,
            projectId,
            agentId,
            userId: req.user.id,
        });
        if (!history)
            throw new errors_1.NotFoundError('Session not found');
        const checkpoint = await this.checkpointStorage.findSuspendedForThread(agentId, threadId);
        return {
            ...(0, messages_envelope_1.withOpenSuspensions)(history.messages, checkpoint?.persistence?.resourceId === (0, agent_memory_scope_1.productionChatMemoryResourceId)(req.user.id)
                ? checkpoint
                : null, { appendInactiveCheckpointMessages: false }),
            activeExecutionId: history.activeExecutionId,
        };
    }
    async getProductionChatAttachment(req, res) {
        const { projectId, agentId, attachmentId } = req.params;
        await this.requireProductionChat(agentId, projectId);
        const attachment = await this.agentChatAttachmentService.getForAgent(attachmentId, {
            agentId,
            projectId,
            userId: req.user.id,
        });
        if (!attachment ||
            attachment.source !== agent_thread_access_1.N8N_CHAT_PRODUCTION_SOURCE ||
            attachment.resourceId !== (0, agent_memory_scope_1.productionChatMemoryResourceId)(req.user.id)) {
            throw new errors_1.NotFoundError(`Attachment "${attachmentId}" not found`);
        }
        await this.requireProductionThread(attachment.threadId, projectId, agentId, req.user.id);
        await this.chatRelay.streamAttachment(attachment, res);
    }
    async getProductionQueuedMessages(req) {
        await this.requireProductionChat(req.params.agentId, req.params.projectId);
        return await this.messageQueue.listPending({
            ...req.params,
            userId: req.user.id,
            kind: 'n8n_chat',
        });
    }
    async updateProductionQueuedMessage(req, _res, payload) {
        this.assertQueueId(req.params.queueId);
        await this.requireProductionChat(req.params.agentId, req.params.projectId);
        await this.messageQueue.updatePending({
            ...req.params,
            userId: req.user.id,
            message: payload.message,
            kind: 'n8n_chat',
        });
    }
    async reorderProductionQueuedMessage(req, _res, payload) {
        this.assertQueueId(req.params.queueId);
        await this.requireProductionChat(req.params.agentId, req.params.projectId);
        await this.messageQueue.reorderPending({
            ...req.params,
            userId: req.user.id,
            targetQueueId: payload.targetQueueId,
            expectedQueueIds: payload.expectedQueueIds,
            kind: 'n8n_chat',
        });
    }
    async steerProductionQueuedMessage(req, _res, payload) {
        this.assertQueueId(req.params.queueId);
        await this.requireProductionChat(req.params.agentId, req.params.projectId);
        await this.messageQueue.steer({
            ...req.params,
            userId: req.user.id,
            executionId: payload.executionId,
            kind: 'n8n_chat',
        });
    }
    async removeProductionQueuedMessage(req) {
        this.assertQueueId(req.params.queueId);
        await this.requireProductionChat(req.params.agentId, req.params.projectId);
        await this.messageQueue.removePending({ ...req.params, userId: req.user.id, kind: 'n8n_chat' });
        return { removed: true };
    }
    async getProductionBackgroundJobs(req) {
        const { projectId, agentId, threadId } = req.params;
        await this.requireProductionChat(agentId, projectId);
        const thread = await this.agentExecutionService.findThreadById(threadId);
        if (!thread)
            return { tasks: [] };
        await this.requireProductionThread(threadId, projectId, agentId, req.user.id);
        const jobs = await this.backgroundJobService.listCurrentGroupForThread(agentId, threadId);
        return this.mapBackgroundJobsToDto(jobs);
    }
    async stopProductionBackgroundJobs(req) {
        const { projectId, agentId, threadId } = req.params;
        if (!this.agentsConfig.backgroundTasksEnabled)
            throw new errors_1.BadRequestError('Background tasks are not enabled');
        await this.requireProductionChat(agentId, projectId);
        await this.requireProductionThread(threadId, projectId, agentId, req.user.id);
        await this.backgroundJobService.requestPause(agentId, threadId, (0, agent_memory_scope_1.productionChatMemoryResourceId)(req.user.id));
        const jobs = await this.backgroundJobService.listCurrentGroupForThread(agentId, threadId);
        return this.mapBackgroundJobsToDto(jobs);
    }
    async resumeProductionBackgroundJob(req, _res, payload) {
        const { projectId, agentId, threadId } = req.params;
        await this.requireProductionChat(agentId, projectId);
        const resumed = await this.agentExecutionOrchestratorService.resumeBackgroundForChat({
            ...payload,
            resumeData: payload.resumeData,
            projectId,
            agentId,
            user: req.user,
            usePublishedVersion: true,
            chatSurface: 'n8n-chat',
            integrationType: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
            expectedMemory: { threadId, resourceId: (0, agent_memory_scope_1.productionChatMemoryResourceId)(req.user.id) },
        });
        if (!resumed)
            throw new errors_1.BadRequestError('This background approval is no longer available');
        return { resumed };
    }
    async deleteProductionChatThread(req, _res, agentId, threadId) {
        const { projectId } = req.params;
        await this.requireProductionChat(agentId, projectId);
        await this.requireProductionThread(threadId, projectId, agentId, req.user.id);
        const deleted = await this.agentExecutionService.deleteThread(projectId, agentId, threadId, req.user.id);
        if (!deleted)
            throw new errors_1.NotFoundError(`Thread "${threadId}" not found`);
        return { success: true };
    }
    async getQueuedMessages(req) {
        const agent = await this.agentsService.findById(req.params.agentId, req.params.projectId);
        if (!agent)
            throw new errors_1.NotFoundError('Agent not found');
        return await this.messageQueue.listPending({
            ...req.params,
            userId: req.user.id,
            kind: 'preview',
        });
    }
    async updateQueuedMessage(req, _res, payload) {
        this.assertQueueId(req.params.queueId);
        const agent = await this.agentsService.findById(req.params.agentId, req.params.projectId);
        if (!agent)
            throw new errors_1.NotFoundError('Agent not found');
        await this.messageQueue.updatePending({
            ...req.params,
            userId: req.user.id,
            message: payload.message,
            kind: 'preview',
        });
    }
    async reorderQueuedMessage(req, _res, payload) {
        this.assertQueueId(req.params.queueId);
        const agent = await this.agentsService.findById(req.params.agentId, req.params.projectId);
        if (!agent)
            throw new errors_1.NotFoundError('Agent not found');
        await this.messageQueue.reorderPending({
            ...req.params,
            userId: req.user.id,
            targetQueueId: payload.targetQueueId,
            expectedQueueIds: payload.expectedQueueIds,
            kind: 'preview',
        });
    }
    async removeQueuedMessage(req) {
        this.assertQueueId(req.params.queueId);
        const agent = await this.agentsService.findById(req.params.agentId, req.params.projectId);
        if (!agent)
            throw new errors_1.NotFoundError('Agent not found');
        await this.messageQueue.removePending({ ...req.params, userId: req.user.id, kind: 'preview' });
        return { removed: true };
    }
    async steerQueuedMessage(req, _res, payload) {
        this.assertQueueId(req.params.queueId);
        const agent = await this.agentsService.findById(req.params.agentId, req.params.projectId);
        if (!agent)
            throw new errors_1.NotFoundError('Agent not found');
        await this.messageQueue.steer({
            ...req.params,
            userId: req.user.id,
            executionId: payload.executionId,
            kind: 'preview',
        });
    }
    async getBackgroundJobs(req) {
        const { projectId, agentId, threadId } = req.params;
        const agent = await this.agentsService.findById(agentId, projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        const thread = await this.agentExecutionService.findThreadById(threadId);
        if (!thread)
            return { tasks: [] };
        if (!(0, agent_thread_access_1.threadBelongsTo)(thread, projectId, agentId, req.user.id)) {
            throw new errors_1.NotFoundError(`Thread "${threadId}" not found`);
        }
        if (thread.accessScope === 'user') {
            await this.requirePreviewThread(threadId, projectId, agentId, req.user.id);
        }
        const jobs = await this.backgroundJobService.listCurrentGroupForThread(agentId, threadId);
        return this.mapBackgroundJobsToDto(jobs);
    }
    mapBackgroundJobsToDto(jobs) {
        return {
            pendingTaskIds: jobs
                .filter((job) => job.status !== 'running' &&
                job.status !== 'suspended' &&
                job.status !== 'paused' &&
                !job.notifiedAt)
                .map((job) => job.id),
            tasks: jobs.map((job) => ({
                id: job.id,
                title: (0, scrub_secrets_1.scrubSecretsInText)(job.title),
                kind: job.kind,
                status: job.status,
                ...(job.pauseRequestId ? { pauseRequested: true } : {}),
                ...(job.approval
                    ? {
                        approval: {
                            ...job.approval,
                            suspendPayload: (0, redact_text_1.redactDeep)(job.approval.suspendPayload, {
                                redactSensitiveKeys: true,
                            }).value,
                        },
                    }
                    : {}),
                startedAt: job.createdAt.toISOString(),
                ...(job.settledAt ? { settledAt: job.settledAt.toISOString() } : {}),
            })),
        };
    }
    async stopBackgroundJobs(req) {
        const { projectId, agentId, threadId } = req.params;
        const agent = await this.agentsService.findById(agentId, projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        await this.requirePreviewThread(threadId, projectId, agentId, req.user.id);
        if (!this.agentsConfig.backgroundTasksEnabled)
            throw new errors_1.BadRequestError('Background tasks are not enabled');
        await this.backgroundJobService.requestPause(agentId, threadId, (0, agent_memory_scope_1.draftChatMemoryResourceId)(req.user.id));
        return await this.getBackgroundJobs(req);
    }
    async resumeBackgroundJob(req, _res, payload) {
        const { projectId, agentId, threadId } = req.params;
        const resumed = await this.agentExecutionOrchestratorService.resumeBackgroundForChat({
            ...payload,
            resumeData: payload.resumeData,
            projectId,
            agentId,
            user: req.user,
            usePublishedVersion: false,
            chatSurface: 'preview',
            expectedMemory: { threadId, resourceId: (0, agent_memory_scope_1.draftChatMemoryResourceId)(req.user.id) },
        });
        if (!resumed)
            throw new errors_1.BadRequestError('This background approval is no longer available');
        return { resumed };
    }
    async getChatMessages(req) {
        const { projectId, agentId, threadId } = req.params;
        const agent = await this.agentsService.findById(agentId, projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        const thread = await this.agentExecutionService.findThreadById(threadId);
        if (thread && !(0, agent_thread_access_1.threadBelongsTo)(thread, projectId, agentId, req.user.id)) {
            throw new errors_1.NotFoundError(`Thread "${threadId}" not found`);
        }
        if (thread?.accessScope === 'user') {
            await this.requirePreviewThread(threadId, projectId, agentId, req.user.id);
        }
        const history = await this.agentExecutionOrchestratorService.getConversationHistory({
            threadId,
            projectId,
            agentId,
            userId: req.user.id,
        });
        const checkpoint = await this.checkpointStorage.findSuspendedForThread(agentId, threadId);
        if (checkpoint &&
            (thread?.accessScope === 'project'
                ? (0, agent_memory_scope_1.userIdFromDraftChatMemoryResourceId)(checkpoint.persistence?.resourceId ?? '') !==
                    undefined
                : checkpoint.persistence?.resourceId !== (0, agent_memory_scope_1.draftChatMemoryResourceId)(req.user.id) ||
                    (!thread &&
                        !(await this.agentExecutionService.canUseDraftThread(threadId, projectId, agentId, req.user.id))))) {
            throw new errors_1.NotFoundError(`Thread "${threadId}" not found`);
        }
        if (!history) {
            if (checkpoint)
                return { ...(0, messages_envelope_1.withOpenSuspensions)([], checkpoint), activeExecutionId: null };
            throw new errors_1.NotFoundError(`Thread "${threadId}" not found`);
        }
        return {
            ...(0, messages_envelope_1.withOpenSuspensions)(history.messages, checkpoint, {
                appendInactiveCheckpointMessages: false,
            }),
            activeExecutionId: history.activeExecutionId,
        };
    }
    async getTestChatMessages(req) {
        const { projectId, agentId } = req.params;
        const agent = await this.agentsService.findById(agentId, projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        if (!(await this.agentExecutionService.canUseDraftThread((0, agent_test_chat_service_1.chatThreadId)(agentId, req.user.id), projectId, agentId, req.user.id))) {
            throw new errors_1.NotFoundError('Session not found');
        }
        const messages = await this.agentTestChatService.getTestChatMessages(agentId, req.user.id);
        const checkpoint = await this.checkpointStorage.findSuspendedForThread(agentId, (0, agent_test_chat_service_1.chatThreadId)(agentId, req.user.id));
        return (0, messages_envelope_1.withOpenSuspensions)((0, agent_message_mapper_1.messagesToDto)(messages), checkpoint?.persistence?.resourceId === (0, agent_memory_scope_1.draftChatMemoryResourceId)(req.user.id)
            ? checkpoint
            : null);
    }
    async getChatAttachment(req, res) {
        const { projectId, agentId, attachmentId } = req.params;
        const agent = await this.agentsService.findById(agentId, projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        const attachment = await this.agentChatAttachmentService.getForAgent(attachmentId, {
            agentId,
            projectId,
            userId: req.user.id,
        });
        if (!attachment)
            throw new errors_1.NotFoundError(`Attachment "${attachmentId}" not found`);
        if (attachment.source === agent_thread_access_1.N8N_CHAT_PRODUCTION_SOURCE) {
            throw new errors_1.NotFoundError(`Attachment "${attachmentId}" not found`);
        }
        await this.chatRelay.streamAttachment(attachment, res);
    }
    async clearTestChatMessages(req) {
        const { projectId, agentId } = req.params;
        const agent = await this.agentsService.findById(agentId, projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        if (!(await this.agentExecutionService.canUseDraftThread((0, agent_test_chat_service_1.chatThreadId)(agentId, req.user.id), projectId, agentId, req.user.id))) {
            throw new errors_1.NotFoundError('Session not found');
        }
        await this.agentTestChatService.clearTestChatMessages(agentId, req.user.id);
        return { ok: true };
    }
};
exports.AgentChatController = AgentChatController;
__decorate([
    (0, decorators_1.Post)('/:agentId/n8n-chat', { usesTemplates: true }),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AgentChatMessageDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "productionChat", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/n8n-chat/resume', { usesTemplates: true }),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AgentChatResumeDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "productionChatResume", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/chat', { usesTemplates: true }),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AgentChatMessageDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "chat", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/chat/resume', { usesTemplates: true }),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AgentChatResumeDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "chatResume", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/chat/:threadId/executions/:executionId'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('threadId')),
    __param(4, (0, decorators_1.Param)('executionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "cancelChatExecution", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/chat/runs/:runId'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('runId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "cancelChatRun", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/n8n-chat/:threadId/executions/:executionId'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('threadId')),
    __param(4, (0, decorators_1.Param)('executionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "cancelProductionChatExecution", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/n8n-chat/runs/:runId'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('runId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "cancelProductionChatRun", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/n8n-chat/:threadId/messages'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "getProductionChatMessages", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/n8n-chat/attachments/:attachmentId'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "getProductionChatAttachment", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/n8n-chat/:threadId/queue'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "getProductionQueuedMessages", null);
__decorate([
    (0, decorators_1.Patch)('/:agentId/n8n-chat/:threadId/queue/:queueId'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AgentChatQueueUpdateDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "updateProductionQueuedMessage", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/n8n-chat/:threadId/queue/:queueId/reorder'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AgentChatQueueReorderDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "reorderProductionQueuedMessage", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/n8n-chat/:threadId/queue/:queueId/steer'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AgentChatQueueSteerDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "steerProductionQueuedMessage", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/n8n-chat/:threadId/queue/:queueId'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "removeProductionQueuedMessage", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/n8n-chat/:threadId/background-tasks'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "getProductionBackgroundJobs", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/n8n-chat/:threadId/background-tasks/stop'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "stopProductionBackgroundJobs", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/n8n-chat/:threadId/background-tasks/resume'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AgentChatResumeDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "resumeProductionBackgroundJob", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/n8n-chat/:threadId'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "deleteProductionChatThread", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/chat/:threadId/queue'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "getQueuedMessages", null);
__decorate([
    (0, decorators_1.Patch)('/:agentId/chat/:threadId/queue/:queueId'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AgentChatQueueUpdateDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "updateQueuedMessage", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/chat/:threadId/queue/:queueId/reorder'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AgentChatQueueReorderDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "reorderQueuedMessage", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/chat/:threadId/queue/:queueId'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "removeQueuedMessage", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/chat/:threadId/queue/:queueId/steer'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AgentChatQueueSteerDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "steerQueuedMessage", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/chat/:threadId/background-tasks'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "getBackgroundJobs", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/chat/:threadId/background-tasks/stop'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "stopBackgroundJobs", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/chat/:threadId/background-tasks/resume'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AgentChatResumeDto]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "resumeBackgroundJob", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/chat/:threadId/messages'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "getChatMessages", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/chat/messages'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "getTestChatMessages", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/chat/attachments/:attachmentId'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "getChatAttachment", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/chat/messages'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatController.prototype, "clearTestChatMessages", null);
exports.AgentChatController = AgentChatController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_execution_orchestrator_service_1.AgentExecutionOrchestratorService, agent_test_run_service_1.AgentTestRunService, agent_test_chat_service_1.AgentTestChatService, n8n_checkpoint_storage_1.N8NCheckpointStorage, credentials_service_1.CredentialsService, agents_service_1.AgentsService, agent_chat_attachment_service_1.AgentChatAttachmentService, agent_execution_service_1.AgentExecutionService, agent_background_job_service_1.AgentBackgroundJobService, agent_chat_execution_service_1.AgentChatExecutionService, agent_message_queue_service_1.AgentMessageQueueService, config_1.AgentsConfig, agent_chat_relay_service_1.AgentChatRelayService])
], AgentChatController);
//# sourceMappingURL=agent-chat.controller.js.map