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
exports.ChatHubExecutionService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const active_executions_1 = require("../../active-executions");
const chat_execution_manager_1 = require("../../chat/chat-execution-manager");
const execution_not_found_error_1 = require("../../errors/execution-not-found-error");
const errors_1 = require("@n8n/errors");
const execution_persistence_1 = require("../../executions/execution-persistence");
const execution_service_1 = require("../../executions/execution.service");
const workflow_execution_service_1 = require("../../workflows/workflow-execution.service");
const chat_hub_execution_store_service_1 = require("./chat-hub-execution-store.service");
const chat_hub_workflow_service_1 = require("./chat-hub-workflow.service");
const chat_hub_constants_1 = require("./chat-hub.constants");
const chat_message_repository_1 = require("./chat-message.repository");
const chat_stream_service_1 = require("./chat-stream.service");
const stream_capturer_1 = require("./stream-capturer");
let ChatHubExecutionService = class ChatHubExecutionService {
    constructor(logger, executionService, workflowExecutionService, executionRepository, executionPersistence, executionManager, activeExecutions, instanceSettings, chatStreamService, chatHubWorkflowService, chatHubExecutionStore, messageRepository) {
        this.logger = logger;
        this.executionService = executionService;
        this.workflowExecutionService = workflowExecutionService;
        this.executionRepository = executionRepository;
        this.executionPersistence = executionPersistence;
        this.executionManager = executionManager;
        this.activeExecutions = activeExecutions;
        this.instanceSettings = instanceSettings;
        this.chatStreamService = chatStreamService;
        this.chatHubWorkflowService = chatHubWorkflowService;
        this.chatHubExecutionStore = chatHubExecutionStore;
        this.messageRepository = messageRepository;
        this.logger = this.logger.scoped('chat-hub');
    }
    async execute(user, workflowData, executionData) {
        return await this.workflowExecutionService.executeChatWorkflow(user, workflowData, executionData, undefined, false, 'chat');
    }
    async stop(executionId, workflowId) {
        return await this.executionService.stop(executionId, [workflowId]);
    }
    async executeChatWorkflowWithCleanup(user, model, workflowData, executionData, sessionId, previousMessageId, retryOfMessageId, responseMode, pushRef) {
        const executionMode = pushRef && model.provider === 'n8n'
            ? 'manual'
            : model.provider === 'n8n'
                ? 'webhook'
                : 'chat';
        const { id: workflowId } = workflowData;
        try {
            await this.executeChatWorkflow(user, model, workflowData, executionData, sessionId, previousMessageId, retryOfMessageId, executionMode, responseMode, pushRef);
        }
        catch (error) {
            this.logger.error(`Error in chat execution: ${error}`);
            const errorMessageId = (0, uuid_1.v4)();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.messageRepository.createAIMessage({
                id: errorMessageId,
                sessionId,
                previousMessageId,
                content: errorMessage,
                model,
                retryOfMessageId,
                status: 'error',
            });
            await this.chatStreamService.sendErrorDirect(user.id, sessionId, errorMessageId, errorMessage);
            await this.chatStreamService.endExecution(user.id, sessionId, 'error');
        }
        finally {
            if (model.provider !== 'n8n') {
                await this.chatHubWorkflowService.deleteChatWorkflow(workflowId);
            }
        }
    }
    async executeChatWorkflow(user, model, workflowData, executionData, sessionId, previousMessageId, retryOfMessageId, executionMode, responseMode, pushRef) {
        this.logger.debug(`Starting execution of workflow "${workflowData.name}" with ID ${workflowData.id}`);
        if (!chat_hub_constants_1.SUPPORTED_RESPONSE_MODES.includes(responseMode)) {
            throw new errors_1.BadRequestError(`Response mode "${responseMode}" is not supported yet.`);
        }
        if (responseMode === 'lastNode' || responseMode === 'responseNodes') {
            return await this.executeNonStreaming(user, model, workflowData, executionData, sessionId, previousMessageId, retryOfMessageId, executionMode, responseMode, pushRef);
        }
        else if (responseMode === 'streaming') {
            return await this.executeWithStreaming(user, model, workflowData, executionData, sessionId, previousMessageId, retryOfMessageId, executionMode, pushRef);
        }
    }
    async executeWithStreaming(user, model, workflowData, executionData, sessionId, previousMessageId, retryOfMessageId, executionMode, pushRef) {
        let executionId;
        let executionStatus = 'success';
        const workflowId = workflowData.id;
        await this.chatStreamService.startExecution(user.id, sessionId);
        const aggregator = (0, stream_capturer_1.createStructuredChunkAggregator)(previousMessageId, retryOfMessageId, {
            onBegin: async (message) => {
                await this.messageRepository.createAIMessage({
                    id: message.id,
                    sessionId,
                    previousMessageId: message.previousMessageId ?? previousMessageId,
                    content: '',
                    model,
                    executionId,
                    retryOfMessageId: message.retryOfMessageId,
                    status: 'running',
                });
                await this.chatStreamService.startStream({
                    userId: user.id,
                    sessionId,
                    messageId: message.id,
                    previousMessageId: message.previousMessageId,
                    retryOfMessageId: message.retryOfMessageId,
                    executionId: executionId ? parseInt(executionId, 10) : null,
                });
            },
            onItem: async (message, chunk) => {
                await this.chatStreamService.sendChunk(sessionId, message.id, chunk);
            },
            onEnd: async (message) => {
                await this.messageRepository.updateChatMessage(message.id, {
                    content: message.content,
                    status: message.status,
                });
                await this.chatStreamService.endStream(sessionId, message.id, message.status);
            },
            onError: async (message, errorText) => {
                let contentToSave = message.content;
                if (!contentToSave && errorText) {
                    contentToSave = errorText;
                }
                else if (!contentToSave) {
                    contentToSave = executionId
                        ? ((await this.waitForErrorDetails(executionId, workflowId)) ?? 'Unknown error')
                        : 'Request was not processed';
                }
                await this.messageRepository.manager.transaction(async (trx) => {
                    await this.messageRepository.updateChatMessage(message.id, { content: contentToSave }, trx);
                    const savedMessage = await this.messageRepository.getOneById(message.id, sessionId, [], trx);
                    if (savedMessage?.status === 'cancelled') {
                        executionStatus = 'cancelled';
                        await this.chatStreamService.endStream(sessionId, message.id, 'cancelled');
                        return;
                    }
                    executionStatus = 'error';
                    await this.messageRepository.updateChatMessage(message.id, { status: 'error' }, trx);
                    await this.chatStreamService.sendError(sessionId, message.id, contentToSave);
                    await this.chatStreamService.endStream(sessionId, message.id, 'error');
                });
            },
            onCancel: async (message) => {
                await this.messageRepository.updateChatMessage(message.id, {
                    content: message.content,
                    status: 'cancelled',
                });
                await this.chatStreamService.endStream(sessionId, message.id, 'cancelled');
            },
        });
        const { adapter: streamAdapter, waitForPendingOperations } = this.createStreamAdapter(aggregator);
        try {
            const execution = await this.workflowExecutionService.executeChatWorkflow(user, workflowData, executionData, streamAdapter, true, executionMode, pushRef);
            executionId = execution.executionId;
            if (!executionId) {
                throw new n8n_workflow_1.OperationalError('There was a problem starting the chat execution.');
            }
            await this.waitForExecutionCompletion(executionId);
            await waitForPendingOperations();
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.ManualExecutionCancelledError) {
                executionStatus = 'cancelled';
                if (this.instanceSettings.isMultiMain) {
                    await aggregator.cancelAll();
                }
            }
            else {
                executionStatus = 'error';
                throw error;
            }
        }
        finally {
            await waitForPendingOperations();
            await this.chatStreamService.endExecution(user.id, sessionId, executionStatus);
        }
    }
    async executeNonStreaming(user, model, workflowData, executionData, sessionId, previousMessageId, retryOfMessageId, executionMode, responseMode, pushRef) {
        const running = await this.workflowExecutionService.executeChatWorkflow(user, workflowData, executionData, undefined, false, executionMode, pushRef);
        const executionId = running.executionId;
        if (!executionId) {
            throw new n8n_workflow_1.OperationalError('There was a problem starting the chat execution.');
        }
        const messageId = (0, uuid_1.v4)();
        await this.chatHubExecutionStore.register({
            executionId,
            sessionId,
            userId: user.id,
            messageId,
            previousMessageId,
            model,
            responseMode,
            awaitingResume: false,
            createMessageOnResume: false,
            workflowId: workflowData.id,
        });
        await this.chatStreamService.startExecution(user.id, sessionId);
        await this.messageRepository.createAIMessage({
            id: messageId,
            content: '',
            sessionId,
            executionId,
            model,
            previousMessageId,
            retryOfMessageId,
            status: 'running',
        });
        await this.chatStreamService.startStream({
            userId: user.id,
            sessionId,
            messageId,
            previousMessageId,
            retryOfMessageId,
            executionId: parseInt(executionId, 10),
        });
    }
    async resumeChatExecution(execution, message, sessionId, _user, previousMessageId, model, _responseMode) {
        await this.messageRepository.updateChatMessage(previousMessageId, {
            status: 'success',
        });
        const messageId = (0, uuid_1.v4)();
        await this.messageRepository.createAIMessage({
            id: messageId,
            content: '',
            sessionId,
            executionId: execution.id,
            model,
            previousMessageId,
            retryOfMessageId: null,
            status: 'running',
        });
        await this.chatHubExecutionStore.update(execution.id, {
            previousMessageId,
            messageId,
            awaitingResume: true,
            createMessageOnResume: false,
        });
        await this.executionManager.runWorkflow(execution, {
            action: 'sendMessage',
            chatInput: message,
            sessionId,
        });
    }
    async waitForExecutionCompletion(executionId) {
        if (this.instanceSettings.isMultiMain) {
            return await this.waitForExecutionPoller(executionId);
        }
        else {
            return await this.waitForExecutionPromise(executionId);
        }
    }
    async waitForExecutionPoller(executionId) {
        return await new Promise((resolve, reject) => {
            const poller = setInterval(async () => {
                try {
                    const execution = await this.executionRepository.findSingleExecution(executionId, {
                        includeData: false,
                        unflattenData: false,
                    });
                    if (!execution || chat_hub_constants_1.EXECUTION_FINISHED_STATUSES.includes(execution.status)) {
                        this.logger.debug(`Execution ${executionId} finished with status ${execution?.status ?? 'missing'}`);
                        clearInterval(poller);
                        if (execution?.status === 'canceled') {
                            reject(new n8n_workflow_1.ManualExecutionCancelledError(executionId));
                        }
                        else {
                            resolve();
                        }
                    }
                }
                catch (error) {
                    this.logger.error(`Stopping polling for execution ${executionId} due to error.`);
                    clearInterval(poller);
                    if (error instanceof Error) {
                        this.logger.error(`Error while polling execution ${executionId}: ${error.message}`, {
                            error,
                        });
                    }
                    else {
                        this.logger.error(`Unknown error while polling execution ${executionId}`, { error });
                    }
                    if (error instanceof Error) {
                        reject(error);
                    }
                    else {
                        reject(new Error('Unknown error while polling execution status'));
                    }
                }
            }, chat_hub_constants_1.EXECUTION_POLL_INTERVAL);
        });
    }
    async waitForExecutionPromise(executionId) {
        try {
            const result = await this.activeExecutions.getPostExecutePromise(executionId);
            if (!result) {
                throw new n8n_workflow_1.OperationalError('There was a problem executing the chat workflow.');
            }
        }
        catch (error) {
            if (error instanceof execution_not_found_error_1.ExecutionNotFoundError) {
                return;
            }
            if (error instanceof n8n_workflow_1.ManualExecutionCancelledError) {
                throw error;
            }
            if (error instanceof Error) {
                this.logger.error(`Error during chat workflow execution: ${error}`);
            }
            throw error;
        }
    }
    async waitForErrorDetails(executionId, workflowId) {
        const maxRetries = 5;
        let retries = 0;
        let errorText;
        while (!errorText) {
            try {
                const execution = await this.executionPersistence.findWithUnflattenedData(executionId, [
                    workflowId,
                ]);
                if (execution && chat_hub_constants_1.EXECUTION_FINISHED_STATUSES.includes(execution.status)) {
                    errorText = this.extractErrorMessage(execution.data);
                    break;
                }
            }
            catch (error) {
                this.logger.debug(`Failed to fetch execution ${executionId} for error extraction: ${String(error)}`);
            }
            retries++;
            if (maxRetries <= retries) {
                break;
            }
            await (0, sleep_1.sleep)(Math.min(500 * Math.pow(2, retries), 2000));
        }
        return errorText;
    }
    createStreamAdapter(aggregator) {
        let processingChain = Promise.resolve();
        const adapter = {
            headersSent: false,
            writableEnded: false,
            writeHead: (_statusCode, _headers) => {
                adapter.headersSent = true;
                return adapter;
            },
            flushHeaders: () => { },
            write: (chunk, _encoding, doneCb) => {
                const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk;
                const lines = text.split('\n').filter((line) => line.trim());
                for (const line of lines) {
                    try {
                        const parsed = (0, n8n_workflow_1.jsonParse)(line.trim());
                        processingChain = processingChain.then(async () => {
                            await aggregator.ingest(parsed);
                        });
                    }
                    catch {
                    }
                }
                if (doneCb)
                    doneCb();
                return true;
            },
            end: (_chunk, _encoding, doneCb) => {
                adapter.writableEnded = true;
                if (doneCb)
                    doneCb();
                return adapter;
            },
            flush: () => { },
            on: (_event, _handler) => adapter,
            once: (_event, _handler) => adapter,
            off: (_event, _handler) => adapter,
            emit: (_event, ..._args) => true,
        };
        const waitForPendingOperations = async () => {
            await processingChain;
        };
        return { adapter: adapter, waitForPendingOperations };
    }
    async ensureWasSuccessfulOrThrow(executionId, errorMessage) {
        const executionEntity = await this.executionPersistence.findSingleExecution(executionId, {
            includeData: true,
            unflattenData: true,
        });
        if (!executionEntity) {
            throw new errors_1.InternalServerError(`${errorMessage}: Execution not found`);
        }
        if (executionEntity.status !== 'success') {
            const cause = this.extractErrorMessage(executionEntity.data) ?? 'Unknown error';
            throw new errors_1.InternalServerError(`${errorMessage}: ${cause}`);
        }
    }
    extractErrorMessage(runData) {
        const { error, runData: nodeRunData } = runData.resultData;
        if (error) {
            return error.description ?? error.message;
        }
        for (const nodeRuns of Object.values(nodeRunData ?? {})) {
            for (const nodeRun of nodeRuns) {
                if (nodeRun.error) {
                    return nodeRun.error.description ?? nodeRun.error.message;
                }
            }
        }
        return undefined;
    }
    extractMessage(runData, responseMode) {
        const lastNodeExecuted = runData.data.resultData.lastNodeExecuted;
        if (typeof lastNodeExecuted !== 'string')
            return undefined;
        const nodeRunData = runData.data.resultData.runData[lastNodeExecuted];
        if (!nodeRunData || nodeRunData.length === 0)
            return undefined;
        const runIndex = nodeRunData.length - 1;
        const data = nodeRunData[runIndex]?.data;
        const outputs = data?.main ?? data?.[n8n_workflow_1.NodeConnectionTypes.AiTool] ?? [];
        const entry = this.getFirstOutputEntry(outputs);
        if (!entry)
            return undefined;
        return this.extractMessageFromEntry(entry, responseMode);
    }
    getFirstOutputEntry(outputs) {
        for (const branch of outputs) {
            if (!Array.isArray(branch) || branch.length === 0)
                continue;
            return branch[0];
        }
        return undefined;
    }
    extractMessageFromEntry(entry, responseMode) {
        if (responseMode === 'responseNodes') {
            const sendMessage = entry.sendMessage;
            if (typeof sendMessage === 'string') {
                return sendMessage;
            }
            const result = api_types_1.chatHubMessageWithButtonsSchema.safeParse(sendMessage);
            if (result.success) {
                return (0, n8n_workflow_1.jsonStringify)(result.data);
            }
            return '';
        }
        if (responseMode === 'lastNode') {
            const response = entry.json ?? {};
            const message = response.output ?? response.text ?? response.message ?? '';
            return typeof message === 'string' ? message : (0, n8n_workflow_1.jsonStringify)(message);
        }
        return undefined;
    }
};
exports.ChatHubExecutionService = ChatHubExecutionService;
exports.ChatHubExecutionService = ChatHubExecutionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, execution_service_1.ExecutionService, workflow_execution_service_1.WorkflowExecutionService, db_1.ExecutionRepository, execution_persistence_1.ExecutionPersistence, chat_execution_manager_1.ChatExecutionManager, active_executions_1.ActiveExecutions, n8n_core_1.InstanceSettings, chat_stream_service_1.ChatStreamService, chat_hub_workflow_service_1.ChatHubWorkflowService, chat_hub_execution_store_service_1.ChatHubExecutionStore, chat_message_repository_1.ChatHubMessageRepository])
], ChatHubExecutionService);
//# sourceMappingURL=chat-hub-execution.service.js.map