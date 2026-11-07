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
exports.AgentsService = void 0;
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const uuid_1 = require("uuid");
const credentials_service_1 = require("../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const n8n_workflow_1 = require("n8n-workflow");
const get_agent_or_throw_1 = require("./utils/get-agent-or-throw");
const agent_chat_attachment_service_1 = require("./agent-chat-attachment.service");
const agent_execution_service_1 = require("./agent-execution.service");
const agent_knowledge_service_1 = require("./agent-knowledge.service");
const agent_policy_service_1 = require("./agent-policy.service");
const agent_runtime_cache_service_1 = require("./agent-runtime-cache.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_test_chat_service_1 = require("./agent-test-chat.service");
const agents_settings_service_1 = require("./agents-settings.service");
const chat_integration_service_1 = require("./integrations/chat-integration.service");
const n8n_chat_flag_service_1 = require("./integrations/platforms/n8n-chat-flag.service");
const agent_config_composition_1 = require("./json-config/agent-config-composition");
const agent_document_1 = require("./json-config/agent-document");
const sanitize_unknown_agent_credentials_1 = require("./json-config/sanitize-unknown-agent-credentials");
const agent_task_repository_1 = require("./repositories/agent-task.repository");
const agent_repository_1 = require("./repositories/agent.repository");
const agent_ref_1 = require("./utils/agent-ref");
const sub_agent_cleanup_service_1 = require("./sub-agents/sub-agent-cleanup.service");
const agent_credential_provider_1 = require("./utils/agent-credential-provider");
let AgentsService = class AgentsService {
    constructor(logger, agentRepository, projectRelationRepository, agentChatAttachmentService, agentKnowledgeService, runtimeCacheService, testChatService, agentTaskRepository, subAgentCleanupService, eventService, agentExecutionService, credentialsService, projectScopeService, settingsService, agentPolicyService, agentSkillRefs, transactionRunner, n8nChatFlag) {
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.projectRelationRepository = projectRelationRepository;
        this.agentChatAttachmentService = agentChatAttachmentService;
        this.agentKnowledgeService = agentKnowledgeService;
        this.runtimeCacheService = runtimeCacheService;
        this.testChatService = testChatService;
        this.agentTaskRepository = agentTaskRepository;
        this.subAgentCleanupService = subAgentCleanupService;
        this.eventService = eventService;
        this.agentExecutionService = agentExecutionService;
        this.credentialsService = credentialsService;
        this.projectScopeService = projectScopeService;
        this.settingsService = settingsService;
        this.agentPolicyService = agentPolicyService;
        this.agentSkillRefs = agentSkillRefs;
        this.transactionRunner = transactionRunner;
        this.n8nChatFlag = n8nChatFlag;
    }
    async create(projectId, name, options) {
        return (await this.createOrAdopt(projectId, name, options)).agent;
    }
    async createOrAdopt(projectId, name, { actor, availableInMCP = false, id, adoptOnCollision = false, defaultModel, schema, skills, skillCreator, tools, user, }) {
        await this.settingsService.assertEnabled();
        const { schemaConfig, integrations } = await this.prepareInitialConfig(projectId, name, {
            schema,
            user,
            defaultModel,
        });
        await this.agentPolicyService.enforceSave(projectId, null, schemaConfig, null, actor);
        const { config: storedConfig, skillRefs } = (0, agent_document_1.fromAgentDocument)(schemaConfig);
        const agent = Object.assign(this.agentRepository.create({
            ...(id ? { id } : {}),
            name,
            projectId,
            schema: storedConfig,
            ...(integrations.length > 0 ? { integrations } : {}),
            ...(tools ? { tools: tools } : {}),
            versionId: (0, uuid_1.v4)(),
            availableInMCP,
        }), { projectId });
        let saved;
        try {
            await this.transactionRunner.run({}, async (ctx) => {
                await this.agentRepository.insertNew(agent, ctx);
                await this.agentSkillRefs.createDraftRefs(agent, skillRefs, skills ?? {}, user ?? skillCreator ?? null, ctx);
            });
            saved = agent;
        }
        catch (error) {
            return {
                agent: await this.adoptExistingAgent(id, projectId, adoptOnCollision, error),
                adopted: true,
            };
        }
        this.logger.debug('Created SDK agent', { agentId: saved.id, projectId });
        if (user) {
            this.eventService.emit('agent-saved', { agentId: saved.id });
        }
        return { agent: saved, adopted: false };
    }
    async prepareDuplicateConfig(schema, projectId, user) {
        const accessibleCredentialIds = new Set((await (0, agent_credential_provider_1.createAgentCredentialProvider)(this.credentialsService, projectId, user).list()).map((credential) => credential.id));
        const sanitized = (0, sanitize_unknown_agent_credentials_1.sanitizeUnknownAgentCredentials)((0, api_types_1.sanitizeAgentJsonConfig)(schema), accessibleCredentialIds);
        const { schemaConfig, integrations } = (0, agent_config_composition_1.decomposeJsonConfig)(sanitized);
        const draftIntegrations = integrations.map((integration) => integration.type === 'n8n_chat' ? integration : { ...integration, credentialId: '' });
        return { schemaConfig, integrations: draftIntegrations };
    }
    async findByProjectId(projectId) {
        return await this.agentRepository.findByProjectId(projectId);
    }
    async findByProjectIdPaginated(projectId, options) {
        return await this.agentRepository.findByProjectIdsPaginated([projectId], options);
    }
    async findById(agentId, projectId) {
        return await this.agentRepository.findByIdAndProjectId(agentId, projectId);
    }
    async isN8nChatPublished(agentId, projectId) {
        return await this.agentRepository.isN8nChatPublished(agentId, projectId);
    }
    async getCapabilitySummary(agentId, projectId) {
        const entity = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId, 'Agent not found');
        const schema = entity.schema;
        const modelId = schema?.model ?? '';
        const model = modelId ? (0, agent_config_1.splitModelId)(modelId) : null;
        const channels = (entity.integrations ?? []).map((integration) => ({
            type: integration.type,
        }));
        const tools = this.getCapabilityTools(entity);
        const mcpServers = (schema?.mcpServers ?? []).map((server) => ({ name: server.name }));
        const draftSkills = await this.agentSkillRefs.readDraft(entity, {});
        const skills = (draftSkills.skillRefs ?? []).map((skill) => ({
            id: skill.id,
            name: draftSkills.skills[skill.id]?.name ?? skill.id,
        }));
        const tasks = await this.getCapabilityTasks(entity);
        return {
            id: entity.id,
            name: entity.name,
            model,
            channels,
            tools,
            mcpServers,
            skills,
            tasks,
        };
    }
    async findByUser(userId) {
        const projectRelations = await this.projectRelationRepository.findAllByUser(userId);
        const projectIds = projectRelations.map((pr) => pr.projectId);
        if (projectIds.length === 0)
            return [];
        return await this.agentRepository.find({
            where: { projectId: (0, db_1.In)(projectIds) },
            order: { updatedAt: 'DESC' },
        });
    }
    async findSummariesInProjects(projectIds, options = {}) {
        return await this.agentRepository.findSummariesByProjectIds(projectIds, options);
    }
    async findByIdForUser(agentId, user) {
        if ((0, permissions_1.hasGlobalScope)(user, 'agent:read')) {
            return await this.agentRepository.findById(agentId);
        }
        const projectRelations = await this.projectRelationRepository.findAllByUser(user.id);
        const projectIds = projectRelations.map((pr) => pr.projectId);
        return await this.agentRepository.findByIdInProjects(agentId, projectIds);
    }
    async findChatReachableByUserPaginated(user, options) {
        if (!(await this.settingsService.getEnabled()))
            return { count: 0, data: [] };
        const [projectIds, ownedProjectIds] = await Promise.all([
            this.projectScopeService.getProjectIds(user, ['agent:execute']),
            this.projectScopeService.getMemberProjectIds(user, ['agent:update', 'agent:publish']),
        ]);
        const usageCounts = options.sortBy === 'usage:desc'
            ? await this.agentExecutionService.countN8nChatThreadsByAgent(user.id, projectIds)
            : undefined;
        const { count, data } = await this.agentRepository.findN8nChatListPaginated(projectIds, ownedProjectIds, options, usageCounts);
        return { count, data: data.map(toChatListItem) };
    }
    async findChatReachableAgentForUser(agentId, user) {
        const projectIds = await this.projectScopeService.getProjectIds(user, ['agent:execute']);
        const agent = await this.agentRepository.findChatReachableById(agentId, projectIds);
        if (!agent)
            return null;
        const schema = agent.activeVersion?.schema;
        const subAgentIds = [
            ...new Set((schema?.subAgents?.agents ?? []).map((subAgent) => subAgent.agentId)),
        ];
        const namesById = new Map((await this.agentRepository.findByIdsAndProjectId(subAgentIds, agent.projectId)).map((row) => [row.id, row.name]));
        return {
            ...toChatListItem(agent),
            subAgents: subAgentIds.flatMap((id) => {
                const name = namesById.get(id);
                return name ? [{ id, name }] : [];
            }),
        };
    }
    async findN8nChatThreadsForUser(user, options) {
        const projectIds = await this.projectScopeService.getProjectIds(user, ['agent:execute']);
        const agentIds = options.agentId
            ? await this.reachableAgentIds(options.agentId, projectIds)
            : await this.agentRepository.findChatReachableIds(projectIds);
        return await this.agentExecutionService.findN8nChatThreadsForAgents(user.id, agentIds, options);
    }
    async reachableAgentIds(agentId, projectIds) {
        const agent = await this.agentRepository.findChatReachableById(agentId, projectIds);
        return agent ? [agent.id] : [];
    }
    async findN8nChatThreadForUser(user, threadId) {
        const projectIds = await this.projectScopeService.getProjectIds(user, ['agent:execute']);
        const agentIds = await this.agentRepository.findChatReachableIds(projectIds);
        return await this.agentExecutionService.findN8nChatThreadForAgents(user.id, agentIds, threadId);
    }
    async findListableByUserPaginated(user, options) {
        const projectIds = await this.projectScopeService.getProjectIds(user, ['agent:list']);
        return await this.agentRepository.findByProjectIdsPaginated(projectIds, options);
    }
    async findPublishedByUser(userId) {
        const projectRelations = await this.projectRelationRepository.findAllByUser(userId);
        const projectIds = projectRelations.map((pr) => pr.projectId);
        if (projectIds.length === 0)
            return [];
        const agents = await this.agentRepository.find({
            where: { projectId: (0, db_1.In)(projectIds) },
            relations: { activeVersion: true },
            order: { updatedAt: 'DESC' },
        });
        return agents.filter((agent) => agent.activeVersionId !== null);
    }
    async delete(agentId, projectId) {
        const agent = await this.agentRepository.findByIdAndProjectId(agentId, projectId);
        if (!agent) {
            return false;
        }
        await this.deleteKnowledgeFiles(projectId, agentId);
        await this.agentKnowledgeService.destroyKnowledgeSandbox(projectId, agentId);
        await this.deleteChatAttachments(agentId);
        const chatIntegrationService = di_1.Container.get(chat_integration_service_1.ChatIntegrationService);
        for (const integration of agent.integrations ?? []) {
            await chatIntegrationService.disconnectChannel(agentId, integration);
        }
        await this.agentExecutionService.deleteExecutionLogsForAgent(agentId);
        await this.agentRepository.remove(agent);
        this.runtimeCacheService.clearRuntimes(agentId);
        await this.subAgentCleanupService.removeSubAgentFromParents(agentId, projectId);
        this.eventService.emit('agent-deleted', { agentId, projectId });
        await this.stopDeletedAgentTasks(agentId);
        await this.clearDeletedAgentTestChats(agentId);
        this.logger.debug('Deleted SDK agent', { agentId, projectId });
        return true;
    }
    async prepareInitialConfig(projectId, name, { schema, user, defaultModel }) {
        const defaultConfig = {
            name,
            model: '',
            instructions: '',
            ...(defaultModel ?? {}),
            tools: [],
            skills: [],
            personalisation: {
                icon: api_types_1.DEFAULT_AGENT_PERSONALISATION.icon,
                gradient: (0, api_types_1.getRandomAgentPersonalisationGradient)(),
            },
        };
        if (!schema) {
            if (user && (await this.n8nChatFlag.isEnabledFor(user))) {
                defaultConfig.integrations = [{ type: api_types_1.N8N_CHAT_INTEGRATION_TYPE, credentialId: '' }];
            }
            return (0, agent_config_composition_1.decomposeJsonConfig)(defaultConfig);
        }
        if (!user)
            return (0, agent_config_composition_1.decomposeJsonConfig)(schema);
        return await this.prepareDuplicateConfig(schema, projectId, user);
    }
    async adoptExistingAgent(id, projectId, adoptOnCollision, error) {
        if (!id || !(0, db_1.isUniqueConstraintError)(error))
            throw error;
        const conflict = new errors_1.ConflictError('An agent with this id already exists');
        if (!adoptOnCollision)
            throw conflict;
        const existing = await this.agentRepository.findByIdAndProjectId(id, projectId);
        if (!existing)
            throw conflict;
        this.logger.debug('Adopted concurrently created SDK agent', { agentId: id, projectId });
        return existing;
    }
    getCapabilityTools(entity) {
        return (entity.schema?.tools ?? []).flatMap((tool) => {
            switch (tool.type) {
                case 'custom':
                    return [{ type: 'custom', name: entity.tools[tool.id]?.descriptor?.name ?? tool.id }];
                case 'workflow':
                    return [{ type: 'workflow', name: tool.name ?? tool.workflow }];
                case 'node':
                    return [
                        {
                            type: 'node',
                            name: tool.name,
                            nodeType: tool.node?.nodeType,
                            nodeTypeVersion: tool.node?.nodeTypeVersion,
                        },
                    ];
                default:
                    return [];
            }
        });
    }
    async getCapabilityTasks(entity) {
        const taskRefs = entity.schema?.tasks ?? [];
        let taskNamesById = {};
        if (taskRefs.length > 0) {
            const taskBodies = await this.agentTaskRepository.findByAgentId(entity.id);
            taskNamesById = Object.fromEntries(taskBodies.map((task) => [task.id, task.name]));
        }
        return taskRefs.map((task) => ({
            id: task.id,
            name: taskNamesById[task.id] ?? task.id,
            enabled: task.enabled,
        }));
    }
    async deleteKnowledgeFiles(projectId, agentId) {
        try {
            await this.agentKnowledgeService.deleteAllFilesForAgent(projectId, agentId);
        }
        catch (error) {
            this.logger.warn('Failed to delete knowledge files on agent delete', {
                agentId,
                error: error instanceof Error ? error.message : error,
            });
        }
    }
    async deleteChatAttachments(agentId) {
        try {
            await this.agentChatAttachmentService.deleteByAgent(agentId);
        }
        catch (error) {
            this.logger.warn('Failed to delete chat attachments on agent delete', {
                agentId,
                error: error instanceof Error ? error.message : error,
            });
        }
    }
    async stopDeletedAgentTasks(agentId) {
        try {
            const { AgentTaskService } = await import('./agent-task.service.js');
            await di_1.Container.get(AgentTaskService).requestReconcile(agentId);
        }
        catch (error) {
            this.logger.warn('Failed to stop tasks on agent delete', {
                agentId,
                error: error instanceof Error ? error.message : error,
            });
        }
    }
    async clearDeletedAgentTestChats(agentId) {
        try {
            await this.testChatService.clearAllTestChatMessages(agentId);
        }
        catch (error) {
            this.logger.warn('Failed to clear test chat on agent delete', {
                agentId,
                error: error instanceof Error ? error.message : error,
            });
        }
    }
};
exports.AgentsService = AgentsService;
exports.AgentsService = AgentsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository, db_1.ProjectRelationRepository, agent_chat_attachment_service_1.AgentChatAttachmentService, agent_knowledge_service_1.AgentKnowledgeService, agent_runtime_cache_service_1.AgentRuntimeCacheService, agent_test_chat_service_1.AgentTestChatService, agent_task_repository_1.AgentTaskRepository, sub_agent_cleanup_service_1.SubAgentCleanupService, backend_services_1.EventService, agent_execution_service_1.AgentExecutionService, credentials_service_1.CredentialsService, backend_services_1.ProjectScopeService, agents_settings_service_1.AgentsSettingsService, agent_policy_service_1.AgentPolicyService, agent_skill_refs_service_1.AgentSkillRefsService, db_1.TransactionRunner, n8n_chat_flag_service_1.N8nChatFlagService])
], AgentsService);
function toChatListItem(agent) {
    const availableInChat = (0, agent_repository_1.hasN8nChatChannel)(agent.activeVersion?.schema?.integrations);
    const schema = availableInChat ? agent.activeVersion?.schema : agent.schema;
    const description = schema?.description;
    if (!agent.project)
        throw new n8n_workflow_1.UnexpectedError('Agent project relation is not loaded');
    return {
        ...(0, agent_ref_1.toAgentRef)(agent, schema),
        ...(description ? { description } : {}),
        availableInChat,
        project: { id: agent.projectId, name: agent.project.name },
        attachments: (0, api_types_1.getProviderAttachmentCapabilities)(schema?.model ? (0, agent_config_1.splitModelId)(schema.model).provider : undefined),
    };
}
//# sourceMappingURL=agents.service.js.map