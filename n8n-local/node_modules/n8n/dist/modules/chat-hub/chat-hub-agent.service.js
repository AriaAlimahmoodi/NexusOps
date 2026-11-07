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
exports.ChatHubAgentService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const promises_1 = require("fs/promises");
const nanoid_1 = require("nanoid");
const uuid_1 = require("uuid");
const errors_1 = require("@n8n/errors");
const dynamic_node_parameters_service_1 = require("../../services/dynamic-node-parameters.service");
const workflow_execute_additional_data_1 = require("../../workflow-execute-additional-data");
const workflow_execution_service_1 = require("../../workflows/workflow-execution.service");
const chat_hub_agent_repository_1 = require("./chat-hub-agent.repository");
const chat_hub_credentials_service_1 = require("./chat-hub-credentials.service");
const chat_hub_execution_service_1 = require("./chat-hub-execution.service");
const chat_hub_tool_service_1 = require("./chat-hub-tool.service");
const chat_hub_workflow_service_1 = require("./chat-hub-workflow.service");
const chat_hub_attachment_service_1 = require("./chat-hub.attachment.service");
const chat_hub_constants_1 = require("./chat-hub.constants");
const chat_hub_settings_service_1 = require("./chat-hub.settings.service");
let ChatHubAgentService = class ChatHubAgentService {
    constructor(logger, chatAgentRepository, chatHubCredentialsService, chatHubAttachmentService, chatHubWorkflowService, chatHubExecutionService, workflowExecutionService, chatHubSettingsService, dynamicNodeParametersService, chatHubToolService) {
        this.logger = logger;
        this.chatAgentRepository = chatAgentRepository;
        this.chatHubCredentialsService = chatHubCredentialsService;
        this.chatHubAttachmentService = chatHubAttachmentService;
        this.chatHubWorkflowService = chatHubWorkflowService;
        this.chatHubExecutionService = chatHubExecutionService;
        this.workflowExecutionService = workflowExecutionService;
        this.chatHubSettingsService = chatHubSettingsService;
        this.dynamicNodeParametersService = dynamicNodeParametersService;
        this.chatHubToolService = chatHubToolService;
        this.logger = this.logger.scoped('chat-hub');
    }
    async getAgentsByUserIdAsModels(userId) {
        const agents = await this.getAgentsByUserId(userId);
        return agents.map((agent) => this.convertAgentEntityToModel(agent));
    }
    convertAgentEntityToModel(agent) {
        const suggestedPrompts = agent.suggestedPrompts.filter((p) => p.text.trim().length > 0);
        return {
            name: agent.name,
            description: agent.description ?? null,
            icon: agent.icon,
            model: {
                provider: 'custom-agent',
                agentId: agent.id,
            },
            createdAt: agent.createdAt.toISOString(),
            updatedAt: agent.updatedAt.toISOString(),
            metadata: (0, chat_hub_constants_1.getModelMetadata)(agent.provider, agent.model),
            groupName: null,
            groupIcon: null,
            ...(suggestedPrompts.length > 0 ? { suggestedPrompts } : {}),
        };
    }
    async getAgentsByUserId(userId) {
        return await this.chatAgentRepository.getManyByUserId(userId);
    }
    async getAgentById(id, userId, trx) {
        const agent = await this.chatAgentRepository.getOneById(id, userId, trx);
        if (!agent) {
            throw new errors_1.NotFoundError('Chat agent not found');
        }
        return agent;
    }
    async getAgentByIdAsDto(id, userId) {
        const agent = await this.getAgentById(id, userId);
        const toolIds = await this.chatHubToolService.getToolIdsForAgent(agent.id);
        return this.toDto(agent, toolIds);
    }
    async createAgent(user, data) {
        await this.chatHubCredentialsService.ensureCredentialAccess(user, data.credentialId);
        const id = (0, uuid_1.v4)();
        const agent = await this.chatAgentRepository.runInTransaction({}, async (trx) => {
            const created = await this.chatAgentRepository.createAgent({
                id,
                name: data.name,
                description: data.description ?? null,
                icon: data.icon,
                suggestedPrompts: data.suggestedPrompts ?? [],
                systemPrompt: data.systemPrompt,
                ownerId: user.id,
                credentialId: data.credentialId,
                provider: data.provider,
                model: data.model,
                files: [],
            }, trx);
            if (data.toolIds.length > 0) {
                await this.chatHubToolService.setAgentTools(id, user.id, data.toolIds, trx);
            }
            return created;
        });
        this.logger.debug(`Chat agent created: ${id} by user ${user.id}`);
        return this.toDto(agent, [...new Set(data.toolIds)]);
    }
    async updateAgent(id, user, updates) {
        const existingAgent = await this.chatAgentRepository.getOneById(id, user.id);
        if (!existingAgent) {
            throw new errors_1.NotFoundError('Chat agent not found');
        }
        if (updates.credentialId !== undefined && updates.credentialId !== null) {
            await this.chatHubCredentialsService.ensureCredentialAccess(user, updates.credentialId);
        }
        const updateData = {};
        if (updates.name !== undefined)
            updateData.name = updates.name;
        if (updates.description !== undefined)
            updateData.description = updates.description ?? null;
        if (updates.icon !== undefined)
            updateData.icon = updates.icon;
        if (updates.suggestedPrompts !== undefined)
            updateData.suggestedPrompts = updates.suggestedPrompts ?? [];
        if (updates.systemPrompt !== undefined)
            updateData.systemPrompt = updates.systemPrompt;
        if (updates.credentialId !== undefined)
            updateData.credentialId = updates.credentialId ?? null;
        if (updates.provider !== undefined)
            updateData.provider = updates.provider;
        if (updates.model !== undefined)
            updateData.model = updates.model ?? null;
        const { toolIds: newToolIds } = updates;
        const agent = await this.chatAgentRepository.runInTransaction({}, async (trx) => {
            if (newToolIds !== undefined) {
                await this.chatHubToolService.setAgentTools(id, user.id, newToolIds, trx);
            }
            return await this.chatAgentRepository.updateAgent(id, updateData, trx);
        });
        this.logger.debug(`Chat agent updated: ${id} by user ${user.id}`);
        const toolIds = await this.chatHubToolService.getToolIdsForAgent(agent.id);
        return this.toDto(agent, toolIds);
    }
    toDto(agent, toolIds) {
        return {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            icon: agent.icon,
            suggestedPrompts: agent.suggestedPrompts,
            systemPrompt: agent.systemPrompt,
            ownerId: agent.ownerId,
            credentialId: agent.credentialId,
            provider: agent.provider,
            model: agent.model,
            files: agent.files,
            toolIds,
            createdAt: agent.createdAt.toISOString(),
            updatedAt: agent.updatedAt.toISOString(),
        };
    }
    async deleteAgent(id, userId) {
        const existingAgent = await this.chatAgentRepository.getOneById(id, userId);
        if (!existingAgent) {
            throw new errors_1.NotFoundError('Chat agent not found');
        }
        try {
            await this.deleteEmbeddingsByAgentId(userId, id);
        }
        catch (error) {
            this.logger.warn(`Could not delete embeddings from vector store for agent ${id}. Proceeding with agent deletion.`, { error });
        }
        await this.chatAgentRepository.deleteAgent(id);
        this.logger.debug(`Chat agent deleted: ${id} by user ${userId}`);
    }
    async ensureSemanticSearchOptions() {
        const options = await this.chatHubSettingsService.getSemanticSearchOptions();
        if (options === null) {
            throw new errors_1.BadRequestError('No vector store credential configured. Please set up a vector store credential in the Chat Hub settings.');
        }
        return options;
    }
    async insertEmbeddings(user, agentId, files, workflowId) {
        if (files.length === 0) {
            return;
        }
        try {
            const settings = await this.ensureSemanticSearchOptions();
            const { workflowData, executionData } = await this.chatAgentRepository.runInTransaction({}, async (trx, ctx) => {
                const project = await this.chatHubCredentialsService.findPersonalProject(user, trx);
                return await this.chatHubWorkflowService.createEmbeddingsInsertionWorkflow(user, project.id, files, agentId, settings, ctx, workflowId);
            });
            const execution = await this.workflowExecutionService.executeChatWorkflow(user, workflowData, executionData, undefined, false, 'chat');
            await this.chatHubExecutionService.waitForExecutionCompletion(execution.executionId);
            await this.chatHubExecutionService.ensureWasSuccessfulOrThrow(execution.executionId, 'Could not insert documents');
        }
        finally {
            await this.chatHubWorkflowService.deleteChatWorkflow(workflowId);
        }
    }
    async deleteAllEmbeddingsForUser(userId) {
        const options = await this.chatHubSettingsService.getSemanticSearchOptions();
        if (!options) {
            return;
        }
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({ userId });
        await this.dynamicNodeParametersService.getActionResult('deleteDocuments', '', additionalData, { name: options.vectorStore.nodeType, version: 1 }, {}, JSON.stringify({ filter: {} }), {
            [options.vectorStore.credentialType]: { id: options.vectorStore.credentialId, name: '' },
        });
        this.logger.debug(`Deleted all embeddings for user ${userId} from vector store`);
    }
    async deleteEmbeddingsByAgentId(userId, agentId) {
        const settings = await this.chatHubSettingsService.getSemanticSearchOptions();
        if (!settings) {
            return;
        }
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({ userId });
        await this.dynamicNodeParametersService.getActionResult('deleteDocuments', '', additionalData, { name: settings.vectorStore.nodeType, version: 1 }, {}, JSON.stringify({ filter: { agentId } }), {
            [settings.vectorStore.credentialType]: { id: settings.vectorStore.credentialId, name: '' },
        });
        this.logger.debug(`Deleted embeddings for agent ${agentId} from vector store`);
    }
    async deleteEmbeddingsByKnowledgeId(user, agentId, fileKnowledgeId) {
        const settings = await this.ensureSemanticSearchOptions();
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({ userId: user.id });
        await this.dynamicNodeParametersService.getActionResult('deleteDocuments', '', additionalData, { name: settings.vectorStore.nodeType, version: 1 }, {}, JSON.stringify({ filter: { agentId, fileKnowledgeId } }), {
            [settings.vectorStore.credentialType]: { id: settings.vectorStore.credentialId, name: '' },
        });
        this.logger.debug(`Deleted embeddings from vector store (agentId: ${agentId}, knowledgeId: ${fileKnowledgeId})`);
    }
    async addFilesToAgent(agentId, user, files) {
        const agent = await this.getAgentById(agentId, user.id);
        const { knowledgeItems, pdfFilesToInsert, workflowId } = await this.prepareFilesForIndexing(files);
        const updatedAgent = await this.chatAgentRepository.updateAgent(agentId, {
            files: agent.files.concat(knowledgeItems),
        });
        void this.runIndexingInBackground(agentId, knowledgeItems.map((i) => i.id), pdfFilesToInsert, workflowId, user);
        const toolIds = await this.chatHubToolService.getToolIdsForAgent(agentId);
        this.logger.debug(`Added ${files.length} file(s) to agent ${agentId} by user ${user.id}`);
        return this.toDto(updatedAgent, toolIds);
    }
    async runIndexingInBackground(agentId, knowledgeIds, pdfFilesToInsert, workflowId, user) {
        try {
            await this.insertEmbeddings(user, agentId, pdfFilesToInsert, workflowId);
            await this.updateKnowledgeItemStatuses(agentId, knowledgeIds, 'indexed');
            this.logger.debug(`Indexed ${knowledgeIds.length} file(s) for agent ${agentId}`);
        }
        catch (error) {
            this.logger.error(`Failed to index files for agent ${agentId}`, { error });
            const errorMessage = error instanceof Error ? error.message : String(error);
            await this.updateKnowledgeItemStatuses(agentId, knowledgeIds, 'error', errorMessage).catch((updateError) => {
                this.logger.error(`Failed to update file statuses to error for agent ${agentId}`, {
                    error: updateError,
                });
            });
        }
    }
    async updateKnowledgeItemStatuses(agentId, knowledgeIds, status, error) {
        const agent = await this.chatAgentRepository.findOne({ where: { id: agentId } });
        if (!agent) {
            return;
        }
        const updatedFiles = agent.files.map((f) => knowledgeIds.includes(f.id) ? { ...f, status, error } : f);
        await this.chatAgentRepository.updateAgent(agentId, { files: updatedFiles });
    }
    async deleteAgentFile(agentId, user, fileKnowledgeId) {
        const agent = await this.getAgentById(agentId, user.id);
        const fileItem = agent.files.find((f) => f.id === fileKnowledgeId);
        if (!fileItem) {
            throw new errors_1.NotFoundError('File not found');
        }
        try {
            await this.deleteEmbeddingsByKnowledgeId(user, agentId, fileItem.id);
        }
        catch (error) {
            this.logger.warn(`Could not delete embeddings from vector store for file "${fileItem.fileName}" (agentId: ${agentId}, knowledgeId: ${fileItem.id}). Proceeding with file deletion.`, { error });
        }
        await this.chatAgentRepository.updateAgent(agentId, {
            files: agent.files.filter((f) => f.id !== fileKnowledgeId),
        });
        this.logger.debug(`Deleted file "${fileItem.fileName}" from agent ${agentId} by user ${user.id}`);
    }
    async prepareFilesForIndexing(files) {
        const knowledgeItems = [];
        const pdfFilesToInsert = [];
        const workflowId = (0, uuid_1.v4)();
        const settings = await this.ensureSemanticSearchOptions();
        for (const file of files) {
            if (file.mimetype !== 'application/pdf') {
                throw new errors_1.BadRequestError(`Unsupported mime-type: ${file.mimetype}`);
            }
        }
        for (const file of files) {
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const buffer = file.buffer ?? (await (0, promises_1.readFile)(file.path));
            if (file.path) {
                await (0, promises_1.unlink)(file.path).catch((error) => {
                    this.logger.warn(`Could not unlink file in temporary path. File: ${originalName}`, {
                        error,
                    });
                });
            }
            const storedFile = await this.chatHubAttachmentService.storeTemporaryExecutionFile(workflowId, buffer, file.mimetype, originalName);
            const knowledgeId = (0, nanoid_1.nanoid)();
            knowledgeItems.push({
                id: knowledgeId,
                type: 'embedding',
                mimeType: file.mimetype,
                fileName: storedFile.fileName ?? originalName,
                provider: settings.embeddingModel.provider,
                status: 'indexing',
                createdAt: new Date().toISOString(),
            });
            pdfFilesToInsert.push({ attachment: storedFile, knowledgeId });
        }
        return { knowledgeItems, pdfFilesToInsert, workflowId };
    }
};
exports.ChatHubAgentService = ChatHubAgentService;
exports.ChatHubAgentService = ChatHubAgentService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, chat_hub_agent_repository_1.ChatHubAgentRepository, chat_hub_credentials_service_1.ChatHubCredentialsService, chat_hub_attachment_service_1.ChatHubAttachmentService, chat_hub_workflow_service_1.ChatHubWorkflowService, chat_hub_execution_service_1.ChatHubExecutionService, workflow_execution_service_1.WorkflowExecutionService, chat_hub_settings_service_1.ChatHubSettingsService, dynamic_node_parameters_service_1.DynamicNodeParametersService, chat_hub_tool_service_1.ChatHubToolService])
], ChatHubAgentService);
//# sourceMappingURL=chat-hub-agent.service.js.map