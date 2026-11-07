"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentChatBridge = void 0;
const agents_1 = require("@n8n/agents");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const agent_chat_attachment_service_1 = require("../agent-chat-attachment.service");
const agent_message_queue_service_1 = require("../agent-message-queue.service");
const agent_conversation_state_service_1 = require("../agent-conversation-state.service");
const agent_sandbox_principal_1 = require("../agent-sandbox-principal");
const agent_resource_repository_1 = require("../repositories/agent-resource.repository");
const agent_memory_scope_1 = require("../utils/agent-memory-scope");
const inbound_attachments_1 = require("../utils/inbound-attachments");
const agent_chat_integration_1 = require("./agent-chat-integration");
const agent_chat_hitl_resume_handler_1 = require("./agent-chat-hitl-resume-handler");
const agent_chat_message_context_1 = require("./agent-chat-message-context");
const agent_chat_stream_consumer_1 = require("./agent-chat-stream-consumer");
const agent_chat_suspension_cards_1 = require("./agent-chat-suspension-cards");
const callback_store_1 = require("./callback-store");
const esm_loader_1 = require("./esm-loader");
const integration_message_context_service_1 = require("./integration-message-context.service");
const discord_operations_1 = require("./platforms/discord-operations");
const types_1 = require("./types");
const channel_rate_limit_1 = require("./channel-rate-limit");
const RESET_SESSION_COMMAND = '/new';
const SESSION_LOCK_KEY_PREFIX = 'agents:chat-session-generation';
const SESSION_GENERATION_SUFFIX_RE = /#\d+$/;
function toMessageAuthor(author) {
    const name = (author.userName || author.fullName || author.userId).replace(/[\[\]\r\n]/g, '');
    return { id: author.userId, name: name || author.userId };
}
function formatPlatformMessageContext(context) {
    return [
        'Telegram metadata for this message follows.',
        '<telegram_message_context>',
        JSON.stringify(context),
        '</telegram_message_context>',
        'Use these values when a tool needs Telegram identifiers.',
    ].join('\n');
}
function isResetCommand(inbound) {
    return inbound.text.toLowerCase() === RESET_SESSION_COMMAND && inbound.attachments.length === 0;
}
function buildModelMessage(labelledText, bridgeExecutionContext) {
    const modelContext = [];
    if (bridgeExecutionContext.historyContext) {
        modelContext.push(bridgeExecutionContext.historyContext);
    }
    if (bridgeExecutionContext.platformMessage) {
        modelContext.push(formatPlatformMessageContext(bridgeExecutionContext.platformMessage));
    }
    modelContext.push(bridgeExecutionContext.platformMessage
        ? `The actual user message follows.\n${labelledText}`
        : labelledText);
    return modelContext.join('\n\n');
}
function errorText(error) {
    const rateLimitMessage = (0, channel_rate_limit_1.rateLimitMessageFromError)(error);
    if (rateLimitMessage !== undefined)
        return `⚠️ ${rateLimitMessage}`;
    if ((0, agents_1.isAttachmentValidationError)(error)) {
        return '⚠️ The model rejected an attachment. Resend your message without attachments, or try a different file.';
    }
    if ((0, is_record_1.isRecord)(error) &&
        typeof error.message === 'string' &&
        error.message.includes('Output blocked by content filtering policy')) {
        return `⚠️ ${error.message}`;
    }
    if (error instanceof n8n_workflow_1.UserError) {
        return `⚠️ This agent is misconfigured: ${error.message} An agent owner has to fix this in n8n.`;
    }
    return '⚠️ Something went wrong while processing your request. Please try again.';
}
class AgentChatBridge {
    constructor(chat, agentId, agentService, componentMapper, logger, n8nProjectId, integration, messageContextStore, attachmentService, discordHttpClient, messageQueue = di_1.Container.get(agent_message_queue_service_1.AgentMessageQueueService)) {
        this.chat = chat;
        this.agentId = agentId;
        this.agentService = agentService;
        this.componentMapper = componentMapper;
        this.logger = logger;
        this.n8nProjectId = n8nProjectId;
        this.integration = integration;
        this.attachmentService = attachmentService;
        this.discordHttpClient = discordHttpClient;
        this.messageQueue = messageQueue;
        this.integrationImpl = di_1.Container.get(agent_chat_integration_1.ChatIntegrationRegistry).get(integration.type);
        this.messageContextBridge = new agent_chat_message_context_1.AgentChatMessageContextBridge(messageContextStore, integration, agentId, logger);
        if (this.integrationImpl?.needsShortCallbackData) {
            this.callbackStore = new callback_store_1.CallbackStore(di_1.Container.get(backend_services_1.CacheService), di_1.Container.get(backend_common_1.LockService), `${agentId}:${integration.type}:${integration.credentialId}`);
        }
        const disableStreaming = this.integrationImpl?.disableStreaming ?? false;
        const actionToolNamePattern = new RegExp(`^${integration.type}(_\\d+)?_action$`);
        this.streamConsumer = new agent_chat_stream_consumer_1.AgentChatStreamConsumer({
            disableStreaming,
            singleStreamedRunPerTurn: this.integrationImpl?.singleStreamedRunPerTurn,
            logger: this.logger,
            postErrorToThread: this.postErrorToThread.bind(this),
            handleSuspension: this.handleSuspension.bind(this),
            handleMessage: this.handleMessage.bind(this),
            isIntegrationActionTool: (toolName) => actionToolNamePattern.test(toolName),
        });
        this.hitlResumeHandler = new agent_chat_hitl_resume_handler_1.AgentChatHitlResumeHandler({
            agentId,
            projectId: n8nProjectId,
            integration,
            agentService,
            logger,
            callbackStore: this.callbackStore,
            deleteActionMessageBeforeResume: this.integrationImpl?.deleteActionMessageBeforeResume ?? true,
            formatActionDecisionMessage: (params) => this.integrationImpl?.formatActionDecisionMessage?.(params),
            settleActionMessage: this.integrationImpl?.settleActionMessage?.bind(this.integrationImpl),
            resolvePlatformThreadId: this.resolvePlatformThreadId.bind(this),
            toAgentThreadId: this.toAgentThreadId.bind(this),
            getPlatformAgentContext: this.getPlatformAgentContext.bind(this),
            messageContextBridge: this.messageContextBridge,
            streamConsumer: this.streamConsumer,
            createResumeExecutionContext: async (thread) => {
                const params = {
                    chat: this.chat,
                    thread,
                    logger: this.logger,
                    agentId: this.agentId,
                    integration: this.integration,
                };
                const resumeExecutionContext = await this.integrationImpl?.createResumeExecutionContext?.(params);
                if (resumeExecutionContext)
                    return resumeExecutionContext;
                return {};
            },
        });
        this.registerHandlers();
    }
    static create(chat, agentId, agentService, componentMapper, logger, n8nProjectId, integration) {
        const agentExecutor = {
            getSessionMode: async (threadId) => await agentService.getSessionMode(threadId),
            async *executeForChatPublished({ memory, agentId: aid, message, modelMessage, author, attachments, integrationType, sandboxPrincipalHash, messageContext, contextConversation, sessionMode, admittedExecution, abortSignal, }) {
                yield* agentService.executeForChatPublished({
                    agentId: aid,
                    projectId: n8nProjectId,
                    message,
                    modelMessage,
                    author,
                    attachments,
                    memory: {
                        threadId: memory.threadId.id,
                        resourceId: memory.resourceId,
                        ...(memory.resourceId !== undefined && {
                            resourceId: memory.resourceId,
                        }),
                    },
                    integrationType,
                    sandboxPrincipalHash,
                    messageContext,
                    contextConversation,
                    sessionMode,
                    admittedExecution,
                    abortSignal,
                });
            },
            async *resumeForChat(config) {
                yield* agentService.resumeForChat(config);
            },
            async findOpenSuspension({ agentId: aid, threadId }) {
                const { suspendedCheckpoint } = await di_1.Container.get(agent_conversation_state_service_1.AgentConversationStateService).inspect(aid, threadId);
                if (!suspendedCheckpoint)
                    return null;
                const suspended = Object.values(suspendedCheckpoint.pendingToolCalls ?? {}).find((toolCall) => toolCall.suspended);
                return suspended ? { suspendPayload: suspended.suspendPayload } : null;
            },
            async isResumable({ agentId: aid, runId }) {
                return await di_1.Container.get(agent_conversation_state_service_1.AgentConversationStateService).isResumable(aid, runId);
            },
        };
        return new AgentChatBridge(chat, agentId, agentExecutor, componentMapper, logger, n8nProjectId, integration, di_1.Container.get(integration_message_context_service_1.IntegrationMessageContextService), di_1.Container.get(agent_chat_attachment_service_1.AgentChatAttachmentService), integration.type === 'discord'
            ? di_1.Container.get(backend_network_1.OutboundHttp).requests({
                useDefaultSsrfPolicy: 'unsafe',
            })
            : undefined);
    }
    registerHandlers() {
        this.chat.onNewMention(async (thread, message) => {
            try {
                if (!this.canUserAccess(message.author))
                    return;
                const anchoredThread = this.anchorInboundThread(thread, message);
                const shouldSubscribe = this.integrationImpl?.shouldSubscribeToNewMention?.({ thread, message }) ?? true;
                if (shouldSubscribe) {
                    await anchoredThread.subscribe();
                }
                await this.handleInboundMessage(anchoredThread, message, { isNewMention: true });
            }
            catch (error) {
                await this.postErrorToThread(thread, error);
            }
        });
        this.chat.onSubscribedMessage(async (thread, message) => {
            await this.handleFollowUp(thread, message, { inSubscribedThread: true });
        });
        if (this.integrationImpl?.shouldHandleUnmentionedMessage) {
            this.chat.onNewMessage(/[\s\S]*/, async (thread, message) => {
                await this.handleFollowUp(thread, message, { inSubscribedThread: false });
            });
        }
        this.chat.onAction(async (event) => {
            try {
                if (!this.canUserAccess(event.user))
                    return;
                await this.hitlResumeHandler.handleAction(event);
            }
            catch (error) {
                await this.postErrorToThread(event.thread, error);
            }
        });
        this.chat.onSlashCommand(RESET_SESSION_COMMAND, async (event) => {
            const thread = this.chat.thread(event.channel.id);
            try {
                if (!this.canUserAccess(event.user))
                    return;
                await this.resetSession(thread);
            }
            catch (error) {
                await this.postErrorToThread(thread, error);
            }
        });
    }
    async handleFollowUp(thread, message, { inSubscribedThread }) {
        const unaddressed = !message.isMention && this.integrationImpl?.shouldHandleUnmentionedMessage !== undefined;
        try {
            if (!this.canUserAccess(message.author))
                return;
            if (unaddressed &&
                !this.integrationImpl?.shouldHandleUnmentionedMessage?.({
                    thread,
                    message,
                    integration: this.integration,
                })) {
                return;
            }
            const anchoredThread = this.anchorInboundThread(thread, message);
            await this.handleInboundMessage(anchoredThread, message, {
                isNewMention: false,
                inSubscribedThread,
                allowReset: !unaddressed,
            });
        }
        catch (error) {
            if (!unaddressed) {
                await this.postErrorToThread(thread, error);
                return;
            }
            this.logger.warn('Failed to handle an un-mentioned message', {
                agentId: this.agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    canUserAccess(author) {
        return this.integrationImpl?.isUserAllowed?.(author, this.integration) ?? true;
    }
    anchorInboundThread(thread, message) {
        const anchored = this.integrationImpl?.messageThreadId?.({ id: message.id, threadId: thread.id, raw: message.raw }, { inbound: true });
        return anchored ? this.chat.thread(anchored) : thread;
    }
    async resumeInAgentThread(agentThreadId, runId, toolCallId, resumeData, context) {
        const target = context?.messageContext?.replyTarget ?? context?.messageContext?.target;
        if (context && !target?.threadId && !context.allowLegacyThreadId) {
            this.logger.warn('Agent resume has no reply destination', { agentId: this.agentId, runId });
            return;
        }
        const prefix = `${this.agentId}:`;
        const withoutAgentPrefix = agentThreadId.startsWith(prefix)
            ? agentThreadId.slice(prefix.length)
            : agentThreadId;
        const platformThreadId = withoutAgentPrefix.replace(SESSION_GENERATION_SUFFIX_RE, '');
        const sdkThreadId = target?.threadId ??
            this.integrationImpl?.formatThreadId?.toSdk(platformThreadId) ??
            platformThreadId;
        await this.hitlResumeHandler.executeResume(this.chat.thread(sdkThreadId), runId, toolCallId, resumeData, {
            ...(context ? { messageContext: context.messageContext } : {}),
            ...(context?.messageContext?.interactingUserId
                ? { cardRecipientId: context.messageContext.interactingUserId }
                : {}),
        });
    }
    async deliverWakeResponse(threadId, chunks, cardRecipientId) {
        await this.streamConsumer.consume((async function* () {
            yield* chunks;
        })(), this.chat.thread(threadId), {
            throwOnDeliveryError: true,
            ...(cardRecipientId ? { actingUserId: cardRecipientId } : {}),
        });
    }
    async deliverBackgroundApproval(threadId, { jobId, title, token, toolCall, }) {
        const payload = (0, agent_chat_suspension_cards_1.buildSuspendCardPayload)(toolCall.suspendPayload);
        if (!payload)
            throw new n8n_workflow_1.UserError('This background approval cannot be displayed');
        const card = await this.componentMapper.toCard({ ...payload, title: `${title}: Approval required` }, toolCall.runId, toolCall.toolCallId, toolCall.resumeSchema, async (_actionId, value) => {
            const response = agents_1.APPROVAL_RESUME_SCHEMA.safeParse(JSON.parse(value));
            if (!response.success) {
                throw new n8n_workflow_1.UserError('Invalid background approval response');
            }
            let decision = response.data.approved ? '1' : '0';
            if (response.data.approved && response.data.scope === 'session')
                decision = 's';
            return { id: `bg:${jobId}:${token}:${decision}`, value: '' };
        }, this.integration.type);
        await this.chat.thread(threadId).post({ card });
    }
    resolvePlatformThreadId(thread) {
        return this.integrationImpl?.formatThreadId?.fromSdk(thread) ?? thread.id;
    }
    toAgentThreadId(platformThreadId) {
        return (0, types_1.toInternalThreadId)(`${this.agentId}:${platformThreadId}`);
    }
    baseThreadId(thread) {
        return this.toAgentThreadId(this.resolvePlatformThreadId(thread)).id;
    }
    async resolveActiveThreadId(thread) {
        const baseId = this.baseThreadId(thread);
        const configuredIdleTimeoutMinutes = 'settings' in this.integration
            ? this.integration.settings?.sessionIdleTimeoutMinutes
            : undefined;
        const idleTimeoutMinutes = configuredIdleTimeoutMinutes !== undefined
            ? configuredIdleTimeoutMinutes
            : (this.integrationImpl?.defaultSessionIdleTimeoutMinutes ?? null);
        const id = await this.withSessionLock(baseId, async () => await this.computeGeneration(baseId, false, idleTimeoutMinutes));
        return (0, types_1.toInternalThreadId)(id);
    }
    async resetSession(thread) {
        const baseId = this.baseThreadId(thread);
        await this.withSessionLock(baseId, async () => {
            await this.messageContextBridge.unbindSession(baseId);
            await this.computeGeneration(baseId, true, null);
        });
        await thread.post('🔄 Started a new session.');
    }
    async withSessionLock(baseId, fn) {
        return await di_1.Container.get(backend_common_1.LockService).withLease(backend_common_1.LockNamespace.KNOWN_LOCKS, this.sessionLockKey(baseId), fn);
    }
    async computeGeneration(baseId, forceRotate, idleTimeoutMinutes) {
        const resources = di_1.Container.get(agent_resource_repository_1.AgentResourceRepository);
        const state = await resources.findChatSessionGeneration(baseId);
        if (!forceRotate && !state && !idleTimeoutMinutes)
            return baseId;
        const now = Date.now();
        const currentGeneration = state?.generation ?? 0;
        const idleExpired = !forceRotate &&
            idleTimeoutMinutes !== null &&
            state !== null &&
            now - state.lastActivityAt > idleTimeoutMinutes * 60_000;
        const currentId = currentGeneration === 0 ? baseId : `${baseId}#${currentGeneration}`;
        const rotate = forceRotate || (idleExpired && !(await this.hasOpenSuspension(currentId)));
        const generation = rotate ? currentGeneration + 1 : currentGeneration;
        if (rotate || idleTimeoutMinutes !== null) {
            await resources.saveChatSessionGeneration(baseId, { generation, lastActivityAt: now });
        }
        return generation === 0 ? baseId : `${baseId}#${generation}`;
    }
    async hasOpenSuspension(threadId) {
        const open = await this.agentService.findOpenSuspension?.({ agentId: this.agentId, threadId });
        return open !== null && open !== undefined;
    }
    sessionLockKey(baseId) {
        return `${SESSION_LOCK_KEY_PREFIX}:${baseId}`;
    }
    getShortenCallback(metadata) {
        if (!this.callbackStore)
            return undefined;
        const store = this.callbackStore;
        return async (actionId, value, label) => {
            const key = await store.store(actionId, value, {
                ...metadata,
                ...(label !== undefined ? { label } : {}),
            });
            return { id: key, value: '' };
        };
    }
    async handleInboundMessage(thread, message, options) {
        const inbound = await this.readInboundMessage(thread, message);
        if (!inbound)
            return;
        if (isResetCommand(inbound)) {
            if (options.allowReset !== false)
                await this.resetSession(thread);
            return;
        }
        await this.runTurn(thread, message, inbound, options);
    }
    async readInboundMessage(thread, message) {
        const platformAgentContext = this.getPlatformAgentContext();
        const text = this.prepareInboundText(await this.getInboundText(message), platformAgentContext).trim();
        const attachments = [
            ...(message.attachments ?? []),
            ...(await this.fetchInboundAttachments(thread, message)),
        ];
        if (!text && attachments.length === 0)
            return null;
        return { text, attachments };
    }
    async fetchInboundAttachments(thread, message) {
        try {
            return (await this.integrationImpl?.fetchInboundAttachments?.({ thread, message })) ?? [];
        }
        catch (error) {
            this.logger.warn('[AgentChatBridge] Failed to look up message attachments', {
                agentId: this.agentId,
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    async runTurn(thread, message, inbound, options) {
        const platformAgentContext = this.getPlatformAgentContext();
        const session = await this.resolveTurnSession(thread, message);
        const { attachments, attachmentNotes } = await this.storeInboundAttachments(inbound.attachments, session.memory.threadId.id, session.memory.resourceId);
        await this.enqueueTurn({
            thread,
            message,
            text: inbound.text,
            session,
            attachments,
            attachmentNotes,
            isNewMention: options.isNewMention,
            inSubscribedThread: options.inSubscribedThread === true,
            platformAgentContext,
        });
    }
    async resolveTurnSession(thread, message) {
        const activeThreadId = await this.resolveActiveThreadId(thread);
        const resourceId = (0, agent_memory_scope_1.integrationMemoryResourceId)(this.integration.type, message.author.userId);
        const sessionOrigin = await this.messageContextBridge.resolveSession(this.baseThreadId(thread));
        if (sessionOrigin) {
            return {
                activeThreadId,
                memory: {
                    threadId: (0, types_1.toInternalThreadId)(sessionOrigin.threadId),
                    resourceId: sessionOrigin.resourceId,
                },
                sessionMode: 'existing',
            };
        }
        return {
            activeThreadId,
            memory: { threadId: activeThreadId, resourceId },
            sessionMode: (await this.agentService.getSessionMode?.(activeThreadId.id)) ?? 'new',
        };
    }
    async enqueueTurn({ thread, message, text, session, attachments, attachmentNotes, isNewMention, inSubscribedThread, platformAgentContext, }) {
        const replyExpectation = this.integrationImpl?.getReplyExpectation?.({
            message,
            isNewMention,
            platformAgentContext,
        }) ?? 'required';
        let accepted = false;
        try {
            const [context, subject] = await Promise.all([
                this.resolveBridgeExecutionContext(thread, message, platformAgentContext, {
                    isNewMention,
                    inSubscribedThread,
                    replyExpectation,
                }),
                this.messageContextBridge.resolveSubject(message),
            ]);
            const messageContext = this.messageContextBridge.capture(thread, {
                messageId: message.id,
                interactingUserId: message.author.userId,
                ...context.platformAgentContext,
                ...(context.platformMessage ? { platformMessage: context.platformMessage } : {}),
                subject,
                replyExpectation,
            });
            const author = toMessageAuthor(message.author);
            const textWithNotes = [text, ...attachmentNotes].filter(Boolean).join('\n');
            const { userId, userName, fullName, isBot, isMe } = message.author;
            const result = await this.messageQueue.enqueue({
                agentId: this.agentId,
                projectId: this.n8nProjectId,
                threadId: session.memory.threadId.id,
                sessionMode: session.sessionMode,
                source: this.integration.type,
                payload: {
                    kind: 'integration',
                    message: textWithNotes,
                    modelMessage: buildModelMessage(`[${author.name} (${author.id})]: ${textWithNotes}`, context),
                    author,
                    sender: { userId, userName, fullName, isBot, isMe },
                    attachments: attachments.length ? attachments : undefined,
                    resourceId: session.memory.resourceId,
                    credentialId: this.integration.credentialId,
                    platformThreadId: thread.id,
                    messageContext,
                    contextConversation: { threadId: session.activeThreadId.id, resourceId: userId },
                    forceBuffered: context.forceBuffered,
                    slackThreadContext: context.slackThreadContext,
                },
            });
            accepted = result.status === 'accepted';
        }
        finally {
            if (!accepted) {
                await this.attachmentService?.deleteByIds(attachments.map((ref) => ref.id)).catch(() => { });
            }
        }
    }
    async consumeQueuedMessage(payload, threadId, admittedExecution, abortSignal, integration) {
        const thread = await this.restoreQueuedReplyThread(payload);
        const replyOptional = payload.messageContext.replyExpectation === 'optional';
        let statusHandle;
        try {
            if (this.integrationImpl?.isUserAllowed?.(payload.sender, integration) === false) {
                throw new n8n_workflow_1.UserError('You can no longer use this integration');
            }
            abortSignal.throwIfAborted();
            if (!replyOptional) {
                const context = await this.integrationImpl?.createResumeExecutionContext?.({
                    chat: this.chat,
                    thread,
                    logger: this.logger,
                    agentId: this.agentId,
                    slackThreadContext: payload.slackThreadContext,
                    integration,
                });
                statusHandle = (0, agent_chat_integration_1.onceStatusHandle)(context?.statusHandle);
            }
            const stream = this.agentService.executeForChatPublished({
                agentId: this.agentId,
                projectId: this.n8nProjectId,
                message: payload.message,
                modelMessage: payload.modelMessage,
                author: payload.author,
                attachments: payload.attachments,
                messageContext: payload.messageContext,
                contextConversation: payload.contextConversation,
                memory: { threadId: (0, types_1.toInternalThreadId)(threadId), resourceId: payload.resourceId },
                sessionMode: 'existing',
                integrationType: this.integration.type,
                admittedExecution,
                abortSignal,
                sandboxPrincipalHash: (0, agent_sandbox_principal_1.hashAgentSandboxPrincipal)({
                    type: 'integration-thread',
                    connectionId: payload.credentialId,
                    platform: this.integration.type,
                    platformThreadId: this.resolvePlatformThreadId(thread),
                }),
            });
            await this.streamConsumer.consume(stream, thread, {
                forceBuffered: payload.forceBuffered,
                statusHandle,
                actingUserId: payload.sender.userId,
                quietErrors: replyOptional,
            });
        }
        catch (error) {
            if (replyOptional) {
                this.logger.warn('[AgentChatBridge] Failed a turn whose reply was optional', {
                    agentId: this.agentId,
                    threadId: thread.id,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            else {
                await this.postErrorToThread(thread, error);
            }
            throw error;
        }
        finally {
            await statusHandle?.clearBeforeResponse();
        }
    }
    async restoreQueuedReplyThread(payload) {
        const thread = this.chat.thread(payload.platformThreadId);
        const recipientTeamId = payload.slackThreadContext?.recipientTeamId;
        if (payload.forceBuffered || !recipientTeamId)
            return thread;
        const { Message, ThreadImpl } = await (0, esm_loader_1.loadChatSdk)();
        return new ThreadImpl({
            id: thread.id,
            channelId: thread.channelId,
            channelVisibility: thread.channelVisibility,
            isDM: thread.isDM,
            adapter: thread.adapter,
            stateAdapter: this.chat.getState(),
            currentMessage: new Message({
                id: payload.messageContext.messageId ?? '',
                threadId: thread.id,
                text: payload.message,
                formatted: { type: 'root', children: [] },
                author: payload.sender,
                metadata: { dateSent: new Date(payload.messageContext.updatedAt), edited: false },
                attachments: [],
                raw: { team_id: recipientTeamId },
            }),
        });
    }
    async storeInboundAttachments(inboundAttachments, threadId, resourceId) {
        const attachments = [];
        const attachmentNotes = [];
        if (!this.attachmentService || inboundAttachments.length === 0) {
            return { attachments, attachmentNotes };
        }
        if (this.integrationImpl?.shouldDownloadAttachments?.(this.integration) === false) {
            for (const attachment of inboundAttachments) {
                attachmentNotes.push(`[Attachment "${attachment.name ?? 'file'}" was not downloaded: media downloads are turned off for this channel]`);
            }
            return { attachments, attachmentNotes };
        }
        const skipped = inboundAttachments.slice(api_types_1.MAX_AGENT_CHAT_ATTACHMENTS_PER_MESSAGE);
        for (const attachment of skipped) {
            attachmentNotes.push(`[Attachment "${attachment.name ?? 'file'}" was not processed: too many attachments in one message]`);
        }
        for (const attachment of inboundAttachments.slice(0, api_types_1.MAX_AGENT_CHAT_ATTACHMENTS_PER_MESSAGE)) {
            const name = (attachment.name ?? 'attachment').slice(0, api_types_1.MAX_AGENT_CHAT_ATTACHMENT_FILENAME_LENGTH);
            try {
                if (attachment.size !== undefined &&
                    attachment.size > api_types_1.MAX_AGENT_CHAT_ATTACHMENT_SIZE_BYTES) {
                    attachmentNotes.push(`[Attachment "${name}" was skipped: larger than ${api_types_1.MAX_AGENT_CHAT_ATTACHMENT_SIZE_MB} MB]`);
                    continue;
                }
                const data = await this.fetchAttachmentData(attachment);
                if (!data || data.byteLength === 0) {
                    attachmentNotes.push(`[Attachment "${name}" could not be downloaded]`);
                    continue;
                }
                if (data.byteLength > api_types_1.MAX_AGENT_CHAT_ATTACHMENT_SIZE_BYTES) {
                    attachmentNotes.push(`[Attachment "${name}" was skipped: larger than ${api_types_1.MAX_AGENT_CHAT_ATTACHMENT_SIZE_MB} MB]`);
                    continue;
                }
                const mimeType = await (0, inbound_attachments_1.resolveInboundMimeType)(attachment.mimeType, data);
                const stored = await this.attachmentService.storeInbound({
                    agentId: this.agentId,
                    projectId: this.n8nProjectId,
                    threadId,
                    resourceId,
                    source: this.integration.type,
                    fileName: name,
                    mimeType,
                    data,
                });
                attachments.push({
                    id: stored.id,
                    fileName: stored.fileName,
                    mimeType: stored.mimeType,
                    sizeBytes: stored.fileSizeBytes,
                });
            }
            catch (error) {
                this.logger.warn('[AgentChatBridge] Failed to ingest attachment', {
                    agentId: this.agentId,
                    threadId,
                    error: error instanceof Error ? error.message : String(error),
                });
                attachmentNotes.push(error instanceof agent_chat_integration_1.InboundAttachmentAccessError
                    ? `[Attachment "${name}" could not be read: ${error.message}]`
                    : `[Attachment "${name}" could not be processed]`);
            }
        }
        return { attachments, attachmentNotes };
    }
    async fetchAttachmentData(attachment) {
        if (attachment.fetchData)
            return await attachment.fetchData();
        if (Buffer.isBuffer(attachment.data))
            return attachment.data;
        if (attachment.data)
            return Buffer.from(await attachment.data.arrayBuffer());
        if (this.integration.type === 'discord' && attachment.url && this.discordHttpClient) {
            return await (0, discord_operations_1.downloadDiscordAttachment)(attachment.url, this.discordHttpClient);
        }
        return null;
    }
    async resolveBridgeExecutionContext(thread, message, platformAgentContext, route) {
        return ((await this.integrationImpl?.createBridgeExecutionContext?.({
            chat: this.chat,
            thread,
            message,
            integration: this.integration,
            logger: this.logger,
            agentId: this.agentId,
            startStatus: false,
            ...route,
        })) ?? { platformAgentContext });
    }
    async handleSuspension(chunk, thread, actingUserId) {
        const { runId, toolCallId, suspendPayload } = chunk;
        if (!runId || !toolCallId) {
            this.logger.warn('[AgentChatBridge] Suspended chunk missing runId or toolCallId');
            return 'failed';
        }
        const cardPayload = (0, agent_chat_suspension_cards_1.buildSuspendCardPayload)(suspendPayload);
        if (!cardPayload)
            return 'skipped';
        const callbackMetadata = {
            groupId: JSON.stringify([runId, toolCallId]),
        };
        try {
            const card = await this.componentMapper.toCard(cardPayload, runId, toolCallId, chunk.resumeSchema, this.getShortenCallback(callbackMetadata), this.integration.type);
            await this.deliverSuspensionCard(thread, card, actingUserId);
            return 'posted';
        }
        catch (error) {
            this.logger.error('[AgentChatBridge] Failed to post suspension card', {
                agentId: this.agentId,
                runId,
                toolCallId,
                error: error instanceof Error ? error.message : String(error),
            });
            return 'failed';
        }
    }
    async deliverSuspensionCard(thread, card, actingUserId) {
        if (this.integrationImpl?.targetSuspensionCardAtActingUser && actingUserId) {
            await (0, agent_chat_integration_1.postToUserOrThread)(thread, actingUserId, { card });
            return;
        }
        await thread.post({ card });
    }
    async handleMessage(chunk, thread, throwOnDeliveryError = false) {
        const agentMessage = chunk.message;
        if (!('content' in agentMessage) || !Array.isArray(agentMessage.content))
            return false;
        const textParts = agentMessage.content
            .filter((part) => part.type === 'text' && 'text' in part)
            .map((part) => part.text);
        const textToPost = textParts.join('');
        if (!textToPost.trim())
            return false;
        try {
            await thread.post(textToPost);
            return true;
        }
        catch (error) {
            this.logger.error('[AgentChatBridge] Failed to post message chunk', {
                agentId: this.agentId,
                threadId: thread.id,
                error: error instanceof Error ? error.message : String(error),
            });
            if (throwOnDeliveryError)
                throw error;
            return false;
        }
    }
    getPlatformAgentContext() {
        return this.integrationImpl?.getPlatformAgentContext?.(this.chat) ?? {};
    }
    async getInboundText(message) {
        if (!message.formatted)
            return message.text;
        const { isLinkNode, text, toPlainText, walkAst } = await (0, esm_loader_1.loadChatSdk)();
        if (toPlainText(message.formatted) !== message.text)
            return message.text;
        const formatted = walkAst(structuredClone(message.formatted), (node) => {
            if (!isLinkNode(node))
                return node;
            const label = toPlainText({ type: 'root', children: [node] });
            if ([label, `http://${label}`, `mailto:${label}`].includes(node.url))
                return node;
            return text(`[${label}](${node.url})`);
        });
        return toPlainText(formatted);
    }
    prepareInboundText(text, context) {
        const trimmed = text?.trim() ?? '';
        return this.integrationImpl?.prepareInboundText?.(trimmed, context) ?? trimmed;
    }
    async postErrorToThread(thread, error, throwOnDeliveryError = false) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        this.logger.error('[AgentChatBridge] Error in handler', {
            agentId: this.agentId,
            threadId: thread?.id,
            error: message,
        });
        try {
            if (!thread) {
                this.logger.warn("[AgentChatBridge] Couldn't post error message because thread is not set", {
                    agentId: this.agentId,
                    error: message,
                });
                return;
            }
            await thread.post(errorText(error));
        }
        catch (postError) {
            this.logger.error('[AgentChatBridge] Failed to post error message', {
                agentId: this.agentId,
                error: postError instanceof Error ? postError.message : String(postError),
            });
            if (throwOnDeliveryError)
                throw postError;
        }
    }
}
exports.AgentChatBridge = AgentChatBridge;
//# sourceMappingURL=agent-chat-bridge.js.map