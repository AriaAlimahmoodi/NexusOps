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
exports.ChatHubTitleService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const execution_persistence_1 = require("../../executions/execution-persistence");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const chat_hub_agent_service_1 = require("./chat-hub-agent.service");
const chat_hub_credentials_service_1 = require("./chat-hub-credentials.service");
const chat_hub_execution_service_1 = require("./chat-hub-execution.service");
const chat_hub_workflow_service_1 = require("./chat-hub-workflow.service");
const chat_hub_constants_1 = require("./chat-hub.constants");
const chat_hub_settings_service_1 = require("./chat-hub.settings.service");
const chat_session_repository_1 = require("./chat-session.repository");
let ChatHubTitleService = class ChatHubTitleService {
    constructor(logger, chatHubWorkflowService, chatHubCredentialsService, workflowFinderService, executionService, sessionRepository, executionPersistence, chatHubAgentService, chatHubSettingsService) {
        this.logger = logger;
        this.chatHubWorkflowService = chatHubWorkflowService;
        this.chatHubCredentialsService = chatHubCredentialsService;
        this.workflowFinderService = workflowFinderService;
        this.executionService = executionService;
        this.sessionRepository = sessionRepository;
        this.executionPersistence = executionPersistence;
        this.chatHubAgentService = chatHubAgentService;
        this.chatHubSettingsService = chatHubSettingsService;
        this.logger = this.logger.scoped('chat-hub');
    }
    async generateSessionTitle(user, sessionId, humanMessage, attachments, credentials, model) {
        const { executionData, workflowData } = await this.prepareTitleGenerationWorkflow(user, sessionId, humanMessage, attachments, credentials, model);
        try {
            const title = await this.runTitleWorkflowAndGetTitle(user, workflowData, executionData);
            if (title) {
                await this.sessionRepository.updateChatSession(sessionId, { title });
            }
        }
        finally {
            await this.chatHubWorkflowService.deleteChatWorkflow(workflowData.id);
        }
    }
    async prepareTitleGenerationWorkflow(user, sessionId, humanMessage, attachments, incomingCredentials, incomingModel) {
        return await this.sessionRepository.runInTransaction({}, async (trx, ctx) => {
            const { resolvedCredentials, resolvedModel, credentialId, projectId } = await this.resolveCredentialsAndModelForTitle(user, incomingModel, incomingCredentials, trx);
            if (!credentialId || !projectId) {
                throw new errors_1.BadRequestError('Could not determine credentials for title generation');
            }
            this.logger.debug(`Using credential ID ${credentialId} for title generation in project ${projectId}, model ${(0, n8n_workflow_1.jsonStringify)(resolvedModel)}`);
            const providerSettings = resolvedModel.provider !== 'n8n' && resolvedModel.provider !== 'custom-agent'
                ? await this.chatHubSettingsService.getProviderSettings(resolvedModel.provider, trx)
                : undefined;
            return await this.chatHubWorkflowService.createTitleGenerationWorkflow(user.id, sessionId, projectId, humanMessage, attachments, resolvedCredentials, resolvedModel, ctx, providerSettings);
        });
    }
    async runTitleWorkflowAndGetTitle(user, workflowData, executionData) {
        const { executionId } = await this.executionService.execute(user, workflowData, executionData);
        await this.executionService.waitForExecutionCompletion(executionId);
        const execution = await this.executionPersistence.findWithUnflattenedData(executionId, [
            workflowData.id,
        ]);
        if (!execution) {
            throw new n8n_workflow_1.OperationalError(`Could not find execution with ID ${executionId}`);
        }
        if (!execution.status || execution.status !== 'success') {
            const message = this.executionService.extractErrorMessage(execution.data) ??
                'Failed to generate a response';
            throw new n8n_workflow_1.OperationalError(message);
        }
        const title = this.executionService.extractMessage(execution, 'lastNode');
        return title ?? null;
    }
    async resolveCredentialsAndModelForTitle(user, model, credentials, trx) {
        if (model.provider === 'n8n') {
            return await this.resolveFromN8nWorkflow(user, model, trx);
        }
        if (model.provider === 'custom-agent') {
            return await this.resolveFromCustomAgent(user, model, trx);
        }
        const credentialId = this.chatHubCredentialsService.findProviderCredential(model.provider, credentials);
        const { id: projectId } = await this.chatHubCredentialsService.findPersonalProject(user, trx);
        return {
            resolvedCredentials: credentials,
            resolvedModel: model,
            credentialId,
            projectId,
        };
    }
    async resolveFromN8nWorkflow(user, { workflowId }, trx) {
        const workflowEntity = await this.workflowFinderService.findWorkflowForUser(workflowId, user, ['workflow:execute-chat'], { includeTags: false, includeParentFolder: false, includeActiveVersion: true, em: trx });
        if (!workflowEntity?.activeVersion) {
            throw new n8n_workflow_1.UserError('Workflow not found for title generation');
        }
        const modelNodes = this.findSupportedLLMNodes(workflowEntity.activeVersion.nodes);
        this.logger.debug(`Found ${modelNodes.length} LLM nodes in workflow ${workflowEntity.id} for title generation`);
        if (modelNodes.length === 0) {
            throw new n8n_workflow_1.UserError('No supported Model nodes found in workflow for title generation');
        }
        const modelNode = modelNodes[0];
        const llmModel = modelNode.node.parameters?.model?.value;
        if (!llmModel) {
            throw new n8n_workflow_1.UserError(`No model set on Model node "${modelNode.node.name}" for title generation`);
        }
        if (typeof llmModel !== 'string' || llmModel.length === 0 || llmModel.startsWith('=')) {
            throw new n8n_workflow_1.UserError(`Invalid model set on Model node "${modelNode.node.name}" for title generation`);
        }
        const llmCredentials = modelNode.node.credentials;
        if (!llmCredentials) {
            throw new n8n_workflow_1.UserError(`No credentials found on Model node "${modelNode.node.name}" for title generation`);
        }
        const { credentialId, projectId } = await this.chatHubCredentialsService.findWorkflowCredentialAndProject(modelNode.provider, llmCredentials, workflowId);
        const resolvedModel = {
            provider: modelNode.provider,
            model: llmModel,
        };
        const resolvedCredentials = {
            [api_types_1.PROVIDER_CREDENTIAL_TYPE_MAP[modelNode.provider]]: {
                id: credentialId,
                name: '',
            },
        };
        return { resolvedCredentials, resolvedModel, credentialId, projectId };
    }
    findSupportedLLMNodes(nodes) {
        return nodes.reduce((acc, node) => {
            const supportedProvider = Object.entries(chat_hub_constants_1.PROVIDER_NODE_TYPE_MAP).find(([_provider, { name }]) => node.type === name);
            if (supportedProvider) {
                const [provider] = supportedProvider;
                acc.push({ node, provider: provider });
            }
            return acc;
        }, []);
    }
    async resolveFromCustomAgent(user, model, trx) {
        const agent = await this.chatHubAgentService.getAgentById(model.agentId, user.id, trx);
        if (!agent) {
            throw new errors_1.BadRequestError('Agent not found for title generation');
        }
        if (!agent.credentialId) {
            throw new errors_1.BadRequestError('Credentials not set for agent');
        }
        const resolvedModel = {
            provider: agent.provider,
            model: agent.model,
        };
        const resolvedCredentials = {
            [api_types_1.PROVIDER_CREDENTIAL_TYPE_MAP[agent.provider]]: {
                id: agent.credentialId,
                name: '',
            },
        };
        const credentialId = this.chatHubCredentialsService.findProviderCredential(agent.provider, resolvedCredentials);
        const { id: projectId } = await this.chatHubCredentialsService.findPersonalProject(user, trx);
        return { resolvedCredentials, resolvedModel, credentialId, projectId };
    }
};
exports.ChatHubTitleService = ChatHubTitleService;
exports.ChatHubTitleService = ChatHubTitleService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, chat_hub_workflow_service_1.ChatHubWorkflowService, chat_hub_credentials_service_1.ChatHubCredentialsService, workflow_finder_service_1.WorkflowFinderService, chat_hub_execution_service_1.ChatHubExecutionService, chat_session_repository_1.ChatHubSessionRepository, execution_persistence_1.ExecutionPersistence, chat_hub_agent_service_1.ChatHubAgentService, chat_hub_settings_service_1.ChatHubSettingsService])
], ChatHubTitleService);
//# sourceMappingURL=chat-hub-title.service.js.map