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
exports.AgentExecutionOrchestratorService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const external_hooks_1 = require("../../external-hooks");
const telemetry_1 = require("../../telemetry");
const agent_execution_service_1 = require("./agent-execution.service");
const agent_chat_execution_service_1 = require("./agent-chat-execution.service");
const agent_n8n_chat_unavailable_error_1 = require("./agent-n8n-chat-unavailable.error");
const agent_memory_scope_1 = require("./utils/agent-memory-scope");
const agent_thread_access_1 = require("./utils/agent-thread-access");
const agent_run_tracing_service_1 = require("./agent-run-tracing.service");
const agent_runtime_cache_service_1 = require("./agent-runtime-cache.service");
const agent_sandbox_principal_1 = require("./agent-sandbox-principal");
const agent_sandbox_runtime_service_1 = require("./agent-sandbox-runtime.service");
const agents_settings_service_1 = require("./agents-settings.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_telemetry_1 = require("./agent-telemetry");
const agent_turn_execution_service_1 = require("./agent-turn-execution.service");
const budget_guardrail_1 = require("./budget-guardrail");
const agent_execution_recording_error_1 = require("./agent-execution-recording.error");
const integration_message_context_1 = require("./integrations/integration-message-context");
const integration_message_context_service_1 = require("./integrations/integration-message-context.service");
const n8n_checkpoint_storage_1 = require("./integrations/n8n-checkpoint-storage");
const model_stream_stall_options_1 = require("./model-stream-stall-options");
const agent_repository_1 = require("./repositories/agent.repository");
const agent_background_job_repository_1 = require("./repositories/agent-background-job.repository");
const agent_background_job_service_1 = require("./background/agent-background-job.service");
const sub_agent_background_state_1 = require("./background/sub-agent-background-state");
const agent_execution_counter_1 = require("./utils/agent-execution-counter");
const agent_published_snapshot_1 = require("./utils/agent-published-snapshot");
const inbound_attachments_1 = require("./utils/inbound-attachments");
const execution_to_message_mapper_1 = require("./utils/execution-to-message-mapper");
let AgentExecutionOrchestratorService = class AgentExecutionOrchestratorService {
    constructor(logger, n8nCheckpointStorage, agentExecutionService, turnExecutionService, telemetry, runtimeCacheService, integrationMessageContextService, agentRunTracingService, externalHooks, agentSandboxRuntimeService, agentRepository, aiConfig, chatExecutionService, backgroundJobRepository, backgroundJobService, settingsService, agentSkillRefs) {
        this.logger = logger;
        this.n8nCheckpointStorage = n8nCheckpointStorage;
        this.agentExecutionService = agentExecutionService;
        this.turnExecutionService = turnExecutionService;
        this.telemetry = telemetry;
        this.runtimeCacheService = runtimeCacheService;
        this.integrationMessageContextService = integrationMessageContextService;
        this.agentRunTracingService = agentRunTracingService;
        this.externalHooks = externalHooks;
        this.agentSandboxRuntimeService = agentSandboxRuntimeService;
        this.agentRepository = agentRepository;
        this.aiConfig = aiConfig;
        this.chatExecutionService = chatExecutionService;
        this.backgroundJobRepository = backgroundJobRepository;
        this.backgroundJobService = backgroundJobService;
        this.settingsService = settingsService;
        this.agentSkillRefs = agentSkillRefs;
    }
    async getSessionMode(threadId) {
        return await this.agentExecutionService.getSessionMode(threadId);
    }
    async getConversationHistory(params) {
        const { threadId, projectId, agentId, userId } = params;
        const detail = await this.agentExecutionService.getThreadDetail(threadId, projectId, agentId, userId);
        if (!detail)
            return null;
        return {
            messages: (0, execution_to_message_mapper_1.executionsToMessagesDto)(detail.executions),
            activeExecutionId: detail.executions.findLast((execution) => execution.status === 'running')?.id ?? null,
        };
    }
    async cancelChatRun(params) {
        return await this.chatExecutionService.cancelSuspended(params);
    }
    async loadResumeCheckpoint(config) {
        const memoryScope = await this.loadResumeMemory(config);
        const { scope, sandboxPrincipalHash } = await this.resolveResumeScope(config, memoryScope);
        return { memoryScope, sandboxPrincipalHash, scope };
    }
    async loadResumeMemory({ agentId, runId, expectedMemory }) {
        const checkpointStatus = await this.n8nCheckpointStorage.getStatus(runId, agentId);
        if (checkpointStatus.status === 'expired') {
            throw new n8n_workflow_1.UserError(`Checkpoint ${runId} is expired and cannot be resumed`);
        }
        if (checkpointStatus.status === 'not-found') {
            throw new n8n_workflow_1.UserError(`Checkpoint ${runId} not found and cannot be resumed`);
        }
        const memoryScope = checkpointStatus.checkpoint?.persistence;
        if (!memoryScope) {
            throw new n8n_workflow_1.UserError(`Checkpoint ${runId} has no memory data and cannot be resumed`);
        }
        if (memoryScope.delegated === true) {
            throw new n8n_workflow_1.UserError('Delegated actions must be resumed through their parent agent');
        }
        if ((expectedMemory?.threadId !== undefined &&
            memoryScope.threadId !== expectedMemory.threadId) ||
            (expectedMemory?.resourceId !== undefined &&
                memoryScope.resourceId !== expectedMemory.resourceId)) {
            throw new n8n_workflow_1.UserError(`Checkpoint ${runId} does not belong to this chat`);
        }
        return memoryScope;
    }
    async resolveResumeScope(config, memoryScope) {
        const { agentId, projectId, runId, user, usePublishedVersion, chatSurface } = config;
        const notThisChat = () => new n8n_workflow_1.UserError(`Checkpoint ${runId} does not belong to this chat`);
        const isDraft = !usePublishedVersion && !(0, agent_memory_scope_1.isTaskRunMemoryResourceId)(memoryScope.resourceId);
        if (isDraft || chatSurface === 'n8n-chat') {
            if (!user)
                throw notThisChat();
            const thread = {
                agentId,
                projectId,
                threadId: memoryScope.threadId,
                resourceId: memoryScope.resourceId,
                sessionMode: 'existing',
                denied: notThisChat,
            };
            const setup = isDraft
                ? await this.preparePreviewChat({
                    ...thread,
                    user,
                    previewChat: chatSurface === 'preview',
                })
                : await this.prepareN8nChat({
                    ...thread,
                    userId: user.id,
                    skipPublishedCheck: true,
                });
            const sandboxPrincipalHash = this.checkResumeSandbox(config, memoryScope, {
                always: setup.alwaysSandboxed,
                owner: { principalHash: setup.sandboxPrincipalHash },
            });
            return { scope: setup, sandboxPrincipalHash };
        }
        const thread = await this.agentExecutionService.findThreadById(memoryScope.threadId);
        if ((0, agent_memory_scope_1.userIdFromDraftChatMemoryResourceId)(memoryScope.resourceId) ||
            (0, agent_memory_scope_1.userIdFromProductionChatMemoryResourceId)(memoryScope.resourceId) ||
            !thread ||
            thread.projectId !== projectId ||
            thread.agentId !== agentId ||
            thread.accessScope !== 'project') {
            throw notThisChat();
        }
        const owner = usePublishedVersion ? undefined : user;
        const sandboxPrincipalHash = this.checkResumeSandbox(config, memoryScope, {
            always: false,
            owner: usePublishedVersion
                ? undefined
                : {
                    principalHash: owner
                        ? (0, agent_sandbox_principal_1.hashAgentSandboxPrincipal)({ type: 'n8n-user', userId: owner.id })
                        : undefined,
                },
        });
        return {
            scope: { access: { accessScope: 'project', ownerId: null }, runtime: { user: owner } },
            sandboxPrincipalHash,
        };
    }
    checkResumeSandbox({ projectId, runId }, memoryScope, rule) {
        const sandboxScope = (0, agent_sandbox_principal_1.decodeAgentSandboxHostMetadata)(memoryScope.hostMetadata);
        const sandboxPrincipalHash = sandboxScope?.principalHash;
        if ((this.agentSandboxRuntimeService.isEnabled() || rule.always) &&
            (!sandboxScope ||
                sandboxScope.projectId !== projectId ||
                !sandboxPrincipalHash ||
                (rule.owner !== undefined &&
                    (!rule.owner.principalHash || sandboxPrincipalHash !== rule.owner.principalHash)))) {
            throw new n8n_workflow_1.UserError(`Checkpoint ${runId} is unavailable and cannot be resumed`);
        }
        return sandboxPrincipalHash;
    }
    async *resumeForChat(config) {
        const resume = { ...config, usePublishedVersion: config.usePublishedVersion ?? true };
        if (resume.chatSurface === 'n8n-chat' &&
            !(await this.agentRepository.isN8nChatPublished(resume.agentId, resume.projectId))) {
            throw new agent_n8n_chat_unavailable_error_1.AgentN8nChatUnavailableError();
        }
        if (await this.resumeBackgroundForChat(resume))
            return;
        const checkpoint = await this.loadResumeCheckpoint(resume);
        const run = { ...resume, source: resume.source ?? checkpoint.scope.source };
        yield* this.withRuntimeLease(async () => await this.getResumeRuntime(run, checkpoint), (runtime) => this.resumeRuntimeTurn(run, checkpoint, runtime));
    }
    async resumeBackgroundForChat(config) {
        if (!config.runId.startsWith(sub_agent_background_state_1.BACKGROUND_APPROVAL_RUN_PREFIX))
            return false;
        const job = await this.backgroundJobRepository.findById(config.runId.slice(sub_agent_background_state_1.BACKGROUND_APPROVAL_RUN_PREFIX.length));
        if (!job || job.parentAgentId !== config.agentId || job.status !== 'suspended') {
            throw new n8n_workflow_1.UserError('This background approval is no longer available');
        }
        const resume = { ...config, usePublishedVersion: config.usePublishedVersion ?? true };
        const approval = await this.backgroundJobService.getApproval(job);
        if (!approval ||
            approval.token !== config.toolCallId ||
            !(0, agent_sandbox_principal_1.isAgentSandboxPrincipalHash)(job.parentPrincipalHash) ||
            approval.scope.projectId !== config.projectId) {
            throw new n8n_workflow_1.UserError('This background approval is no longer available');
        }
        const memoryScope = {
            threadId: job.parentThreadId,
            resourceId: job.parentResourceId,
            hostMetadata: (0, agent_sandbox_principal_1.encodeAgentSandboxHostMetadata)({
                projectId: config.projectId,
                principalHash: job.parentPrincipalHash,
            }),
        };
        if ((config.expectedMemory?.threadId !== undefined &&
            config.expectedMemory.threadId !== memoryScope.threadId) ||
            (config.expectedMemory?.resourceId !== undefined &&
                config.expectedMemory.resourceId !== memoryScope.resourceId)) {
            throw new n8n_workflow_1.UserError('This background approval does not belong to this chat');
        }
        const { scope } = await this.resolveResumeScope(resume, memoryScope);
        if (resume.chatSurface === undefined && resume.usePublishedVersion) {
            const expected = approval.metadata.messageContext;
            const actual = config.messageContext;
            const destination = expected?.replyTarget ?? expected?.target;
            if (!expected ||
                !actual ||
                actual.platform !== expected.platform ||
                actual.integrationConnectionId !== expected.integrationConnectionId ||
                !destination?.threadId ||
                actual.target.threadId !== destination.threadId) {
                throw new n8n_workflow_1.UserError('This background approval does not belong to this chat');
            }
        }
        const { SubAgentBackgroundRunner } = await import('./background/sub-agent-background-runner.js');
        const { AgentsCredentialProvider } = await import('./adapters/agents-credential-provider.js');
        const { CredentialsService } = await import('../../credentials/credentials.service.js');
        const credentialUser = scope.runtime.user;
        await di_1.Container.get(SubAgentBackgroundRunner).resume(job, { token: config.toolCallId, resumeData: config.resumeData }, {
            projectId: config.projectId,
            parentAgentId: job.parentAgentId,
            credentialProvider: new AgentsCredentialProvider(di_1.Container.get(CredentialsService), config.projectId, credentialUser, job.subAgentId ?? undefined),
            runType: resume.usePublishedVersion ? 'production' : 'test',
            workflowToolExecutionMode: resume.usePublishedVersion ? 'integrated' : 'manual',
            user: credentialUser,
        });
        return true;
    }
    async deliverBackgroundApproval(config, title, approval) {
        if (config.identity.type === 'draft') {
            await this.preparePreviewChat({
                agentId: config.agentId,
                projectId: config.projectId,
                threadId: config.memory.threadId,
                resourceId: config.memory.resourceId,
                user: config.identity.user,
                sessionMode: 'existing',
            });
            return;
        }
        const productionUserId = (0, agent_memory_scope_1.userIdFromProductionChatMemoryResourceId)(config.memory.resourceId);
        if (productionUserId) {
            await this.prepareN8nChat({
                agentId: config.agentId,
                projectId: config.projectId,
                threadId: config.memory.threadId,
                resourceId: config.memory.resourceId,
                userId: productionUserId,
                sessionMode: 'existing',
            });
            return;
        }
        const delivery = await this.getWakeDelivery(config.agentId, config.identity.integrationType, approval.metadata.messageContext);
        await delivery.bridge.deliverBackgroundApproval(delivery.threadId, {
            jobId: approval.metadata.jobId,
            title,
            token: approval.token,
            toolCall: {
                type: 'tool-call-suspended',
                runId: approval.runId,
                toolCallId: approval.pending.toolCallId,
                toolName: approval.pending.toolName,
                input: approval.pending.input,
                suspendPayload: approval.pending.suspendPayload,
                resumeSchema: approval.pending.resumeSchema,
            },
        });
    }
    async *executeForChat(config) {
        const sessionMode = config.sessionMode ?? 'new';
        const setup = await this.preparePreviewChat({
            agentId: config.agentId,
            projectId: config.projectId,
            threadId: config.memory.threadId,
            resourceId: config.memory.resourceId,
            user: config.user,
            previewChat: config.previewChat,
            sessionMode,
        });
        const draft = { ...config, sessionMode };
        yield* this.withRuntimeLease(async () => await this.getDraftChatRuntime(draft, setup), async (runtime) => await this.streamDraftChatResponse(draft, runtime, setup));
    }
    async *executeForChatPublished(config) {
        const { agentId, projectId, message, modelMessage, author, memory, integrationType, attachments, sandboxPrincipalHash, sessionMode = 'new', } = config;
        await this.externalHooks.run('agent.preExecute', [agentId]);
        yield* this.withRuntimeLease(async () => await this.getRuntimeOrRecordFailure({
            agentId,
            projectId,
            integrationType,
            usePublishedVersion: true,
            sandboxPrincipalHash,
        }, {
            threadId: memory.threadId,
            resourceId: memory.resourceId,
            userMessage: message,
            author,
            attachments,
            messageOrigin: {
                integrationConnectionId: config.messageContext?.integrationConnectionId,
                platformMessageId: config.messageContext?.messageId,
            },
            source: integrationType,
            access: { accessScope: 'project', ownerId: null },
            sessionMode,
            admittedExecution: config.admittedExecution,
        }), async (runtime) => {
            let messageContext = config.messageContext;
            if (messageContext && config.contextConversation) {
                messageContext = (0, integration_message_context_1.inheritIntegrationMessageContext)(messageContext, await this.integrationMessageContextService.getLatestForIncoming(memory.threadId));
            }
            const selectedContext = messageContext;
            const conversation = config.contextConversation;
            return this.streamChatResponse({
                admittedExecution: config.admittedExecution,
                abortSignal: config.abortSignal,
                onAdmitted: selectedContext && conversation
                    ? async () => await this.integrationMessageContextService.installIncoming(selectedContext, memory, conversation)
                    : undefined,
                messageContext,
                access: { accessScope: 'project', ownerId: null },
                agentInstance: runtime.agent,
                toolRegistry: runtime.toolRegistry,
                mcpServerAttributions: runtime.mcpServerAttributions,
                budget: runtime.budget,
                agentId,
                message,
                modelMessage,
                author,
                attachments,
                memory,
                projectId: runtime.projectId,
                source: integrationType,
                telemetry: {
                    runType: 'production',
                    configuration: runtime.telemetryConfiguration,
                },
                sandboxPrincipalHash,
                sessionMode,
            });
        });
    }
    async *executeForN8nChatPublished(config) {
        const { agentId, projectId, message, memory, attachments, user, abortSignal, sessionMode = 'new', } = config;
        const setup = await this.prepareN8nChat({
            agentId,
            projectId,
            threadId: memory.threadId,
            resourceId: memory.resourceId,
            userId: user.id,
            sessionMode,
        });
        await this.externalHooks.run('agent.preExecute', [agentId]);
        yield* this.withRuntimeLease(async () => await this.getRuntimeOrRecordFailure({
            agentId,
            projectId,
            integrationType: setup.runtime.integrationType,
            usePublishedVersion: setup.runtime.usePublishedVersion,
            sandboxPrincipalHash: setup.sandboxPrincipalHash,
            attributionUserId: setup.runtime.attributionUserId,
        }, {
            threadId: memory.threadId,
            resourceId: memory.resourceId,
            userMessage: message,
            attachments,
            source: setup.source,
            access: setup.access,
            sessionMode,
            abortSignal,
            admittedExecution: config.admittedExecution,
        }), async (runtime) => {
            const messageContext = this.createN8nChatMessageContext(memory, user.id);
            return this.streamChatResponse({
                admittedExecution: config.admittedExecution,
                access: setup.access,
                messageContext,
                onAdmitted: async () => await this.integrationMessageContextService.setLatest(memory.threadId, memory.resourceId, messageContext),
                agentInstance: runtime.agent,
                toolRegistry: runtime.toolRegistry,
                mcpServerAttributions: runtime.mcpServerAttributions,
                budget: runtime.budget,
                agentId,
                projectId,
                message,
                memory,
                attachments,
                userId: user.id,
                chatSurface: setup.surface,
                source: setup.source,
                telemetry: { runType: 'production', configuration: runtime.telemetryConfiguration },
                sandboxPrincipalHash: setup.sandboxPrincipalHash,
                sessionMode,
                abortSignal,
                onExecutionStarted: config.onExecutionStarted,
                onExecutionRecorded: config.onExecutionRecorded,
            });
        });
    }
    async *executeForTaskPublished(config) {
        const { agentId, projectId, message, memory, taskId, taskVersionId } = config;
        await this.externalHooks.run('agent.preExecute', [agentId]);
        const sandboxPrincipalHash = (0, agent_sandbox_principal_1.hashAgentSandboxPrincipal)({ type: 'scheduled-task', taskId });
        yield* this.withRuntimeLease(async () => await this.getRuntimeOrRecordFailure({
            agentId,
            projectId,
            integrationType: 'task',
            usePublishedVersion: true,
            sandboxPrincipalHash,
            allowBackgroundTasks: false,
        }, {
            threadId: memory.threadId,
            resourceId: memory.resourceId,
            userMessage: message,
            source: 'task',
            taskId,
            taskVersionId,
            access: { accessScope: 'project', ownerId: null },
        }), (runtime) => this.streamChatResponse({
            agentInstance: runtime.agent,
            toolRegistry: runtime.toolRegistry,
            mcpServerAttributions: runtime.mcpServerAttributions,
            budget: runtime.budget,
            agentId,
            message,
            memory,
            projectId: runtime.projectId,
            source: 'task',
            taskId,
            taskVersionId,
            access: { accessScope: 'project', ownerId: null },
            telemetry: {
                runType: 'production',
                configuration: runtime.telemetryConfiguration,
            },
            sandboxPrincipalHash,
        }));
    }
    async *executeForTaskNow(config) {
        const { agentId, projectId, user, message, memory, taskId } = config;
        const sandboxPrincipalHash = (0, agent_sandbox_principal_1.hashAgentSandboxPrincipal)({
            type: 'n8n-user',
            userId: user.id,
        });
        yield* this.withRuntimeLease(async () => await this.getRuntimeOrRecordFailure({
            agentId,
            projectId,
            user,
            sandboxPrincipalHash,
            allowBackgroundTasks: false,
        }, {
            threadId: memory.threadId,
            resourceId: memory.resourceId,
            userMessage: message,
            source: 'task',
            taskId,
            access: { accessScope: 'project', ownerId: null },
        }), (runtime) => this.streamChatResponse({
            agentInstance: runtime.agent,
            toolRegistry: runtime.toolRegistry,
            mcpServerAttributions: runtime.mcpServerAttributions,
            budget: runtime.budget,
            agentId,
            userId: user.id,
            message,
            memory,
            projectId: runtime.projectId,
            source: 'task',
            taskId,
            access: { accessScope: 'project', ownerId: null },
            telemetry: {
                runType: 'test',
                configuration: runtime.telemetryConfiguration,
            },
            sandboxPrincipalHash,
        }));
    }
    async executeForWake(config) {
        const { agentId, memory, identity, abortSignal } = config;
        const isDraft = identity.type === 'draft';
        const productionUserId = isDraft
            ? undefined
            : (0, agent_memory_scope_1.userIdFromProductionChatMemoryResourceId)(memory.resourceId);
        let setup;
        if (productionUserId && !isDraft) {
            if (identity.integrationType !== api_types_1.N8N_CHAT_INTEGRATION_TYPE ||
                identity.principalHash !==
                    (0, agent_sandbox_principal_1.hashAgentSandboxPrincipal)({ type: 'n8n-user', userId: productionUserId })) {
                throw new n8n_workflow_1.OperationalError('Production n8n Chat wake identity is no longer valid');
            }
            try {
                setup = await this.prepareN8nChat({
                    agentId,
                    projectId: config.projectId,
                    threadId: memory.threadId,
                    resourceId: memory.resourceId,
                    userId: productionUserId,
                    sessionMode: 'existing',
                });
            }
            catch {
                throw new n8n_workflow_1.OperationalError('Production n8n Chat wake identity is no longer valid');
            }
        }
        if (isDraft) {
            setup = await this.preparePreviewChat({
                agentId,
                projectId: config.projectId,
                threadId: memory.threadId,
                resourceId: memory.resourceId,
                user: identity.user,
                sessionMode: 'existing',
            });
        }
        else {
            await this.externalHooks.run('agent.preExecute', [agentId]);
        }
        const access = setup?.access ?? { accessScope: 'project', ownerId: null };
        const integrationType = isDraft ? api_types_1.N8N_CHAT_INTEGRATION_TYPE : identity.integrationType;
        const messageContext = await this.integrationMessageContextService.getLatest(memory.threadId);
        const delivery = setup
            ? undefined
            : await this.getWakeDelivery(agentId, integrationType, messageContext);
        const stream = this.withRuntimeLease(async () => await this.getWakeRuntime(config, setup, access, integrationType), (runtime) => this.streamWakeResponse(this.streamWakeTurn(config, runtime, setup, access, integrationType, messageContext), abortSignal, delivery, messageContext?.interactingUserId));
        for await (const _chunk of stream) {
        }
    }
    async *streamWakeResponse(stream, abortSignal, delivery, cardRecipientId) {
        const chunks = [];
        let runError;
        for await (const chunk of stream) {
            if (delivery)
                chunks.push(chunk);
            if (chunk.type === 'error')
                runError = chunk.error;
            if (chunk.type === 'finish' && chunk.finishReason === 'error')
                runError ??= chunk;
            if (chunk.type === 'finish' && chunk.guardrail?.code === 'background-pause-report')
                runError ??= chunk;
            yield chunk;
        }
        if (runError !== undefined) {
            throw new n8n_workflow_1.OperationalError('Background job wake failed', { cause: runError });
        }
        abortSignal.throwIfAborted();
        if (delivery)
            await delivery.bridge.deliverWakeResponse(delivery.threadId, chunks, cardRecipientId);
    }
    async getWakeDelivery(agentId, integrationType, context) {
        const target = context?.replyTarget ?? context?.target;
        const [platform, credentialId] = context?.integrationConnectionId.split(':') ?? [];
        if (context?.platform !== integrationType ||
            platform !== integrationType ||
            !credentialId ||
            !target?.threadId) {
            throw new n8n_workflow_1.OperationalError('Background job wake has no reply context');
        }
        const { ChatIntegrationService } = await import('./integrations/chat-integration.service.js');
        const bridge = di_1.Container.get(ChatIntegrationService).getBridge(agentId, integrationType, credentialId);
        if (!bridge) {
            throw new n8n_workflow_1.OperationalError('Background job wake chat connection is unavailable');
        }
        return { bridge, threadId: target.threadId };
    }
    async *streamChatResponse(config) {
        if (!config.admittedExecution && !config.isWakeRun) {
            await this.settingsService.assertEnabled();
        }
        yield* this.turnExecutionService.execute({
            admittedExecution: config.admittedExecution,
            onAdmitted: config.onAdmitted,
            agentInstance: config.agentInstance,
            toolRegistry: config.toolRegistry,
            mcpServerAttributions: config.mcpServerAttributions,
            context: {
                projectId: config.projectId,
                agentId: config.agentId,
                threadId: config.memory.threadId,
            },
            backgroundJobSignal: config.backgroundJobSignal,
            onExecutionRecorded: config.onExecutionRecorded,
            chatSurface: config.chatSurface,
            isWakeRun: config.isWakeRun,
            onExecutionStarted: config.onExecutionStarted,
            onSettled: config.isWakeRun
                ? undefined
                : async () => await this.requestPendingBackgroundWake(config.memory.threadId),
            prepare: async () => await this.prepareChatTurn(config),
        });
    }
    async *withRuntimeLease(acquire, use) {
        const runtime = await acquire();
        try {
            yield* await use(runtime);
        }
        finally {
            this.runtimeCacheService.releaseRuntimeLease(runtime.agent);
        }
    }
    async requestPendingBackgroundWake(threadId) {
        try {
            const { AgentWakeService } = await import('./background/agent-wake.service.js');
            await di_1.Container.get(AgentWakeService).onParentTurnFinished(threadId);
        }
        catch (error) {
            this.logger.warn('Failed to request pending background job delivery', { threadId, error });
        }
    }
    async getRuntimeOrRecordFailure(params, session) {
        const { onExecutionRecorded, abortSignal, automaticContinuationRunId, admittedExecution, isWakeRun, ...recording } = session;
        abortSignal?.throwIfAborted();
        if (!admittedExecution && !recording.resumeRunId && !isWakeRun) {
            await this.settingsService.assertEnabled();
        }
        try {
            return await this.runtimeCacheService.getRuntime(params);
        }
        catch (error) {
            abortSignal?.throwIfAborted();
            const { agentId, projectId } = params;
            let agent;
            let selected;
            try {
                agent = await this.agentRepository.findByIdAndProjectId(agentId, projectId);
                if (agent) {
                    selected = await (0, agent_published_snapshot_1.resolveAgentRunSource)(agent, params.usePublishedVersion === true && Boolean(agent.activeVersion?.schema), this.agentSkillRefs, {});
                }
            }
            catch (cause) {
                throw new agent_execution_recording_error_1.AgentExecutionRecordingError({ phase: 'create', cause, executionError: error });
            }
            abortSignal?.throwIfAborted();
            if (agent && selected) {
                const failed = {
                    ...recording,
                    agentId,
                    agentName: selected.agent.schema?.name ?? agent.name,
                    projectId,
                    telemetry: {
                        userId: params.attributionUserId ?? params.user?.id,
                        runType: params.usePublishedVersion ? 'production' : 'test',
                        configuration: (0, agent_telemetry_1.buildAgentConfigurationTelemetry)(selected),
                    },
                };
                if (admittedExecution) {
                    await this.turnExecutionService.recordFailedAdmission(admittedExecution, failed, error);
                }
                else {
                    await this.turnExecutionService.recordFailedStart(failed, error, onExecutionRecorded, {
                        previewChat: params.previewChat,
                        automaticContinuationRunId,
                    });
                }
            }
            throw error;
        }
    }
    async getResumeRuntime(config, checkpoint) {
        const { agentId, projectId, runId, source, integrationType, usePublishedVersion, onExecutionRecorded, abortSignal, chatSurface, } = config;
        const previewChat = chatSurface === 'preview';
        const { memoryScope, sandboxPrincipalHash, scope } = checkpoint;
        return await this.getRuntimeOrRecordFailure({
            agentId,
            projectId,
            usePublishedVersion,
            integrationType,
            user: scope.runtime.user,
            attributionUserId: scope.runtime.attributionUserId,
            ...(sandboxPrincipalHash ? { sandboxPrincipalHash } : {}),
            previewChat,
        }, {
            threadId: memoryScope.threadId,
            resourceId: memoryScope.resourceId,
            resumeRunId: runId,
            userMessage: null,
            source,
            onExecutionRecorded,
            abortSignal,
            access: scope.access,
            automaticContinuationRunId: previewChat && config.automaticPreviewContinuation ? runId : undefined,
            sessionMode: 'existing',
        });
    }
    resumeRuntimeTurn(config, checkpoint, runtime) {
        const threadId = checkpoint.memoryScope.threadId;
        return this.turnExecutionService.execute({
            agentInstance: runtime.agent,
            toolRegistry: runtime.toolRegistry,
            mcpServerAttributions: runtime.mcpServerAttributions,
            context: { projectId: config.projectId, agentId: config.agentId, threadId },
            chatSurface: config.chatSurface,
            automaticPreviewContinuation: config.automaticPreviewContinuation,
            onExecutionStarted: config.onExecutionStarted,
            onExecutionRecorded: config.onExecutionRecorded,
            onSettled: async (suspended) => {
                if (!suspended)
                    await this.requestPendingBackgroundWake(threadId);
            },
            prepare: async () => await this.prepareChatResume(config, checkpoint, runtime),
        });
    }
    async prepareChatResume(config, checkpoint, runtime) {
        const { memoryScope } = checkpoint;
        const { executionSource, tracing } = await this.getResumeTracing(config, memoryScope.threadId, runtime);
        const messageContext = await this.resolveResumeMessageContext(config, memoryScope);
        return {
            type: 'resume',
            resumeData: config.resumeData,
            options: (0, budget_guardrail_1.withBudgetGuardrail)(this.createResumeOptions(config, memoryScope, messageContext, executionSource, tracing), {
                budget: runtime.budget,
                sessionId: memoryScope.threadId,
                agentId: config.agentId,
                ...(config.chatSurface === 'preview' && config.onBudgetNotice
                    ? { onNotice: config.onBudgetNotice }
                    : {}),
            }),
            recording: this.createResumeRecording(config, checkpoint, runtime, executionSource),
        };
    }
    async getResumeTracing(config, threadId, runtime) {
        const { agentId, projectId, source, user } = config;
        const suspendedExecution = source === undefined
            ? await this.agentExecutionService.findLatestSuspendedRun(threadId)
            : undefined;
        const executionSource = source ?? suspendedExecution?.source ?? undefined;
        const tracing = await this.agentRunTracingService.build({
            agentId,
            projectId,
            threadId,
            userId: user?.id,
            source: executionSource ?? 'unknown',
            modelId: (0, agent_run_tracing_service_1.modelIdFromSnapshot)(runtime.agent.snapshot.model),
        });
        return { executionSource, tracing };
    }
    createResumeOptions(config, memoryScope, selectedContext, source, tracing) {
        const { runId, toolCallId, agentId, user, usePublishedVersion, abortSignal } = config;
        const runType = usePublishedVersion ? 'production' : 'test';
        const conversation = config.contextConversation;
        return {
            runId,
            toolCallId,
            hostMetadata: (0, integration_message_context_1.encodeIntegrationMessageContext)(selectedContext),
            ...(selectedContext && conversation
                ? {
                    onResumeClaimed: async () => await this.integrationMessageContextService.installIncoming(selectedContext, memoryScope, conversation),
                }
                : {}),
            executionCounter: (0, agent_execution_counter_1.createAgentExecutionCounter)(this.telemetry, {
                agentId,
                userId: user?.id,
                runType,
                source,
            }),
            ...(0, model_stream_stall_options_1.modelStreamStallOptions)(this.aiConfig),
            ...(tracing ? { telemetry: tracing } : {}),
            ...(abortSignal ? { abortSignal } : {}),
        };
    }
    createResumeRecording(config, { memoryScope, scope }, runtime, executionSource) {
        const { agentId, projectId, user, usePublishedVersion } = config;
        const threadId = memoryScope.threadId;
        const runType = usePublishedVersion ? 'production' : 'test';
        return {
            access: scope.access,
            threadId,
            agentId,
            agentName: runtime.agent.name,
            resourceId: memoryScope.resourceId,
            projectId,
            userMessage: null,
            sessionMode: 'existing',
            ...(executionSource !== undefined ? { source: executionSource } : {}),
            telemetry: {
                userId: user?.id,
                runType,
                configuration: runtime.telemetryConfiguration,
            },
        };
    }
    async resolveResumeMessageContext(config, memoryScope) {
        let messageContext = config.messageContext;
        if (messageContext === undefined) {
            messageContext = await this.integrationMessageContextService.getForResume(memoryScope);
        }
        else if (messageContext && config.contextConversation) {
            messageContext = (0, integration_message_context_1.inheritIntegrationMessageContext)(messageContext, await this.integrationMessageContextService.getForResume(memoryScope));
        }
        return messageContext;
    }
    async preparePreviewChat(params) {
        const { agentId, projectId, threadId, resourceId, user, previewChat, sessionMode, denied } = params;
        const fail = denied ?? (() => new n8n_workflow_1.UserError('Session not found'));
        if (resourceId !== (0, agent_thread_access_1.chatSurfaceMemoryResourceId)('preview', user.id) ||
            !(await this.agentExecutionService.canUseDraftThread(threadId, projectId, agentId, user.id, {
                previewChat,
                sessionMode,
            }))) {
            throw fail();
        }
        return {
            surface: previewChat ? 'preview' : undefined,
            access: { accessScope: 'user', ownerId: user.id },
            sandboxPrincipalHash: (0, agent_sandbox_principal_1.hashAgentSandboxPrincipal)({ type: 'n8n-user', userId: user.id }),
            alwaysSandboxed: false,
            runtime: {
                usePublishedVersion: false,
                integrationType: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
                user,
                previewChat,
            },
        };
    }
    async prepareN8nChat(params) {
        const { agentId, projectId, threadId, resourceId, userId, sessionMode, skipPublishedCheck, denied, } = params;
        if (!skipPublishedCheck &&
            !(await this.agentRepository.isN8nChatPublished(agentId, projectId))) {
            throw new agent_n8n_chat_unavailable_error_1.AgentN8nChatUnavailableError();
        }
        const fail = denied ?? (() => new n8n_workflow_1.UserError('Session not found'));
        if (resourceId !== (0, agent_thread_access_1.chatSurfaceMemoryResourceId)('n8n-chat', userId)) {
            throw fail();
        }
        if (!(await this.agentExecutionService.canUseProductionChatThread(threadId, projectId, agentId, userId, sessionMode))) {
            throw fail();
        }
        return {
            surface: 'n8n-chat',
            access: { accessScope: 'user', ownerId: userId },
            sandboxPrincipalHash: (0, agent_sandbox_principal_1.hashAgentSandboxPrincipal)({ type: 'n8n-user', userId }),
            alwaysSandboxed: true,
            source: agent_thread_access_1.N8N_CHAT_PRODUCTION_SOURCE,
            runtime: {
                usePublishedVersion: true,
                integrationType: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
                attributionUserId: userId,
            },
        };
    }
    async getDraftChatRuntime(config, setup) {
        const { agentId, projectId, memory, message, attachments, source, onExecutionRecorded, abortSignal, sessionMode, } = config;
        return await this.getRuntimeOrRecordFailure({
            agentId,
            projectId,
            integrationType: setup.runtime.integrationType,
            user: setup.runtime.user,
            sandboxPrincipalHash: setup.sandboxPrincipalHash,
            previewChat: setup.runtime.previewChat,
        }, {
            threadId: memory.threadId,
            resourceId: memory.resourceId,
            access: setup.access,
            admittedExecution: config.admittedExecution,
            userMessage: message,
            attachments,
            source,
            onExecutionRecorded,
            abortSignal,
            sessionMode,
        });
    }
    async streamDraftChatResponse(config, runtime, setup) {
        const { agentId, user, memory, message, attachments, source, onExecutionRecorded, abortSignal, sessionMode, } = config;
        const messageContext = this.createN8nChatMessageContext(memory, user.id);
        return this.streamChatResponse({
            admittedExecution: config.admittedExecution,
            onAdmitted: async () => await this.integrationMessageContextService.setLatest(memory.threadId, memory.resourceId, messageContext),
            access: setup.access,
            messageContext,
            agentInstance: runtime.agent,
            toolRegistry: runtime.toolRegistry,
            mcpServerAttributions: runtime.mcpServerAttributions,
            budget: runtime.budget,
            agentId,
            userId: user.id,
            message,
            attachments,
            memory,
            projectId: runtime.projectId,
            source,
            telemetry: { runType: 'test', configuration: runtime.telemetryConfiguration },
            onExecutionRecorded,
            abortSignal,
            chatSurface: setup.surface,
            onBudgetNotice: config.onBudgetNotice,
            onExecutionStarted: config.onExecutionStarted,
            sandboxPrincipalHash: setup.sandboxPrincipalHash,
            sessionMode,
        });
    }
    createN8nChatMessageContext(memory, userId) {
        return {
            integrationConnectionId: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
            platform: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
            target: { type: 'dm', userId, threadId: memory.threadId },
            interactingUserId: userId,
            updatedAt: new Date().toISOString(),
        };
    }
    async prepareChatTurn(config) {
        const { agentInstance, agentId, userId, message, modelMessage = message, attachments, memory, projectId, source, telemetry, abortSignal, sandboxPrincipalHash, } = config;
        const { threadId, resourceId } = memory;
        const tracing = await this.agentRunTracingService.build({
            agentId,
            projectId,
            threadId,
            userId,
            source: source ?? 'test',
            modelId: (0, agent_run_tracing_service_1.modelIdFromSnapshot)(agentInstance.snapshot.model),
        });
        const input = attachments?.length
            ? (0, inbound_attachments_1.buildInboundUserMessage)(modelMessage, attachments)
            : modelMessage;
        const messageContext = config.messageContext === undefined
            ? await this.integrationMessageContextService.getLatest(threadId)
            : config.messageContext;
        const hostMetadata = {
            ...(0, agent_sandbox_principal_1.encodeAgentSandboxHostMetadata)({
                projectId,
                principalHash: sandboxPrincipalHash,
            }),
            ...(0, integration_message_context_1.encodeIntegrationMessageContext)(messageContext),
            ...(config.chatSurface !== undefined &&
                !config.isWakeRun &&
                !config.hideUserMessageFromTranscript
                ? { [sub_agent_background_state_1.BACKGROUND_PAUSE_USER_TURN_KEY]: true }
                : {}),
        };
        return {
            type: 'start',
            input,
            options: (0, budget_guardrail_1.withBudgetGuardrail)({
                persistence: { threadId, resourceId, hostMetadata },
                ...(config.pauseReport
                    ? {
                        toolsEnabled: false,
                        guardrails: {
                            hooks: [
                                {
                                    beforeTool: async () => ({
                                        action: 'stop',
                                        code: 'background-pause-report',
                                    }),
                                },
                            ],
                        },
                    }
                    : {}),
                executionCounter: (0, agent_execution_counter_1.createAgentExecutionCounter)(this.telemetry, {
                    agentId,
                    userId,
                    runType: telemetry.runType,
                    source,
                }),
                ...(0, model_stream_stall_options_1.modelStreamStallOptions)(this.aiConfig),
                ...(tracing ? { telemetry: tracing } : {}),
                ...(abortSignal ? { abortSignal } : {}),
            }, {
                budget: config.budget,
                sessionId: threadId,
                agentId,
                ...(config.chatSurface === 'preview' && config.onBudgetNotice
                    ? { onNotice: config.onBudgetNotice }
                    : {}),
            }),
            recording: this.createChatRecording(config),
        };
    }
    createChatRecording(config) {
        const { agentInstance, agentId, userId, message, author, attachments, memory, projectId, source, taskId, taskVersionId, telemetry, hideUserMessageFromTranscript, sessionMode, } = config;
        const { threadId } = memory;
        return {
            threadId,
            access: config.access,
            agentId,
            agentName: agentInstance.name,
            projectId,
            userMessage: message,
            resourceId: memory.resourceId,
            hideUserMessageFromTranscript,
            ...(config.messageContext && {
                messageOrigin: {
                    integrationConnectionId: config.messageContext.integrationConnectionId,
                    platformMessageId: config.messageContext.messageId,
                },
            }),
            sessionMode,
            author,
            attachments,
            source,
            taskId,
            taskVersionId,
            telemetry: { ...telemetry, userId },
        };
    }
    async getWakeRuntime(config, setup, access, integrationType) {
        const { agentId, projectId, memory, identity, abortSignal } = config;
        return await this.getRuntimeOrRecordFailure({
            agentId,
            projectId,
            integrationType,
            usePublishedVersion: identity.type !== 'draft',
            ...(setup?.runtime.attributionUserId
                ? { attributionUserId: setup.runtime.attributionUserId }
                : {}),
            ...(setup?.runtime.user ? { user: setup.runtime.user } : {}),
            sandboxPrincipalHash: identity.principalHash,
        }, {
            threadId: memory.threadId,
            resourceId: memory.resourceId,
            userMessage: config.message,
            hideUserMessageFromTranscript: true,
            isWakeRun: true,
            source: setup?.source ?? integrationType,
            abortSignal,
            access,
            sessionMode: 'existing',
        });
    }
    streamWakeTurn(config, runtime, setup, access, integrationType, messageContext) {
        const { agentId, message, memory, identity, abortSignal } = config;
        return this.streamChatResponse({
            access,
            messageContext,
            agentInstance: runtime.agent,
            toolRegistry: runtime.toolRegistry,
            mcpServerAttributions: runtime.mcpServerAttributions,
            budget: runtime.budget,
            agentId,
            ...(access.ownerId ? { userId: access.ownerId } : {}),
            message,
            memory,
            projectId: runtime.projectId,
            source: setup?.source ?? integrationType,
            chatSurface: setup?.surface,
            telemetry: {
                runType: identity.type === 'draft' ? 'test' : 'production',
                configuration: runtime.telemetryConfiguration,
            },
            abortSignal,
            sandboxPrincipalHash: identity.principalHash,
            hideUserMessageFromTranscript: true,
            isWakeRun: true,
            pauseReport: config.pauseReport,
            sessionMode: 'existing',
            backgroundJobSignal: config.backgroundJobSignal,
        });
    }
};
exports.AgentExecutionOrchestratorService = AgentExecutionOrchestratorService;
exports.AgentExecutionOrchestratorService = AgentExecutionOrchestratorService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_checkpoint_storage_1.N8NCheckpointStorage, agent_execution_service_1.AgentExecutionService, agent_turn_execution_service_1.AgentTurnExecutionService, telemetry_1.Telemetry, agent_runtime_cache_service_1.AgentRuntimeCacheService, integration_message_context_service_1.IntegrationMessageContextService, agent_run_tracing_service_1.AgentRunTracingService, external_hooks_1.ExternalHooks, agent_sandbox_runtime_service_1.AgentSandboxRuntimeService, agent_repository_1.AgentRepository, config_1.AiConfig, agent_chat_execution_service_1.AgentChatExecutionService, agent_background_job_repository_1.AgentBackgroundJobRepository, agent_background_job_service_1.AgentBackgroundJobService, agents_settings_service_1.AgentsSettingsService, agent_skill_refs_service_1.AgentSkillRefsService])
], AgentExecutionOrchestratorService);
//# sourceMappingURL=agent-execution-orchestrator.service.js.map