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
exports.ChatHubMessageRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const chat_hub_message_entity_1 = require("./chat-hub-message.entity");
const chat_session_repository_1 = require("./chat-session.repository");
let ChatHubMessageRepository = class ChatHubMessageRepository extends db_1.BaseRepository {
    constructor(dataSource, chatSessionRepository, transactionRunner) {
        super(chat_hub_message_entity_1.ChatHubMessage, dataSource.manager, transactionRunner);
        this.chatSessionRepository = chatSessionRepository;
    }
    async createChatMessage(message, trx) {
        const messageId = message.id;
        const sessionId = message.sessionId;
        if (typeof messageId === 'function' || !messageId) {
            throw new n8n_workflow_1.UnexpectedError('Message ID is required and must be a string value');
        }
        if (typeof sessionId === 'function' || !sessionId) {
            throw new n8n_workflow_1.UnexpectedError('Session ID is required and must be a string value');
        }
        return await (0, db_1.withTransaction)(this.manager, trx, async (em) => {
            await em.insert(chat_hub_message_entity_1.ChatHubMessage, message);
            await this.chatSessionRepository.updateChatSession(sessionId, { lastMessageAt: new Date() }, em);
        });
    }
    async createHumanMessage(payload, attachments, user, previousMessageId, model, revisionOfMessageId, trx) {
        await this.createChatMessage({
            id: payload.messageId,
            sessionId: payload.sessionId,
            type: 'human',
            status: 'success',
            content: payload.message,
            previousMessageId,
            revisionOfMessageId,
            name: user.firstName || 'User',
            attachments,
            ...model,
        }, trx);
    }
    async createAIMessage({ id, sessionId, executionId, previousMessageId, content, model, retryOfMessageId, status, }) {
        await this.createChatMessage({
            id,
            sessionId,
            previousMessageId,
            executionId: executionId ? parseInt(executionId, 10) : null,
            type: 'ai',
            name: 'AI',
            status,
            content,
            retryOfMessageId,
            ...model,
        });
    }
    async updateChatMessage(id, fields, trx) {
        const em = trx ?? this.manager;
        return await em.update(chat_hub_message_entity_1.ChatHubMessage, { id }, fields);
    }
    async deleteChatMessage(id, trx) {
        const em = trx ?? this.manager;
        return await em.delete(chat_hub_message_entity_1.ChatHubMessage, { id });
    }
    async getManyBySessionId(sessionId, trx) {
        const em = trx ?? this.manager;
        return await em.find(chat_hub_message_entity_1.ChatHubMessage, {
            where: { sessionId },
            order: { createdAt: 'ASC', id: 'DESC' },
        });
    }
    async getOneById(id, sessionId, relations = [], trx) {
        const em = trx ?? this.manager;
        return await em.findOne(chat_hub_message_entity_1.ChatHubMessage, {
            where: { id, sessionId },
            relations,
        });
    }
};
exports.ChatHubMessageRepository = ChatHubMessageRepository;
exports.ChatHubMessageRepository = ChatHubMessageRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, chat_session_repository_1.ChatHubSessionRepository, db_1.TransactionRunner])
], ChatHubMessageRepository);
//# sourceMappingURL=chat-message.repository.js.map