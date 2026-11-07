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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHubController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const sanitize_filename_1 = require("@n8n/utils/files/sanitize-filename");
const multer_1 = __importDefault(require("multer"));
const errors_1 = require("@n8n/errors");
const response_helper_1 = require("../../response-helper");
const chat_hub_agent_service_1 = require("./chat-hub-agent.service");
const chat_hub_extractor_1 = require("./chat-hub-extractor");
const chat_hub_tool_service_1 = require("./chat-hub-tool.service");
const chat_hub_upload_middleware_1 = require("./chat-hub-upload.middleware");
const chat_hub_attachment_service_1 = require("./chat-hub.attachment.service");
const chat_hub_models_service_1 = require("./chat-hub.models.service");
const chat_hub_service_1 = require("./chat-hub.service");
const chat_models_request_dto_1 = require("./dto/chat-models-request.dto");
const chatHubUploadMiddleware = di_1.Container.get(chat_hub_upload_middleware_1.ChatHubUploadMiddleware);
let ChatHubController = class ChatHubController {
    constructor(chatService, chatModelsService, chatAgentService, chatToolService, chatAttachmentService, moduleRegistry) {
        this.chatService = chatService;
        this.chatModelsService = chatModelsService;
        this.chatAgentService = chatAgentService;
        this.chatToolService = chatToolService;
        this.chatAttachmentService = chatAttachmentService;
        this.moduleRegistry = moduleRegistry;
    }
    checkChatEnabled(_req, res, next) {
        if (this.moduleRegistry.settings.get('chat-hub')?.enabled !== true) {
            (0, response_helper_1.sendErrorResponse)(res, new errors_1.ForbiddenError('Chat Hub is disabled'));
            return;
        }
        next();
    }
    async getModels(req, _res, payload) {
        return await this.chatModelsService.getModels(req.user, payload.credentials);
    }
    async getConversations(req, _res, query) {
        return await this.chatService.getConversations(req.user.id, query.limit, query.cursor, query.type);
    }
    async getConversationMessages(req, _res, sessionId) {
        return await this.chatService.getConversation(req.user.id, sessionId);
    }
    async getMessageAttachment(req, res, sessionId, messageId, index) {
        const attachmentIndex = Number.parseInt(index, 10);
        if (isNaN(attachmentIndex)) {
            throw new errors_1.BadRequestError('Invalid attachment index');
        }
        await this.chatService.ensureConversation(req.user.id, sessionId);
        const [{ mimeType, fileName }, attachmentAsStreamOrBuffer] = await this.chatAttachmentService.getAttachment(sessionId, messageId, attachmentIndex);
        res.setHeader('Content-Type', mimeType);
        if (attachmentAsStreamOrBuffer.fileSize) {
            res.setHeader('Content-Length', attachmentAsStreamOrBuffer.fileSize);
        }
        if (!mimeType || !api_types_1.ViewableMimeTypes.includes(mimeType.toLowerCase())) {
            res.setHeader('Content-Disposition', `attachment${fileName ? `; filename=${(0, sanitize_filename_1.sanitizeFilename)(fileName)}` : ''}`);
        }
        if (attachmentAsStreamOrBuffer.type === 'buffer') {
            res.send(attachmentAsStreamOrBuffer.buffer);
            return;
        }
        return await new Promise((resolve, reject) => {
            attachmentAsStreamOrBuffer.stream.on('end', resolve);
            attachmentAsStreamOrBuffer.stream.on('error', reject);
            attachmentAsStreamOrBuffer.stream.pipe(res);
        });
    }
    async sendMessage(req, _res, payload) {
        await this.chatService.sendHumanMessage(req.user, {
            ...payload,
            userId: req.user.id,
        }, (0, chat_hub_extractor_1.extractAuthenticationMetadata)(req));
        return {
            status: 'streaming',
        };
    }
    async sendMessageManual(req, _res, workflowId, payload) {
        const pushRef = req.headers['push-ref'];
        if (!pushRef) {
            throw new errors_1.BadRequestError('push-ref header is required for manual execution');
        }
        await this.chatService.sendHumanMessageManual(req.user, {
            ...payload,
            model: { provider: 'n8n', workflowId },
            credentials: {},
            userId: req.user.id,
        }, (0, chat_hub_extractor_1.extractAuthenticationMetadata)(req), pushRef);
        return {
            status: 'streaming',
        };
    }
    async editMessage(req, _res, sessionId, editId, payload) {
        await this.chatService.editMessage(req.user, {
            ...payload,
            sessionId,
            editId,
            userId: req.user.id,
        }, (0, chat_hub_extractor_1.extractAuthenticationMetadata)(req));
        return {
            status: 'streaming',
        };
    }
    async editMessageManual(req, _res, workflowId, sessionId, editId, payload) {
        const pushRef = req.headers['push-ref'];
        if (!pushRef) {
            throw new errors_1.BadRequestError('push-ref header is required for manual execution');
        }
        await this.chatService.editMessageManual(req.user, {
            ...payload,
            model: { provider: 'n8n', workflowId },
            credentials: {},
            sessionId,
            editId,
            userId: req.user.id,
        }, (0, chat_hub_extractor_1.extractAuthenticationMetadata)(req), pushRef);
        return {
            status: 'streaming',
        };
    }
    async regenerateMessage(req, _res, sessionId, retryId, payload) {
        await this.chatService.regenerateAIMessage(req.user, {
            ...payload,
            sessionId,
            retryId,
            userId: req.user.id,
        }, (0, chat_hub_extractor_1.extractAuthenticationMetadata)(req));
        return {
            status: 'streaming',
        };
    }
    async regenerateMessageManual(req, _res, workflowId, sessionId, retryId, payload) {
        const pushRef = req.headers['push-ref'];
        if (!pushRef) {
            throw new errors_1.BadRequestError('push-ref header is required for manual execution');
        }
        await this.chatService.regenerateAIMessageManual(req.user, {
            ...payload,
            model: { provider: 'n8n', workflowId },
            credentials: {},
            sessionId,
            retryId,
            userId: req.user.id,
        }, (0, chat_hub_extractor_1.extractAuthenticationMetadata)(req), pushRef);
        return {
            status: 'streaming',
        };
    }
    async stopGeneration(req, res, sessionId, messageId) {
        await this.chatService.stopGeneration(req.user, sessionId, messageId);
        res.status(204).send();
    }
    async reconnectToStream(req, _res, sessionId, query) {
        await this.chatService.ensureConversation(req.user.id, sessionId);
        const lastReceivedSequence = query.lastSequence ?? 0;
        return await this.chatService.reconnectToStream(sessionId, lastReceivedSequence);
    }
    async updateConversation(req, _res, sessionId, payload) {
        if (Object.keys(payload).length > 0) {
            await this.chatService.updateSession(req.user, sessionId, payload);
        }
        return await this.chatService.getConversation(req.user.id, sessionId);
    }
    async deleteConversation(req, res, sessionId) {
        await this.chatService.deleteSession(req.user.id, sessionId);
        res.status(204).send();
    }
    async getTools(req) {
        const tools = await this.chatToolService.getToolsByUserId(req.user.id);
        return tools.map((tool) => chat_hub_tool_service_1.ChatHubToolService.toDto(tool));
    }
    async createTool(req, _res, payload) {
        this.assertToolTypeAllowed(payload.definition.type, req.user);
        const tool = await this.chatToolService.createTool(req.user, payload);
        return chat_hub_tool_service_1.ChatHubToolService.toDto(tool);
    }
    async updateTool(req, _res, toolId, payload) {
        if (payload.definition?.type) {
            this.assertToolTypeAllowed(payload.definition.type, req.user);
        }
        const tool = await this.chatToolService.updateTool(toolId, req.user, payload);
        return chat_hub_tool_service_1.ChatHubToolService.toDto(tool);
    }
    async deleteTool(req, res, toolId) {
        await this.chatToolService.deleteTool(toolId, req.user.id);
        res.status(204).send();
    }
    async getAgent(req, _res, agentId) {
        return await this.chatAgentService.getAgentByIdAsDto(agentId, req.user.id);
    }
    async createAgent(req, _res, payload) {
        return await this.chatAgentService.createAgent(req.user, payload);
    }
    async updateAgent(req, _res, agentId, payload) {
        return await this.chatAgentService.updateAgent(agentId, req.user, payload);
    }
    async deleteAgent(req, res, agentId) {
        await this.chatAgentService.deleteAgent(agentId, req.user.id);
        res.status(204).send();
    }
    async uploadAgentFiles(req, _res, agentId) {
        if (req.fileUploadError) {
            const error = req.fileUploadError;
            if (error instanceof multer_1.default.MulterError) {
                throw new errors_1.BadRequestError(`File upload error: ${error.message}`);
            }
            throw error instanceof errors_1.BadRequestError ? error : new errors_1.BadRequestError('File upload failed');
        }
        const files = req.files ?? [];
        if (files.length === 0) {
            throw new errors_1.BadRequestError('No files uploaded');
        }
        return await this.chatAgentService.addFilesToAgent(agentId, req.user, files);
    }
    async deleteAgentFile(req, res, agentId, fileKnowledgeId) {
        await this.chatAgentService.deleteAgentFile(agentId, req.user, fileKnowledgeId);
        res.status(204).send();
    }
    assertToolTypeAllowed(type, user) {
        if (!(0, api_types_1.isChatHubToolTypeAllowed)(type, { isChatUser: false })) {
            throw new errors_1.BadRequestError(`Tool type "${type}" is not supported in the Chat Hub`);
        }
        if (!(0, api_types_1.isChatHubToolTypeAllowed)(type, { isChatUser: user.role.slug === 'global:chatUser' })) {
            throw new errors_1.BadRequestError(`Tool type "${type}" is not available for your role`);
        }
    }
};
exports.ChatHubController = ChatHubController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", void 0)
], ChatHubController.prototype, "checkChatEnabled", null);
__decorate([
    (0, decorators_1.Post)('/models'),
    (0, decorators_1.GlobalScope)('chatHub:message'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, chat_models_request_dto_1.ChatModelsRequestDto]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "getModels", null);
__decorate([
    (0, decorators_1.Get)('/conversations'),
    (0, decorators_1.GlobalScope)('chatHub:message'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ChatHubConversationsRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "getConversations", null);
__decorate([
    (0, decorators_1.Get)('/conversations/:sessionId'),
    (0, decorators_1.GlobalScope)('chatHub:message'),
    __param(2, (0, decorators_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "getConversationMessages", null);
__decorate([
    (0, decorators_1.Get)('/conversations/:sessionId/messages/:messageId/attachments/:index'),
    (0, decorators_1.GlobalScope)('chatHub:message'),
    __param(2, (0, decorators_1.Param)('sessionId')),
    __param(3, (0, decorators_1.Param)('messageId')),
    __param(4, (0, decorators_1.Param)('index')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "getMessageAttachment", null);
__decorate([
    (0, decorators_1.GlobalScope)('chatHub:message'),
    (0, decorators_1.Post)('/conversations/send'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ChatHubSendMessageRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "sendMessage", null);
__decorate([
    (0, decorators_1.ProjectScope)('workflow:execute'),
    (0, decorators_1.Post)('/conversations/manual/:workflowId/send'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ChatHubManualSendMessageRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "sendMessageManual", null);
__decorate([
    (0, decorators_1.GlobalScope)('chatHub:message'),
    (0, decorators_1.Post)('/conversations/:sessionId/messages/:messageId/edit'),
    __param(2, (0, decorators_1.Param)('sessionId')),
    __param(3, (0, decorators_1.Param)('messageId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.ChatHubEditMessageRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "editMessage", null);
__decorate([
    (0, decorators_1.ProjectScope)('workflow:execute'),
    (0, decorators_1.Post)('/conversations/manual/:workflowId/:sessionId/messages/:messageId/edit'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, (0, decorators_1.Param)('sessionId')),
    __param(4, (0, decorators_1.Param)('messageId')),
    __param(5, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, api_types_1.ChatHubManualEditMessageRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "editMessageManual", null);
__decorate([
    (0, decorators_1.GlobalScope)('chatHub:message'),
    (0, decorators_1.Post)('/conversations/:sessionId/messages/:messageId/regenerate'),
    __param(2, (0, decorators_1.Param)('sessionId')),
    __param(3, (0, decorators_1.Param)('messageId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.ChatHubRegenerateMessageRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "regenerateMessage", null);
__decorate([
    (0, decorators_1.ProjectScope)('workflow:execute'),
    (0, decorators_1.Post)('/conversations/manual/:workflowId/:sessionId/messages/:messageId/regenerate'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, (0, decorators_1.Param)('sessionId')),
    __param(4, (0, decorators_1.Param)('messageId')),
    __param(5, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, api_types_1.ChatHubManualRegenerateMessageRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "regenerateMessageManual", null);
__decorate([
    (0, decorators_1.GlobalScope)('chatHub:message'),
    (0, decorators_1.Post)('/conversations/:sessionId/messages/:messageId/stop'),
    __param(2, (0, decorators_1.Param)('sessionId')),
    __param(3, (0, decorators_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "stopGeneration", null);
__decorate([
    (0, decorators_1.GlobalScope)('chatHub:message'),
    (0, decorators_1.Post)('/conversations/:sessionId/reconnect'),
    __param(2, (0, decorators_1.Param)('sessionId')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ChatReconnectRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "reconnectToStream", null);
__decorate([
    (0, decorators_1.Patch)('/conversations/:sessionId'),
    (0, decorators_1.GlobalScope)('chatHub:message'),
    __param(2, (0, decorators_1.Param)('sessionId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ChatHubUpdateConversationRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "updateConversation", null);
__decorate([
    (0, decorators_1.Delete)('/conversations/:sessionId'),
    (0, decorators_1.GlobalScope)('chatHub:message'),
    __param(2, (0, decorators_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "deleteConversation", null);
__decorate([
    (0, decorators_1.Get)('/tools'),
    (0, decorators_1.GlobalScope)('chatHub:message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "getTools", null);
__decorate([
    (0, decorators_1.Post)('/tools'),
    (0, decorators_1.GlobalScope)('chatHub:message'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ChatHubCreateToolRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "createTool", null);
__decorate([
    (0, decorators_1.Patch)('/tools/:toolId'),
    (0, decorators_1.GlobalScope)('chatHub:message'),
    __param(2, (0, decorators_1.Param)('toolId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ChatHubUpdateToolRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "updateTool", null);
__decorate([
    (0, decorators_1.Delete)('/tools/:toolId'),
    (0, decorators_1.GlobalScope)('chatHub:message'),
    __param(2, (0, decorators_1.Param)('toolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "deleteTool", null);
__decorate([
    (0, decorators_1.Get)('/agents/:agentId'),
    (0, decorators_1.GlobalScope)('chatHubAgent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "getAgent", null);
__decorate([
    (0, decorators_1.Post)('/agents'),
    (0, decorators_1.GlobalScope)('chatHubAgent:create'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ChatHubCreateAgentRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "createAgent", null);
__decorate([
    (0, decorators_1.Post)('/agents/:agentId'),
    (0, decorators_1.GlobalScope)('chatHubAgent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ChatHubUpdateAgentRequest]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "updateAgent", null);
__decorate([
    (0, decorators_1.Delete)('/agents/:agentId'),
    (0, decorators_1.GlobalScope)('chatHubAgent:delete'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "deleteAgent", null);
__decorate([
    (0, decorators_1.Post)('/agents/:agentId/files', {
        middlewares: [chatHubUploadMiddleware.array('files')],
    }),
    (0, decorators_1.GlobalScope)('chatHubAgent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "uploadAgentFiles", null);
__decorate([
    (0, decorators_1.Delete)('/agents/:agentId/files/:fileKnowledgeId'),
    (0, decorators_1.GlobalScope)('chatHubAgent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('fileKnowledgeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ChatHubController.prototype, "deleteAgentFile", null);
exports.ChatHubController = ChatHubController = __decorate([
    (0, decorators_1.RestController)('/chat'),
    __metadata("design:paramtypes", [chat_hub_service_1.ChatHubService, chat_hub_models_service_1.ChatHubModelsService, chat_hub_agent_service_1.ChatHubAgentService, chat_hub_tool_service_1.ChatHubToolService, chat_hub_attachment_service_1.ChatHubAttachmentService, backend_common_1.ModuleRegistry])
], ChatHubController);
//# sourceMappingURL=chat-hub.controller.js.map