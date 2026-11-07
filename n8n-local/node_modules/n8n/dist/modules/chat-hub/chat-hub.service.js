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
exports.ChatHubService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const chat_hub_1 = require("@n8n/chat-hub");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const chat_execution_manager_1 = require("../../chat/chat-execution-manager");
const errors_1 = require("@n8n/errors");
const execution_persistence_1 = require("../../executions/execution-persistence");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const chat_hub_agent_service_1 = require("./chat-hub-agent.service");
const chat_hub_execution_service_1 = require("./chat-hub-execution.service");
const chat_hub_title_service_1 = require("./chat-hub-title.service");
const chat_hub_tool_service_1 = require("./chat-hub-tool.service");
const chat_hub_workflow_service_1 = require("./chat-hub-workflow.service");
const chat_hub_attachment_service_1 = require("./chat-hub.attachment.service");
const chat_hub_models_service_1 = require("./chat-hub.models.service");
const chat_message_repository_1 = require("./chat-message.repository");
const chat_session_repository_1 = require("./chat-session.repository");
const chat_stream_service_1 = require("./chat-stream.service");
let ChatHubService = class ChatHubService {
    constructor(logger, errorReporter, executionPersistence, workflowFinderService, sessionRepository, messageRepository, chatHubAgentService, chatHubModelsService, chatHubAttachmentService, chatStreamService, chatHubExecutionService, chatHubTitleService, chatHubToolService, chatHubWorkflowService, globalConfig, executionManager) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.executionPersistence = executionPersistence;
        this.workflowFinderService = workflowFinderService;
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.chatHubAgentService = chatHubAgentService;
        this.chatHubModelsService = chatHubModelsService;
        this.chatHubAttachmentService = chatHubAttachmentService;
        this.chatStreamService = chatStreamService;
        this.chatHubExecutionService = chatHubExecutionService;
        this.chatHubTitleService = chatHubTitleService;
        this.chatHubToolService = chatHubToolService;
        this.chatHubWorkflowService = chatHubWorkflowService;
        this.globalConfig = globalConfig;
        this.executionManager = executionManager;
        this.logger = this.logger.scoped('chat-hub');
    }
    pickCredentialId(provider, credentials) {
        if (provider === 'n8n' || provider === 'custom-agent') {
            return null;
        }
        return credentials[api_types_1.PROVIDER_CREDENTIAL_TYPE_MAP[provider]]?.id ?? null;
    }
    async ensurePreviousMessage(previousMessageId, sessionId, trx) {
        if (!previousMessageId) {
            return;
        }
        const previousMessage = await this.messageRepository.getOneById(previousMessageId, sessionId, [], trx);
        if (!previousMessage) {
            throw new errors_1.BadRequestError('The previous message does not exist in the session');
        }
        return previousMessage;
    }
    async tryResumeWaitingExecution(opts) {
        const { workflow, previousMessage, message, sessionId, user, messageId, model } = opts;
        if (model.provider !== 'n8n' ||
            workflow.responseMode !== 'responseNodes' ||
            previousMessage?.status !== 'waiting' ||
            !previousMessage?.executionId) {
            return false;
        }
        const execution = await this.executionPersistence.findSingleExecution(previousMessage.executionId.toString(), {
            includeData: true,
            unflattenData: true,
        });
        if (!execution) {
            throw new n8n_workflow_1.OperationalError('Chat session has expired.');
        }
        if (!this.executionManager.canResumeOverChat(execution)) {
            this.logger.warn(`Refused chat-hub resume for execution ${execution.id}: suspended node is not resumable over chat`);
            throw new errors_1.BadRequestError('This conversation is waiting for a response that cannot be provided from chat.');
        }
        this.logger.debug(`Resuming execution ${execution.id} from waiting state for session ${sessionId}`);
        await this.messageRepository.updateChatMessage(previousMessage.id, {
            status: 'success',
        });
        void this.chatHubExecutionService.resumeChatExecution(execution, message, sessionId, user, messageId, model, workflow.responseMode);
        return true;
    }
    async stopGeneration(user, sessionId, messageId) {
        await this.ensureConversation(user.id, sessionId);
        const message = await this.getChatMessage(sessionId, messageId, [
            'execution',
            'execution.workflow',
        ]);
        if (message.type !== 'ai') {
            throw new errors_1.BadRequestError('Can only stop AI messages');
        }
        if (!message.executionId || !message.execution) {
            throw new errors_1.BadRequestError('Message is not associated with a workflow execution');
        }
        if (message.status !== 'running') {
            throw new errors_1.BadRequestError('Can only stop messages that are currently running');
        }
        await this.chatHubExecutionService.stop(message.execution.id, message.execution.workflowId);
        await this.messageRepository.updateChatMessage(messageId, { status: 'cancelled' });
    }
    getModelCredential(model, credentials) {
        const credentialId = model.provider !== 'n8n' ? this.pickCredentialId(model.provider, credentials) : null;
        return credentialId;
    }
    async getChatSession(user, sessionId, trx) {
        return await this.sessionRepository.getOneById(sessionId, user.id, trx);
    }
    async createChatSession(user, sessionId, model, credentialId, manual, agentName, trx) {
        await this.ensureValidModel(user, model, manual, trx);
        const session = await this.sessionRepository.createChatSession({
            id: sessionId,
            ownerId: user.id,
            title: 'New Chat',
            lastMessageAt: new Date(),
            agentName,
            credentialId,
            type: manual ? 'manual' : 'production',
            ...model,
        }, trx);
        const enabledTools = await this.chatHubToolService.getEnabledTools(user.id, trx);
        const toolIds = enabledTools.map((t) => t.id);
        if (toolIds.length > 0) {
            await this.chatHubToolService.setSessionTools(sessionId, user.id, toolIds, trx);
        }
        return session;
    }
    async getChatMessage(sessionId, messageId, relations = [], trx) {
        const message = await this.messageRepository.getOneById(messageId, sessionId, relations, trx);
        if (!message) {
            throw new errors_1.NotFoundError('Chat message not found');
        }
        return message;
    }
    async getConversations(userId, limit, cursor, type) {
        const sessions = await this.sessionRepository.getManyByUserId(userId, limit + 1, cursor, type);
        const hasMore = sessions.length > limit;
        const data = hasMore ? sessions.slice(0, limit) : sessions;
        const nextCursor = hasMore ? data[data.length - 1].id : null;
        return {
            data: data.map((session) => this.convertSessionEntityToDto(session)),
            nextCursor,
            hasMore,
        };
    }
    async ensureConversation(userId, sessionId, trx) {
        const sessionExists = await this.sessionRepository.existsById(sessionId, userId, trx);
        if (!sessionExists) {
            throw new errors_1.NotFoundError('Chat session not found');
        }
    }
    async getConversation(userId, sessionId) {
        const session = await this.sessionRepository.getOneById(sessionId, userId);
        if (!session) {
            throw new errors_1.NotFoundError('Chat session not found');
        }
        const messages = session.messages ?? [];
        const toolIds = await this.chatHubToolService.getToolIdsForSession(sessionId);
        return {
            session: this.convertSessionEntityToDto(session, toolIds),
            conversation: {
                messages: Object.fromEntries(messages.map((m) => [m.id, this.convertMessageToDto(m)])),
            },
        };
    }
    buildMessageHistory(messages, lastMessageId) {
        if (!lastMessageId)
            return [];
        const visited = new Set();
        const historyIds = [];
        let current = lastMessageId;
        while (current && !visited.has(current)) {
            historyIds.unshift(current);
            visited.add(current);
            current = messages[current]?.previousMessageId ?? null;
        }
        const history = historyIds.flatMap((id) => messages[id] ?? []);
        return history;
    }
    async deleteAllSessions() {
        await this.chatHubAttachmentService.deleteAll();
        const result = await this.sessionRepository.deleteAll();
        return result;
    }
    async updateSession(user, sessionId, updates) {
        await this.ensureConversation(user.id, sessionId);
        const sessionUpdates = {};
        if (updates.agent) {
            const model = updates.agent.model;
            await this.ensureValidModel(user, model, false);
            sessionUpdates.agentName = updates.agent.name;
            sessionUpdates.provider = model.provider;
            sessionUpdates.model = null;
            sessionUpdates.credentialId = null;
            sessionUpdates.agentId = null;
            sessionUpdates.workflowId = null;
            if (updates.agent.model.provider === 'n8n') {
                sessionUpdates.workflowId = updates.agent.model.workflowId;
            }
            else if (updates.agent.model.provider === 'custom-agent') {
                sessionUpdates.agentId = updates.agent.model.agentId;
            }
            else {
                sessionUpdates.model = updates.agent.model.model;
            }
        }
        if (updates.title !== undefined)
            sessionUpdates.title = updates.title;
        if (updates.credentialId !== undefined)
            sessionUpdates.credentialId = updates.credentialId;
        const { toolIds } = updates;
        await this.sessionRepository.runInTransaction({}, async (trx) => {
            if (toolIds !== undefined) {
                await this.chatHubToolService.setSessionTools(sessionId, user.id, toolIds, trx);
            }
            await this.sessionRepository.updateChatSession(sessionId, sessionUpdates, trx);
        });
    }
    async deleteSession(userId, sessionId) {
        await this.messageRepository.manager.transaction(async (trx) => {
            await this.ensureConversation(userId, sessionId, trx);
            await this.chatHubAttachmentService.deleteAllBySessionId(sessionId, trx);
            await this.sessionRepository.deleteChatHubSession(sessionId, trx);
        });
    }
    async ensureValidModel(user, model, manual, trx) {
        if (model.provider === 'custom-agent') {
            const agent = await this.chatHubAgentService.getAgentById(model.agentId, user.id, trx);
            if (!agent) {
                throw new errors_1.BadRequestError('Agent not found for chat session initialization');
            }
        }
        if (model.provider === 'n8n') {
            const workflowEntity = await this.workflowFinderService.findWorkflowForUser(model.workflowId, user, ['workflow:execute-chat'], {
                includeTags: false,
                includeParentFolder: false,
                includeActiveVersion: manual ? false : true,
                em: trx,
            });
            if (!workflowEntity) {
                throw new errors_1.BadRequestError('Workflow not found for chat session initialization');
            }
            const nodes = manual ? workflowEntity.nodes : workflowEntity.activeVersion?.nodes;
            if (!nodes) {
                throw new errors_1.BadRequestError('Workflow not found for chat session initialization');
            }
            const chatTrigger = nodes.find((node) => node.type === n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE);
            if (!chatTrigger) {
                throw new errors_1.BadRequestError('Chat trigger not found in workflow for chat session initialization');
            }
        }
    }
    async sendHumanMessage(user, payload, executionMetadata) {
        const { sessionId, messageId, message, model, credentials, previousMessageId, attachments, timeZone, } = payload;
        const tz = timeZone ?? this.globalConfig.generic.timezone;
        const credentialId = this.getModelCredential(model, credentials);
        let processedAttachments = [];
        let workflow;
        let previousMessage;
        try {
            const result = await this.messageRepository.runInTransaction({}, async (trx, ctx) => {
                let session = await this.getChatSession(user, sessionId, trx);
                const isNewSession = !session;
                session ??= await this.createChatSession(user, sessionId, model, credentialId, false, payload.agentName, trx);
                const previousMessage = await this.ensurePreviousMessage(previousMessageId, sessionId, trx);
                const messages = Object.fromEntries((session.messages ?? []).map((m) => [m.id, m]));
                const history = this.buildMessageHistory(messages, previousMessageId);
                if (attachments.length > 0) {
                    const policy = await this.chatHubWorkflowService.getAttachmentPolicy(model, user, trx);
                    this.chatHubAttachmentService.validateAttachments(attachments, policy.allowFileUploads, policy.allowedFilesMimeTypes);
                }
                processedAttachments = await this.chatHubAttachmentService.store(sessionId, messageId, attachments);
                await this.messageRepository.createHumanMessage(payload, processedAttachments, user, previousMessageId, model, undefined, trx);
                const tools = isNewSession
                    ? (await this.chatHubToolService.getEnabledTools(user.id, trx)).map((t) => t.definition)
                    : await this.chatHubToolService.getToolDefinitionsForSession(sessionId, trx);
                const replyWorkflow = await this.chatHubWorkflowService.prepareReplyWorkflow(user, sessionId, credentials, model, history, message, tools, processedAttachments, tz, ctx, executionMetadata);
                return { workflow: replyWorkflow, previousMessage };
            });
            workflow = result.workflow;
            previousMessage = result.previousMessage;
        }
        catch (error) {
            if (processedAttachments.length > 0) {
                try {
                    await this.chatHubAttachmentService.deleteAttachments(processedAttachments);
                }
                catch {
                    this.errorReporter.warn(`Could not clean up ${processedAttachments.length} files`);
                }
            }
            throw error;
        }
        if (!workflow) {
            throw new n8n_workflow_1.UnexpectedError('Failed to prepare chat workflow.');
        }
        await this.chatStreamService.sendHumanMessage({
            userId: user.id,
            sessionId,
            messageId,
            previousMessageId,
            content: message,
            attachments: processedAttachments.map((a) => ({
                id: a.id,
                fileName: a.fileName ?? 'file',
                mimeType: a.mimeType,
            })),
        });
        const resumed = await this.tryResumeWaitingExecution({
            workflow,
            previousMessage,
            message,
            sessionId,
            user,
            messageId,
            model,
        });
        if (resumed)
            return;
        void this.executeChatWorkflowWithCleanup(user, model, workflow, sessionId, messageId, null, previousMessageId, credentials, message, processedAttachments);
    }
    async sendHumanMessageManual(user, payload, executionMetadata, pushRef) {
        const { sessionId, messageId, message, model, credentials, previousMessageId, attachments, timeZone, } = payload;
        const tz = timeZone ?? this.globalConfig.generic.timezone;
        if (model.provider !== 'n8n') {
            throw new errors_1.BadRequestError('Manual execution is only supported for n8n workflow agents');
        }
        const credentialId = this.getModelCredential(model, credentials);
        let processedAttachments = [];
        let workflow;
        let previousMessage;
        try {
            const result = await this.messageRepository.runInTransaction({}, async (trx, ctx) => {
                let session = await this.getChatSession(user, sessionId, trx);
                session ??= await this.createChatSession(user, sessionId, model, credentialId, true, payload.agentName, trx);
                const previousMessage = await this.ensurePreviousMessage(previousMessageId, sessionId, trx);
                const messages = Object.fromEntries((session.messages ?? []).map((m) => [m.id, m]));
                const history = this.buildMessageHistory(messages, previousMessageId);
                if (attachments.length > 0) {
                    const policy = await this.chatHubWorkflowService.getAttachmentPolicy(model, user, trx, true);
                    this.chatHubAttachmentService.validateAttachments(attachments, policy.allowFileUploads, policy.allowedFilesMimeTypes);
                }
                processedAttachments = await this.chatHubAttachmentService.store(sessionId, messageId, attachments);
                await this.messageRepository.createHumanMessage(payload, processedAttachments, user, previousMessageId, model, undefined, trx);
                const tools = [];
                const replyWorkflow = await this.chatHubWorkflowService.prepareReplyWorkflow(user, sessionId, credentials, model, history, message, tools, processedAttachments, tz, ctx, executionMetadata, true);
                return { workflow: replyWorkflow, previousMessage };
            });
            workflow = result.workflow;
            previousMessage = result.previousMessage;
        }
        catch (error) {
            if (processedAttachments.length > 0) {
                try {
                    await this.chatHubAttachmentService.deleteAttachments(processedAttachments);
                }
                catch {
                    this.errorReporter.warn(`Could not clean up ${processedAttachments.length} files`);
                }
            }
            throw error;
        }
        if (!workflow) {
            throw new n8n_workflow_1.UnexpectedError('Failed to prepare chat workflow.');
        }
        await this.chatStreamService.sendHumanMessage({
            userId: user.id,
            sessionId,
            messageId,
            previousMessageId,
            content: message,
            attachments: processedAttachments.map((a) => ({
                id: a.id,
                fileName: a.fileName ?? 'file',
                mimeType: a.mimeType,
            })),
        });
        const resumed = await this.tryResumeWaitingExecution({
            workflow,
            previousMessage,
            message,
            sessionId,
            user,
            messageId,
            model,
        });
        if (resumed)
            return;
        void this.executeChatWorkflowWithCleanup(user, model, workflow, sessionId, messageId, null, previousMessageId, credentials, message, processedAttachments, pushRef);
    }
    async editMessage(user, payload, executionMetadata) {
        const { sessionId, editId, messageId, message, model, credentials, timeZone } = payload;
        const tz = timeZone ?? this.globalConfig.generic.timezone;
        let result = null;
        let newStoredAttachments = [];
        try {
            result = await this.messageRepository.runInTransaction({}, async (trx, ctx) => {
                const session = await this.getChatSession(user, sessionId, trx);
                if (!session) {
                    throw new errors_1.NotFoundError('Chat session not found');
                }
                const messageToEdit = await this.getChatMessage(session.id, editId, [], trx);
                if (messageToEdit.type === 'ai') {
                    throw new errors_1.BadRequestError('Editing AI messages is not supported');
                }
                if (messageToEdit.type === 'human') {
                    const messages = Object.fromEntries((session.messages ?? []).map((m) => [m.id, m]));
                    const history = this.buildMessageHistory(messages, messageToEdit.previousMessageId);
                    const revisionOfMessageId = messageToEdit.revisionOfMessageId ?? messageToEdit.id;
                    const originalAttachments = messageToEdit.attachments ?? [];
                    const keptAttachments = payload.keepAttachmentIndices.flatMap((index) => {
                        const attachment = originalAttachments[index];
                        return attachment ? [attachment] : [];
                    });
                    newStoredAttachments =
                        payload.newAttachments.length > 0
                            ? await this.chatHubAttachmentService.store(sessionId, messageId, payload.newAttachments)
                            : [];
                    const attachments = [...keptAttachments, ...newStoredAttachments];
                    await this.messageRepository.createHumanMessage(payload, attachments, user, messageToEdit.previousMessageId, model, revisionOfMessageId, trx);
                    const tools = await this.chatHubToolService.getToolDefinitionsForSession(sessionId, trx);
                    const workflow = await this.chatHubWorkflowService.prepareReplyWorkflow(user, sessionId, credentials, model, history, message, tools, attachments, tz, ctx, executionMetadata);
                    return { workflow, combinedAttachments: attachments };
                }
                throw new errors_1.BadRequestError('Only human and AI messages can be edited');
            });
        }
        catch (error) {
            if (newStoredAttachments.length > 0) {
                try {
                    await this.chatHubAttachmentService.deleteAttachments(newStoredAttachments);
                }
                catch {
                    this.errorReporter.warn(`Could not clean up ${newStoredAttachments.length} files`);
                }
            }
            throw error;
        }
        if (!result?.workflow) {
            return;
        }
        const { workflow } = result;
        await this.chatStreamService.sendMessageEdit({
            userId: user.id,
            sessionId,
            revisionOfMessageId: editId,
            messageId,
            content: message,
            attachments: result.combinedAttachments.map((a) => ({
                id: a.id,
                fileName: a.fileName ?? 'file',
                mimeType: a.mimeType,
            })),
        });
        void this.executeChatWorkflowWithCleanup(user, model, workflow, sessionId, messageId, null, null, {}, '', []);
    }
    async editMessageManual(user, payload, executionMetadata, pushRef) {
        const { sessionId, editId, messageId, message, model, credentials, timeZone } = payload;
        const tz = timeZone ?? this.globalConfig.generic.timezone;
        if (model.provider !== 'n8n') {
            throw new errors_1.BadRequestError('Manual execution is only supported for n8n workflow agents');
        }
        let result = null;
        let newStoredAttachments = [];
        try {
            result = await this.messageRepository.runInTransaction({}, async (trx, ctx) => {
                const session = await this.getChatSession(user, sessionId, trx);
                if (!session) {
                    throw new errors_1.NotFoundError('Chat session not found');
                }
                const messageToEdit = await this.getChatMessage(session.id, editId, [], trx);
                if (messageToEdit.type === 'ai') {
                    throw new errors_1.BadRequestError('Editing AI messages is not supported');
                }
                if (messageToEdit.type === 'human') {
                    const messages = Object.fromEntries((session.messages ?? []).map((m) => [m.id, m]));
                    const history = this.buildMessageHistory(messages, messageToEdit.previousMessageId);
                    const revisionOfMessageId = messageToEdit.revisionOfMessageId ?? messageToEdit.id;
                    const originalAttachments = messageToEdit.attachments ?? [];
                    const keptAttachments = payload.keepAttachmentIndices.flatMap((index) => {
                        const attachment = originalAttachments[index];
                        return attachment ? [attachment] : [];
                    });
                    if (payload.newAttachments.length > 0) {
                        const policy = await this.chatHubWorkflowService.getAttachmentPolicy(model, user, trx, true);
                        this.chatHubAttachmentService.validateAttachments(payload.newAttachments, policy.allowFileUploads, policy.allowedFilesMimeTypes);
                    }
                    newStoredAttachments =
                        payload.newAttachments.length > 0
                            ? await this.chatHubAttachmentService.store(sessionId, messageId, payload.newAttachments)
                            : [];
                    const attachments = [...keptAttachments, ...newStoredAttachments];
                    await this.messageRepository.createHumanMessage(payload, attachments, user, messageToEdit.previousMessageId, model, revisionOfMessageId, trx);
                    const tools = [];
                    const workflow = await this.chatHubWorkflowService.prepareReplyWorkflow(user, sessionId, credentials, model, history, message, tools, attachments, tz, ctx, executionMetadata, true);
                    return { workflow, combinedAttachments: attachments };
                }
                throw new errors_1.BadRequestError('Only human and AI messages can be edited');
            });
        }
        catch (error) {
            if (newStoredAttachments.length > 0) {
                try {
                    await this.chatHubAttachmentService.deleteAttachments(newStoredAttachments);
                }
                catch {
                    this.errorReporter.warn(`Could not clean up ${newStoredAttachments.length} files`);
                }
            }
            throw error;
        }
        if (!result?.workflow) {
            return;
        }
        const { workflow } = result;
        await this.chatStreamService.sendMessageEdit({
            userId: user.id,
            sessionId,
            revisionOfMessageId: editId,
            messageId,
            content: message,
            attachments: result.combinedAttachments.map((a) => ({
                id: a.id,
                fileName: a.fileName ?? 'file',
                mimeType: a.mimeType,
            })),
        });
        void this.executeChatWorkflowWithCleanup(user, model, workflow, sessionId, messageId, null, null, {}, '', [], pushRef);
    }
    async regenerateAIMessage(user, payload, executionMetadata) {
        const { sessionId, retryId, model, credentials, timeZone } = payload;
        const tz = timeZone ?? this.globalConfig.generic.timezone;
        const { retryOfMessageId, previousMessageId, workflow } = await this.messageRepository.runInTransaction({}, async (trx, ctx) => {
            const session = await this.getChatSession(user, sessionId, trx);
            if (!session) {
                throw new errors_1.NotFoundError('Chat session not found');
            }
            const messageToRetry = await this.getChatMessage(session.id, retryId, [], trx);
            if (messageToRetry.type !== 'ai') {
                throw new errors_1.BadRequestError('Can only retry AI messages');
            }
            const messages = Object.fromEntries((session.messages ?? []).map((m) => [m.id, m]));
            const history = this.buildMessageHistory(messages, messageToRetry.previousMessageId);
            const lastHumanMessage = history.filter((m) => m.type === 'human').pop();
            if (!lastHumanMessage) {
                throw new errors_1.BadRequestError('No human message found to base the retry on');
            }
            const lastHumanMessageIndex = history.indexOf(lastHumanMessage);
            if (lastHumanMessageIndex !== -1) {
                history.splice(lastHumanMessageIndex);
            }
            const retryOfMessageId = messageToRetry.retryOfMessageId ?? messageToRetry.id;
            const message = lastHumanMessage ? lastHumanMessage.content : '';
            const attachments = lastHumanMessage.attachments ?? [];
            const tools = await this.chatHubToolService.getToolDefinitionsForSession(sessionId, trx);
            const workflow = await this.chatHubWorkflowService.prepareReplyWorkflow(user, sessionId, credentials, model, history, message, tools, attachments, tz, ctx, executionMetadata);
            return {
                previousMessageId: lastHumanMessage.id,
                retryOfMessageId,
                workflow,
            };
        });
        void this.executeChatWorkflowWithCleanup(user, model, workflow, sessionId, previousMessageId, retryOfMessageId, null, {}, '', []);
    }
    async regenerateAIMessageManual(user, payload, executionMetadata, pushRef) {
        const { sessionId, retryId, model, credentials, timeZone } = payload;
        const tz = timeZone ?? this.globalConfig.generic.timezone;
        if (model.provider !== 'n8n') {
            throw new errors_1.BadRequestError('Manual execution is only supported for n8n workflow agents');
        }
        const { retryOfMessageId, previousMessageId, workflow } = await this.messageRepository.runInTransaction({}, async (trx, ctx) => {
            const session = await this.getChatSession(user, sessionId, trx);
            if (!session) {
                throw new errors_1.NotFoundError('Chat session not found');
            }
            const messageToRetry = await this.getChatMessage(session.id, retryId, [], trx);
            if (messageToRetry.type !== 'ai') {
                throw new errors_1.BadRequestError('Can only retry AI messages');
            }
            const messages = Object.fromEntries((session.messages ?? []).map((m) => [m.id, m]));
            const history = this.buildMessageHistory(messages, messageToRetry.previousMessageId);
            const lastHumanMessage = history.filter((m) => m.type === 'human').pop();
            if (!lastHumanMessage) {
                throw new errors_1.BadRequestError('No human message found to base the retry on');
            }
            const lastHumanMessageIndex = history.indexOf(lastHumanMessage);
            if (lastHumanMessageIndex !== -1) {
                history.splice(lastHumanMessageIndex);
            }
            const retryOfMessageId = messageToRetry.retryOfMessageId ?? messageToRetry.id;
            const message = lastHumanMessage ? lastHumanMessage.content : '';
            const attachments = lastHumanMessage.attachments ?? [];
            const tools = [];
            const workflow = await this.chatHubWorkflowService.prepareReplyWorkflow(user, sessionId, credentials, model, history, message, tools, attachments, tz, ctx, executionMetadata, true);
            return {
                previousMessageId: lastHumanMessage.id,
                retryOfMessageId,
                workflow,
            };
        });
        void this.executeChatWorkflowWithCleanup(user, model, workflow, sessionId, previousMessageId, retryOfMessageId, null, {}, '', [], pushRef);
    }
    async reconnectToStream(sessionId, lastReceivedSequence) {
        const hasActiveStream = await this.chatStreamService.hasActiveStream(sessionId);
        const currentMessageId = await this.chatStreamService.getCurrentMessageId(sessionId);
        const pendingChunks = await this.chatStreamService.getPendingChunks(sessionId, lastReceivedSequence);
        return {
            hasActiveStream,
            currentMessageId,
            pendingChunks,
            lastSequenceNumber: pendingChunks.length > 0
                ? pendingChunks[pendingChunks.length - 1].sequenceNumber
                : lastReceivedSequence,
        };
    }
    async executeChatWorkflowWithCleanup(user, model, workflow, sessionId, previousMessageId, retryOfMessageId, originalPreviousMessageId, credentials, humanMessage, processedAttachments, pushRef) {
        await this.chatHubExecutionService.executeChatWorkflowWithCleanup(user, model, workflow.workflowData, workflow.executionData, sessionId, previousMessageId, retryOfMessageId, workflow.responseMode, pushRef);
        if (originalPreviousMessageId === null && humanMessage && !pushRef) {
            try {
                await this.chatHubTitleService.generateSessionTitle(user, sessionId, humanMessage, processedAttachments, credentials, model);
            }
            catch (error) {
                this.logger.warn(`Title generation failed: ${error}`);
            }
        }
    }
    convertMessageToDto(message) {
        return {
            id: message.id,
            sessionId: message.sessionId,
            type: message.type,
            name: message.name,
            content: (0, chat_hub_1.parseMessage)(message),
            provider: message.provider,
            model: message.model,
            workflowId: message.workflowId,
            agentId: message.agentId,
            executionId: message.executionId,
            status: message.status,
            createdAt: message.createdAt.toISOString(),
            updatedAt: message.updatedAt.toISOString(),
            previousMessageId: message.previousMessageId,
            retryOfMessageId: message.retryOfMessageId,
            revisionOfMessageId: message.revisionOfMessageId,
            attachments: (message.attachments ?? []).map(({ fileName, mimeType }) => ({
                fileName,
                mimeType,
            })),
        };
    }
    convertSessionEntityToDto(session, toolIds = []) {
        const agent = session.workflow
            ? this.chatHubModelsService.extractModelFromWorkflow(session.workflow, [])
            : session.agent
                ? this.chatHubAgentService.convertAgentEntityToModel(session.agent)
                : undefined;
        return {
            id: session.id,
            title: session.title,
            ownerId: session.ownerId,
            lastMessageAt: session.lastMessageAt?.toISOString() ?? null,
            credentialId: session.credentialId,
            provider: session.provider,
            model: session.model,
            workflowId: session.workflowId,
            agentId: session.agentId,
            agentName: agent?.name ?? session.agentName ?? session.model ?? '',
            agentIcon: agent?.icon ?? null,
            type: session.type ?? 'production',
            createdAt: session.createdAt.toISOString(),
            updatedAt: session.updatedAt.toISOString(),
            toolIds,
        };
    }
};
exports.ChatHubService = ChatHubService;
exports.ChatHubService = ChatHubService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, execution_persistence_1.ExecutionPersistence, workflow_finder_service_1.WorkflowFinderService, chat_session_repository_1.ChatHubSessionRepository, chat_message_repository_1.ChatHubMessageRepository, chat_hub_agent_service_1.ChatHubAgentService, chat_hub_models_service_1.ChatHubModelsService, chat_hub_attachment_service_1.ChatHubAttachmentService, chat_stream_service_1.ChatStreamService, chat_hub_execution_service_1.ChatHubExecutionService, chat_hub_title_service_1.ChatHubTitleService, chat_hub_tool_service_1.ChatHubToolService, chat_hub_workflow_service_1.ChatHubWorkflowService, config_1.GlobalConfig, chat_execution_manager_1.ChatExecutionManager])
], ChatHubService);
//# sourceMappingURL=chat-hub.service.js.map