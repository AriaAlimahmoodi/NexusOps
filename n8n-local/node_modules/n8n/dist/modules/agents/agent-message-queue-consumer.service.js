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
exports.AgentMessageQueueConsumer = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_service_1 = require("../../credentials/credentials.service");
const check_access_1 = require("../../permissions.ee/check-access");
const agents_credential_provider_1 = require("./adapters/agents-credential-provider");
const agent_chat_execution_service_1 = require("./agent-chat-execution.service");
const agent_execution_orchestrator_service_1 = require("./agent-execution-orchestrator.service");
const agent_execution_service_1 = require("./agent-execution.service");
const agent_message_queue_service_1 = require("./agent-message-queue.service");
const agent_queued_preview_stream_service_1 = require("./agent-queued-preview-stream.service");
const agent_sse_stream_1 = require("./agent-sse-stream");
const agent_test_run_service_1 = require("./agent-test-run.service");
const chat_integration_service_1 = require("./integrations/chat-integration.service");
const agent_message_queue_repository_1 = require("./repositories/agent-message-queue.repository");
let AgentMessageQueueConsumer = class AgentMessageQueueConsumer {
    constructor(queue, repository, executionService, previewStreams, testRunService, userRepository, credentialsService, chatExecutionService, integrations, orchestrator, logger) {
        this.queue = queue;
        this.repository = repository;
        this.executionService = executionService;
        this.previewStreams = previewStreams;
        this.testRunService = testRunService;
        this.userRepository = userRepository;
        this.credentialsService = credentialsService;
        this.chatExecutionService = chatExecutionService;
        this.integrations = integrations;
        this.orchestrator = orchestrator;
        this.logger = logger;
        this.activeThreads = new Set();
        this.stopped = true;
        this.scanning = false;
    }
    start() {
        this.stopped = false;
        this.queue.onAvailable = (threadId) => this.kick(threadId);
        this.timer = setInterval(() => {
            void this.scan();
        }, 5_000);
        this.timer.unref();
        void this.scan();
    }
    stop() {
        this.stopped = true;
        clearInterval(this.timer);
        this.queue.onAvailable = undefined;
    }
    async scan() {
        if (this.stopped || this.scanning)
            return;
        this.scanning = true;
        try {
            for (const threadId of await this.repository.findThreadIds())
                this.kick(threadId);
            await this.previewStreams.closeSettledStreams();
        }
        catch (error) {
            this.logger.warn('Failed to scan queued agent messages', { error });
        }
        finally {
            this.scanning = false;
        }
    }
    kick(threadId) {
        if (this.stopped || this.activeThreads.has(threadId))
            return;
        this.activeThreads.add(threadId);
        void this.drain(threadId)
            .catch((error) => {
            this.logger.warn('Failed to consume queued agent messages', { threadId, error });
        })
            .finally(() => this.activeThreads.delete(threadId));
    }
    async drain(threadId) {
        while (!this.stopped) {
            if (!(await this.consumeNext(threadId)))
                return;
        }
    }
    async consumeNext(threadId) {
        let lease;
        try {
            const claim = await this.queue.claimNext(threadId, async (item, thread, ctx) => {
                if (this.stopped)
                    return false;
                if (item.payload.kind !== 'integration')
                    return true;
                const source = item.message.origin?.source;
                if (!source)
                    throw new n8n_workflow_1.UnexpectedError('Queued integration input has no source');
                const connection = await this.repository.findPublishedConnection(thread.agentId, thread.projectId, source, item.payload.credentialId, ctx);
                if (this.stopped)
                    return false;
                if (!connection)
                    return true;
                lease = this.integrations.acquireQueueBridge(thread.agentId, source, item.payload.credentialId);
                return lease !== undefined;
            });
            if (!claim)
                return false;
            await this.consume(claim, lease?.bridge);
            return true;
        }
        finally {
            lease?.release();
        }
    }
    async consume(claim, bridge) {
        const { item, thread, admission, payload } = claim;
        const controller = new AbortController();
        const signal = AbortSignal.any([
            controller.signal,
            this.executionService.getAbortSignal(admission.executionId),
        ]);
        const sender = payload.kind === 'integration' ? undefined : this.previewStreams.createSender(item.id);
        try {
            if (sender) {
                const user = await this.getThreadOwner(thread);
                this.chatExecutionService.register({
                    projectId: thread.projectId,
                    agentId: thread.agentId,
                    threadId: thread.id,
                    userId: user.id,
                    executionId: admission.executionId,
                    surface: payload.kind === 'n8n_chat' ? 'n8n-chat' : 'preview',
                }, controller);
                sender.send({
                    type: 'execution-started',
                    executionId: admission.executionId,
                    sessionId: thread.id,
                    inputMessageIds: admission.inputMessageIds,
                    message: payload.message,
                });
                await this.chatExecutionService.settle(admission.executionId, async () => payload.kind === 'n8n_chat'
                    ? await this.consumeN8nChat(claim, user, signal, sender.send)
                    : await this.consumePreview(claim, user, signal, sender.send));
            }
            else {
                await this.consumeIntegration(claim, signal, bridge);
            }
        }
        catch (error) {
            await this.queue.recordFailure(claim, error, controller.signal);
            sender?.send((0, agent_sse_stream_1.toChatErrorEvent)(error, 'Chat failed'));
            this.logger.warn('Queued agent message failed', {
                queueId: item.id,
                executionId: admission.executionId,
                error,
            });
        }
        finally {
            await sender?.close();
            await this.queue.settle(thread.id, admission.executionId);
        }
    }
    async getThreadOwner(thread) {
        if (!thread.ownerId)
            throw new n8n_workflow_1.UserError('You can no longer execute this agent');
        const user = await this.userRepository.findByIdWithRole(thread.ownerId);
        if (!user ||
            user.disabled ||
            !(await (0, check_access_1.userHasScopes)(user, ['agent:execute'], false, { projectId: thread.projectId }))) {
            throw new n8n_workflow_1.UserError('You can no longer execute this agent');
        }
        return user;
    }
    async consumePreview(claim, user, signal, send) {
        const { thread, admission, payload } = claim;
        if (payload.kind !== 'preview')
            return;
        signal.throwIfAborted();
        const prepared = await this.testRunService.prepareDraftRun({
            agentId: thread.agentId,
            projectId: thread.projectId,
            user,
            sessionId: thread.id,
            previewChat: true,
            newSession: false,
            credentialProvider: new agents_credential_provider_1.AgentsCredentialProvider(this.credentialsService, thread.projectId, user, thread.agentId),
        });
        if (prepared.status !== 'ready') {
            const message = prepared.status === 'agent_misconfigured'
                ? 'This agent is not ready to run yet.'
                : 'Session not found';
            await this.queue.recordFailure(claim, new n8n_workflow_1.UserError(message), signal);
            send({
                type: 'error',
                message,
                ...(prepared.status === 'agent_misconfigured'
                    ? { errorCode: 'agent_misconfigured', missing: prepared.missing }
                    : {}),
            });
            return;
        }
        const result = await this.testRunService.executePreparedDraftRun({
            agentId: thread.agentId,
            projectId: thread.projectId,
            user,
            message: payload.message,
            attachments: payload.attachments,
            sessionId: thread.id,
            sessionMode: 'existing',
            previewChat: true,
            source: claim.recording.source,
            admittedExecution: admission,
            abortSignal: signal,
            errorMode: 'forward',
            onChunk: (chunk) => (0, agent_sse_stream_1.emitChunkEvents)(chunk, send),
            onBudgetNotice: (notice) => send({ type: 'budget-notice', ...notice }),
        });
        if (result.status === 'completed')
            send({ type: 'done', sessionId: thread.id, executionId: admission.executionId });
    }
    async consumeN8nChat(claim, user, signal, send) {
        const { thread, admission, payload } = claim;
        const stream = this.orchestrator.executeForN8nChatPublished({
            agentId: thread.agentId,
            projectId: thread.projectId,
            user,
            message: payload.message,
            memory: { threadId: thread.id, resourceId: payload.resourceId },
            attachments: payload.attachments,
            sessionMode: 'existing',
            admittedExecution: admission,
            abortSignal: signal,
        });
        let completed = true;
        for await (const chunk of stream) {
            (0, agent_sse_stream_1.emitChunkEvents)(chunk, send);
            if (chunk.type === 'tool-call-suspended' || chunk.type === 'error')
                completed = false;
        }
        if (completed)
            send({ type: 'done', sessionId: thread.id, executionId: admission.executionId });
    }
    async consumeIntegration(claim, signal, bridge) {
        const { thread, payload } = claim;
        if (payload.kind !== 'integration')
            return;
        const connection = await this.repository.findPublishedConnection(thread.agentId, thread.projectId, payload.messageContext.platform, payload.credentialId);
        if (!connection)
            throw new n8n_workflow_1.UserError('The message integration is no longer configured');
        if (!bridge)
            throw new n8n_workflow_1.OperationalError('The message integration is unavailable');
        await bridge.consumeQueuedMessage(payload, thread.id, claim.admission, signal, connection);
    }
};
exports.AgentMessageQueueConsumer = AgentMessageQueueConsumer;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AgentMessageQueueConsumer.prototype, "stop", null);
exports.AgentMessageQueueConsumer = AgentMessageQueueConsumer = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_message_queue_service_1.AgentMessageQueueService, agent_message_queue_repository_1.AgentMessageQueueRepository, agent_execution_service_1.AgentExecutionService, agent_queued_preview_stream_service_1.AgentQueuedPreviewStreamService, agent_test_run_service_1.AgentTestRunService, db_1.UserRepository, credentials_service_1.CredentialsService, agent_chat_execution_service_1.AgentChatExecutionService, chat_integration_service_1.ChatIntegrationService, agent_execution_orchestrator_service_1.AgentExecutionOrchestratorService, backend_common_1.Logger])
], AgentMessageQueueConsumer);
//# sourceMappingURL=agent-message-queue-consumer.service.js.map