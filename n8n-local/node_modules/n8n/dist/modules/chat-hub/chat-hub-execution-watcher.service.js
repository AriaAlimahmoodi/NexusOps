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
exports.ChatHubExecutionWatcherService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const uuid_1 = require("uuid");
const chat_execution_manager_1 = require("../../chat/chat-execution-manager");
const execution_persistence_1 = require("../../executions/execution-persistence");
const chat_hub_execution_store_service_1 = require("./chat-hub-execution-store.service");
const chat_hub_execution_service_1 = require("./chat-hub-execution.service");
const chat_message_repository_1 = require("./chat-message.repository");
const chat_stream_service_1 = require("./chat-stream.service");
const utils_1 = require("../../chat/utils");
let ChatHubExecutionWatcherService = class ChatHubExecutionWatcherService {
    constructor(logger, executionStore, messageRepository, chatHubExecutionService, executionPersistence, chatStreamService, executionManager) {
        this.logger = logger;
        this.executionStore = executionStore;
        this.messageRepository = messageRepository;
        this.chatHubExecutionService = chatHubExecutionService;
        this.executionPersistence = executionPersistence;
        this.chatStreamService = chatStreamService;
        this.executionManager = executionManager;
        this.logger = this.logger.scoped('chat-hub');
    }
    async handleExecutionResumed(ctx) {
        const { executionId } = ctx;
        const context = await this.executionStore.get(executionId);
        if (!context)
            return;
        if (!context.awaitingResume)
            return;
        this.logger.debug('Chat hub execution resumed, notifying frontend', { executionId });
        await this.chatStreamService.startExecution(context.userId, context.sessionId);
        if (context.createMessageOnResume) {
            const newMessageId = (0, uuid_1.v4)();
            await this.messageRepository.updateChatMessage(context.messageId, { status: 'success' });
            await this.createNextMessage(context, newMessageId, executionId);
            await this.executionStore.update(executionId, {
                previousMessageId: context.messageId,
                messageId: newMessageId,
                createMessageOnResume: false,
                awaitingResume: false,
            });
            await this.chatStreamService.startStream({
                userId: context.userId,
                sessionId: context.sessionId,
                messageId: newMessageId,
                previousMessageId: context.messageId,
                retryOfMessageId: null,
                executionId: parseInt(executionId, 10),
            });
            return;
        }
        await this.executionStore.update(executionId, { awaitingResume: false });
        await this.chatStreamService.startStream({
            userId: context.userId,
            sessionId: context.sessionId,
            messageId: context.messageId,
            previousMessageId: context.previousMessageId,
            retryOfMessageId: null,
            executionId: parseInt(executionId, 10),
        });
    }
    async handleWorkflowExecuteAfter(ctx) {
        const { runData, executionId } = ctx;
        if (!ctx.executedInThisProcess)
            return;
        const context = await this.executionStore.get(executionId);
        if (!context)
            return;
        this.logger.debug('Handling workflow execution completion', { executionId });
        if (!['success', 'waiting', 'canceled'].includes(runData.status)) {
            const errorMessage = this.chatHubExecutionService.extractErrorMessage(runData.data) ??
                'Failed to generate a response';
            await this.pushErrorResults(context, errorMessage);
            await this.executionStore.remove(executionId);
            return;
        }
        if (runData.status === 'canceled') {
            await this.chatStreamService.endExecution(context.userId, context.sessionId, 'cancelled');
            await this.executionStore.remove(executionId);
            return;
        }
        const message = this.chatHubExecutionService.extractMessage(runData, context.responseMode);
        if (runData.status === 'waiting') {
            await this.handleWaitingExecution(context, executionId, message);
            return;
        }
        if (runData.finished) {
            await this.pushFinalResults(context, message);
            await this.executionStore.remove(executionId);
        }
    }
    async handleWaitingExecution(context, executionId, message) {
        await this.messageRepository.updateChatMessage(context.messageId, {
            content: message ?? '',
            status: 'waiting',
        });
        if (message) {
            await this.chatStreamService.sendChunk(context.sessionId, context.messageId, message);
        }
        await this.chatStreamService.endStream(context.sessionId, context.messageId, 'waiting');
        await this.chatStreamService.endExecution(context.userId, context.sessionId, 'success');
        if (context.responseMode === 'responseNodes') {
            const execution = await this.executionPersistence.findSingleExecution(executionId, {
                includeData: true,
                unflattenData: true,
            });
            if (execution) {
                const lastNode = (0, utils_1.getLastNodeExecuted)(execution);
                if (lastNode && (0, utils_1.shouldResumeImmediately)(lastNode)) {
                    await this.triggerAutoResume(context, execution);
                    return;
                }
            }
        }
        await this.executionStore.update(executionId, {
            awaitingResume: true,
            createMessageOnResume: true,
        });
    }
    async triggerAutoResume(context, execution) {
        this.logger.debug('Triggering auto-resume of execution', { executionId: execution.id });
        await this.messageRepository.updateChatMessage(context.messageId, { status: 'success' });
        const newMessageId = (0, uuid_1.v4)();
        await this.createNextMessage(context, newMessageId, execution.id);
        await this.executionStore.update(execution.id, {
            previousMessageId: context.messageId,
            messageId: newMessageId,
            awaitingResume: true,
            createMessageOnResume: false,
        });
        void this.executionManager.runWorkflow(execution, {
            action: 'sendMessage',
            chatInput: '',
            sessionId: context.sessionId,
        });
    }
    async createNextMessage(context, messageId, executionId) {
        await this.messageRepository.createChatMessage({
            id: messageId,
            sessionId: context.sessionId,
            previousMessageId: context.messageId,
            executionId: parseInt(executionId, 10),
            type: 'ai',
            name: 'AI',
            status: 'running',
            content: '',
            retryOfMessageId: null,
            ...context.model,
        });
    }
    async pushFinalResults(context, message) {
        if (message) {
            await this.chatStreamService.sendChunk(context.sessionId, context.messageId, message);
        }
        await this.chatStreamService.endStream(context.sessionId, context.messageId, 'success');
        await this.chatStreamService.endExecution(context.userId, context.sessionId, 'success');
        await this.messageRepository.updateChatMessage(context.messageId, {
            content: message ?? '',
            status: 'success',
        });
    }
    async pushErrorResults(context, errorMessage) {
        await this.chatStreamService.sendChunk(context.sessionId, context.messageId, errorMessage);
        await this.chatStreamService.endStream(context.sessionId, context.messageId, 'error');
        await this.chatStreamService.endExecution(context.userId, context.sessionId, 'error');
        await this.messageRepository.updateChatMessage(context.messageId, {
            content: errorMessage,
            status: 'error',
        });
    }
};
exports.ChatHubExecutionWatcherService = ChatHubExecutionWatcherService;
__decorate([
    (0, decorators_1.OnLifecycleEvent)('workflowExecuteResume'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatHubExecutionWatcherService.prototype, "handleExecutionResumed", null);
__decorate([
    (0, decorators_1.OnLifecycleEvent)('workflowExecuteAfter'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatHubExecutionWatcherService.prototype, "handleWorkflowExecuteAfter", null);
exports.ChatHubExecutionWatcherService = ChatHubExecutionWatcherService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, chat_hub_execution_store_service_1.ChatHubExecutionStore, chat_message_repository_1.ChatHubMessageRepository, chat_hub_execution_service_1.ChatHubExecutionService, execution_persistence_1.ExecutionPersistence, chat_stream_service_1.ChatStreamService, chat_execution_manager_1.ChatExecutionManager])
], ChatHubExecutionWatcherService);
//# sourceMappingURL=chat-hub-execution-watcher.service.js.map