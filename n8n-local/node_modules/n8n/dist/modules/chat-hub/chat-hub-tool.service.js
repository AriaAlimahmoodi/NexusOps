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
exports.ChatHubToolService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const node_types_1 = require("../../node-types");
const deprecated_nodes_validation_service_1 = require("../../workflows/deprecated-nodes-validation.service");
const chat_hub_tool_repository_1 = require("./chat-hub-tool.repository");
let ChatHubToolService = class ChatHubToolService {
    constructor(logger, chatToolRepository, nodeTypes, deprecatedNodesValidationService) {
        this.logger = logger;
        this.chatToolRepository = chatToolRepository;
        this.nodeTypes = nodeTypes;
        this.deprecatedNodesValidationService = deprecatedNodesValidationService;
        this.logger = this.logger.scoped('chat-hub');
    }
    async getToolsByUserId(userId) {
        return await this.chatToolRepository.getManyByUserId(userId);
    }
    async getEnabledTools(userId, trx) {
        return await this.chatToolRepository.getEnabledByUserId(userId, trx);
    }
    async getToolDefinitionsForSession(sessionId, trx) {
        const tools = await this.chatToolRepository.getToolsForSession(sessionId, trx);
        return tools.map((t) => t.definition);
    }
    async getToolDefinitionsForAgent(agentId, trx) {
        const tools = await this.chatToolRepository.getToolsForAgent(agentId, trx);
        return tools.map((t) => t.definition);
    }
    async getToolIdsForSession(sessionId, trx) {
        return await this.chatToolRepository.getToolIdsForSession(sessionId, trx);
    }
    async getToolIdsForAgent(agentId, trx) {
        return await this.chatToolRepository.getToolIdsForAgent(agentId, trx);
    }
    async setSessionTools(sessionId, ownerId, toolIds, trx) {
        await this.ensureToolsOwnedBy(ownerId, toolIds, trx);
        await this.chatToolRepository.setSessionTools(sessionId, [...new Set(toolIds)], trx);
    }
    async setAgentTools(agentId, ownerId, toolIds, trx) {
        await this.ensureToolsOwnedBy(ownerId, toolIds, trx);
        await this.chatToolRepository.setAgentTools(agentId, [...new Set(toolIds)], trx);
    }
    async ensureToolsOwnedBy(userId, toolIds, trx) {
        const uniqueIds = [...new Set(toolIds)];
        if (uniqueIds.length === 0)
            return;
        const ownedTools = await this.chatToolRepository.getByIds(uniqueIds, userId, trx);
        if (ownedTools.length !== uniqueIds.length) {
            throw new errors_1.NotFoundError('Chat hub tool not found');
        }
    }
    validateToolExpressions(definition) {
        let allowedExpressions;
        try {
            const nodeType = this.nodeTypes.getByNameAndVersion(definition.type, definition.typeVersion);
            allowedExpressions = (0, n8n_workflow_1.collectExpressionDefaults)(nodeType.description.properties);
        }
        catch {
        }
        const violations = (0, n8n_workflow_1.findDisallowedChatToolExpressions)(definition.parameters, '', allowedExpressions);
        if (violations.length > 0) {
            const paths = violations.map((v) => v.path).join(', ');
            throw new errors_1.BadRequestError(`Expressions are not supported in tool parameters (found at: ${paths}). Only $fromAI() expressions are supported.`);
        }
    }
    async createTool(user, data) {
        const definition = data.definition;
        this.validateToolExpressions(definition);
        this.deprecatedNodesValidationService.validateOnCreate([definition]);
        const tool = await this.chatToolRepository.createTool({
            id: definition.id,
            name: definition.name,
            type: definition.type,
            typeVersion: definition.typeVersion ?? 1,
            ownerId: user.id,
            definition,
            enabled: true,
        });
        this.logger.debug(`Chat hub tool created: ${tool.id} by user ${user.id}`);
        return tool;
    }
    async updateTool(id, user, updates, trx) {
        const tool = await (0, db_1.withTransaction)(this.chatToolRepository.manager, trx, async (em) => {
            const existingTool = await this.chatToolRepository.getOneById(id, user.id, em);
            if (!existingTool) {
                throw new errors_1.NotFoundError('Chat hub tool not found');
            }
            const updateData = {};
            if (updates.definition !== undefined) {
                this.validateToolExpressions(updates.definition);
                this.deprecatedNodesValidationService.validateOnUpdate([updates.definition], [existingTool.definition]);
                updateData.definition = updates.definition;
                updateData.name = updates.definition.name;
                updateData.type = updates.definition.type;
                updateData.typeVersion = updates.definition.typeVersion ?? 1;
            }
            if (updates.enabled !== undefined) {
                if (updates.enabled) {
                    this.deprecatedNodesValidationService.validateOnCreate([
                        updates.definition ?? existingTool.definition,
                    ]);
                }
                updateData.enabled = updates.enabled;
            }
            return await this.chatToolRepository.updateTool(id, updateData, em);
        });
        this.logger.debug(`Chat hub tool updated: ${id} by user ${user.id}`);
        return tool;
    }
    async deleteTool(id, userId, trx) {
        await (0, db_1.withTransaction)(this.chatToolRepository.manager, trx, async (em) => {
            const existingTool = await this.chatToolRepository.getOneById(id, userId, em);
            if (!existingTool) {
                throw new errors_1.NotFoundError('Chat hub tool not found');
            }
            await this.chatToolRepository.deleteTool(id, em);
        });
        this.logger.debug(`Chat hub tool deleted: ${id} by user ${userId}`);
    }
    static toDto(tool) {
        return {
            definition: tool.definition,
            enabled: tool.enabled,
        };
    }
};
exports.ChatHubToolService = ChatHubToolService;
exports.ChatHubToolService = ChatHubToolService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, chat_hub_tool_repository_1.ChatHubToolRepository, node_types_1.NodeTypes, deprecated_nodes_validation_service_1.DeprecatedNodesValidationService])
], ChatHubToolService);
//# sourceMappingURL=chat-hub-tool.service.js.map