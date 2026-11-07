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
exports.ChatStreamService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const push_1 = require("../../push");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const chat_stream_state_service_1 = require("./chat-stream-state.service");
let ChatStreamService = class ChatStreamService {
    constructor(logger, push, publisher, instanceSettings, executionsConfig, streamStore) {
        this.logger = logger;
        this.push = push;
        this.publisher = publisher;
        this.instanceSettings = instanceSettings;
        this.executionsConfig = executionsConfig;
        this.streamStore = streamStore;
        this.logger = this.logger.scoped('chat-hub');
    }
    async startExecution(userId, sessionId) {
        await this.streamStore.startExecution({
            sessionId,
            userId,
        });
        const message = {
            type: 'chatHubExecutionBegin',
            data: {
                sessionId,
                timestamp: Date.now(),
            },
        };
        this.push.sendToUsers(message, [userId]);
        if (this.shouldRelayViaPubSub()) {
            await this.publisher.publishCommand({
                command: 'relay-chat-stream-event',
                payload: {
                    eventType: 'execution-begin',
                    userId,
                    sessionId,
                    messageId: '',
                    sequenceNumber: 0,
                    payload: {},
                },
            });
        }
    }
    async endExecution(userId, sessionId, status) {
        const message = {
            type: 'chatHubExecutionEnd',
            data: {
                sessionId,
                status,
                timestamp: Date.now(),
            },
        };
        this.push.sendToUsers(message, [userId]);
        if (this.shouldRelayViaPubSub()) {
            await this.publisher.publishCommand({
                command: 'relay-chat-stream-event',
                payload: {
                    eventType: 'execution-end',
                    userId,
                    sessionId,
                    messageId: '',
                    sequenceNumber: 0,
                    payload: { status },
                },
            });
        }
        await this.streamStore.endExecution(sessionId);
    }
    async startStream(params) {
        const { sessionId, messageId, previousMessageId, retryOfMessageId, executionId } = params;
        await this.streamStore.setCurrentMessage(sessionId, messageId);
        const message = {
            type: 'chatHubStreamBegin',
            data: {
                sessionId,
                messageId,
                sequenceNumber: await this.streamStore.incrementSequence(sessionId),
                timestamp: Date.now(),
                previousMessageId,
                retryOfMessageId,
                executionId,
            },
        };
        await this.sendPushMessage(params, message, 'begin');
    }
    async sendChunk(sessionId, messageId, content) {
        const streamState = await this.streamStore.getStreamState(sessionId);
        if (!streamState) {
            this.logger.debug(`No active execution found for session ${sessionId}`);
            return;
        }
        const sequenceNumber = await this.streamStore.incrementSequence(sessionId);
        await this.streamStore.bufferChunk(sessionId, { sequenceNumber, content });
        const message = {
            type: 'chatHubStreamChunk',
            data: {
                sessionId,
                messageId,
                sequenceNumber,
                timestamp: Date.now(),
                content,
            },
        };
        await this.sendPushMessage({ userId: streamState.userId, sessionId, messageId }, message, 'chunk');
    }
    async endStream(sessionId, messageId, status) {
        const streamState = await this.streamStore.getStreamState(sessionId);
        if (!streamState) {
            this.logger.debug(`No active execution found for session ${sessionId}`);
            return;
        }
        const sequenceNumber = await this.streamStore.incrementSequence(sessionId);
        const message = {
            type: 'chatHubStreamEnd',
            data: {
                sessionId,
                messageId,
                sequenceNumber,
                timestamp: Date.now(),
                status,
            },
        };
        await this.sendPushMessage({ userId: streamState.userId, sessionId, messageId }, message, 'end');
    }
    async sendError(sessionId, messageId, error) {
        const streamState = await this.streamStore.getStreamState(sessionId);
        if (!streamState) {
            this.logger.debug(`No active execution found for session ${sessionId}`);
            return;
        }
        const sequenceNumber = await this.streamStore.incrementSequence(sessionId);
        const message = {
            type: 'chatHubStreamError',
            data: {
                sessionId,
                messageId,
                sequenceNumber,
                timestamp: Date.now(),
                error,
            },
        };
        await this.sendPushMessage({ userId: streamState.userId, sessionId, messageId }, message, 'error');
    }
    async sendErrorDirect(userId, sessionId, messageId, error) {
        const message = {
            type: 'chatHubStreamError',
            data: {
                sessionId,
                messageId,
                sequenceNumber: 0,
                timestamp: Date.now(),
                error,
            },
        };
        this.push.sendToUsers(message, [userId]);
        if (this.shouldRelayViaPubSub()) {
            await this.publisher.publishCommand({
                command: 'relay-chat-stream-event',
                payload: {
                    eventType: 'error',
                    userId,
                    sessionId,
                    messageId,
                    sequenceNumber: 0,
                    payload: { error },
                },
            });
        }
    }
    async getPendingChunks(sessionId, lastReceivedSequence) {
        return await this.streamStore.getChunksAfter(sessionId, lastReceivedSequence);
    }
    async hasActiveStream(sessionId) {
        const streamState = await this.streamStore.getStreamState(sessionId);
        return streamState !== null;
    }
    async getCurrentMessageId(sessionId) {
        const streamState = await this.streamStore.getStreamState(sessionId);
        return streamState?.messageId ?? null;
    }
    handleRelayChatStreamEvent(payload) {
        const { eventType, userId, sessionId, messageId, sequenceNumber } = payload;
        const timestamp = Date.now();
        let message;
        switch (eventType) {
            case 'execution-begin':
                message = {
                    type: 'chatHubExecutionBegin',
                    data: {
                        sessionId,
                        timestamp,
                    },
                };
                break;
            case 'execution-end':
                message = {
                    type: 'chatHubExecutionEnd',
                    data: {
                        sessionId,
                        status: payload.payload.status ?? 'success',
                        timestamp,
                    },
                };
                break;
            case 'begin':
                message = {
                    type: 'chatHubStreamBegin',
                    data: {
                        sessionId,
                        messageId,
                        sequenceNumber,
                        timestamp,
                        previousMessageId: payload.payload.previousMessageId ?? null,
                        retryOfMessageId: payload.payload.retryOfMessageId ?? null,
                        executionId: payload.payload.executionId ?? null,
                    },
                };
                break;
            case 'chunk':
                message = {
                    type: 'chatHubStreamChunk',
                    data: {
                        sessionId,
                        messageId,
                        sequenceNumber,
                        timestamp,
                        content: payload.payload.content ?? '',
                    },
                };
                break;
            case 'end':
                message = {
                    type: 'chatHubStreamEnd',
                    data: {
                        sessionId,
                        messageId,
                        sequenceNumber,
                        timestamp,
                        status: payload.payload.status ?? 'success',
                    },
                };
                break;
            case 'error':
                message = {
                    type: 'chatHubStreamError',
                    data: {
                        sessionId,
                        messageId,
                        sequenceNumber,
                        timestamp,
                        error: payload.payload.error ?? 'Unknown error',
                    },
                };
                break;
        }
        this.push.sendToUsers(message, [userId]);
    }
    async sendPushMessage(params, message, eventType) {
        const { userId } = params;
        this.push.sendToUsers(message, [userId]);
        if (this.shouldRelayViaPubSub()) {
            await this.relayViaPubSub(params, message, eventType);
        }
    }
    shouldRelayViaPubSub() {
        return this.instanceSettings.isMultiMain || this.executionsConfig.mode === 'queue';
    }
    async relayViaPubSub(params, message, eventType) {
        const payload = {};
        switch (message.type) {
            case 'chatHubStreamBegin':
                payload.previousMessageId = message.data.previousMessageId;
                payload.retryOfMessageId = message.data.retryOfMessageId;
                payload.executionId = message.data.executionId;
                break;
            case 'chatHubStreamChunk':
                payload.content = message.data.content;
                break;
            case 'chatHubStreamEnd':
                payload.status = message.data.status;
                break;
            case 'chatHubStreamError':
                payload.error = message.data.error;
                break;
        }
        await this.publisher.publishCommand({
            command: 'relay-chat-stream-event',
            payload: {
                eventType,
                userId: params.userId,
                sessionId: params.sessionId,
                messageId: params.messageId,
                sequenceNumber: message.data.sequenceNumber,
                payload,
            },
        });
    }
    async sendHumanMessage(params) {
        const message = {
            type: 'chatHubHumanMessageCreated',
            data: {
                sessionId: params.sessionId,
                messageId: params.messageId,
                previousMessageId: params.previousMessageId,
                content: params.content,
                attachments: params.attachments,
                timestamp: Date.now(),
            },
        };
        this.push.sendToUsers(message, [params.userId]);
        if (this.shouldRelayViaPubSub()) {
            await this.relayHumanMessageViaPubSub(params, message);
        }
    }
    async sendMessageEdit(params) {
        const message = {
            type: 'chatHubMessageEdited',
            data: {
                sessionId: params.sessionId,
                revisionOfMessageId: params.revisionOfMessageId,
                messageId: params.messageId,
                content: params.content,
                attachments: params.attachments,
                timestamp: Date.now(),
            },
        };
        this.push.sendToUsers(message, [params.userId]);
        if (this.shouldRelayViaPubSub()) {
            await this.relayMessageEditViaPubSub(params, message);
        }
    }
    async relayHumanMessageViaPubSub(params, _message) {
        await this.publisher.publishCommand({
            command: 'relay-chat-human-message',
            payload: {
                userId: params.userId,
                sessionId: params.sessionId,
                messageId: params.messageId,
                previousMessageId: params.previousMessageId,
                content: params.content,
                attachments: params.attachments,
            },
        });
    }
    async relayMessageEditViaPubSub(params, _message) {
        await this.publisher.publishCommand({
            command: 'relay-chat-message-edit',
            payload: {
                userId: params.userId,
                sessionId: params.sessionId,
                revisionOfMessageId: params.revisionOfMessageId,
                messageId: params.messageId,
                content: params.content,
                attachments: params.attachments,
            },
        });
    }
    handleRelayChatHumanMessage(payload) {
        const message = {
            type: 'chatHubHumanMessageCreated',
            data: {
                sessionId: payload.sessionId,
                messageId: payload.messageId,
                previousMessageId: payload.previousMessageId,
                content: payload.content,
                attachments: payload.attachments,
                timestamp: Date.now(),
            },
        };
        this.push.sendToUsers(message, [payload.userId]);
    }
    handleRelayChatMessageEdit(payload) {
        const message = {
            type: 'chatHubMessageEdited',
            data: {
                sessionId: payload.sessionId,
                revisionOfMessageId: payload.revisionOfMessageId,
                messageId: payload.messageId,
                content: payload.content,
                attachments: payload.attachments,
                timestamp: Date.now(),
            },
        };
        this.push.sendToUsers(message, [payload.userId]);
    }
};
exports.ChatStreamService = ChatStreamService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('relay-chat-stream-event', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatStreamService.prototype, "handleRelayChatStreamEvent", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('relay-chat-human-message', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatStreamService.prototype, "handleRelayChatHumanMessage", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('relay-chat-message-edit', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatStreamService.prototype, "handleRelayChatMessageEdit", null);
exports.ChatStreamService = ChatStreamService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, push_1.Push, publisher_service_1.Publisher, n8n_core_1.InstanceSettings, config_1.ExecutionsConfig, chat_stream_state_service_1.ChatStreamStateService])
], ChatStreamService);
//# sourceMappingURL=chat-stream.service.js.map