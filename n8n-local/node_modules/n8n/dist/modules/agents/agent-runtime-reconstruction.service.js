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
exports.AgentRuntimeReconstructionService = void 0;
const agents_1 = require("@n8n/agents");
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const active_executions_1 = require("../../active-executions");
const constants_1 = require("../../constants");
const backend_services_1 = require("@n8n/backend-services");
const credential_sharing_1 = require("../../constants/credential-sharing");
const credentials_service_1 = require("../../credentials/credentials.service");
const pre_execution_checks_1 = require("../../executions/pre-execution-checks");
const node_execution_1 = require("../../node-execution");
const oauth_service_1 = require("../../oauth/oauth.service");
const mcp_registry_service_1 = require("../../modules/mcp-registry/registry/mcp-registry.service");
const check_access_1 = require("../../permissions.ee/check-access");
const ai_service_1 = require("../../services/ai.service");
const proxy_token_manager_1 = require("../../services/proxy-token-manager");
const ai_proxy_fetch_1 = require("../../utils/ai-proxy-fetch");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const agent_chat_attachment_service_1 = require("./agent-chat-attachment.service");
const agent_knowledge_mirror_service_1 = require("./agent-knowledge-mirror.service");
const agent_sandbox_runtime_service_1 = require("./agent-sandbox-runtime.service");
const agent_workspace_service_1 = require("./agent-workspace.service");
const agent_chat_integration_1 = require("./integrations/agent-chat-integration");
const integration_tools_1 = require("./integrations/integration-tools");
const n8n_checkpoint_storage_1 = require("./integrations/n8n-checkpoint-storage");
const n8n_memory_1 = require("./integrations/n8n-memory");
const from_json_config_1 = require("./json-config/from-json-config");
const agent_document_1 = require("./json-config/agent-document");
const mcp_client_factory_1 = require("./json-config/mcp-client-factory");
const model_config_1 = require("./json-config/model-config");
const agent_file_repository_1 = require("./repositories/agent-file.repository");
const agent_repository_1 = require("./repositories/agent.repository");
const agent_secure_runtime_1 = require("./runtime/agent-secure-runtime");
const delegate_sub_agent_tool_1 = require("./sub-agents/delegate-sub-agent-tool");
const sub_agent_runner_1 = require("./sub-agents/sub-agent-runner");
const tool_registry_1 = require("./tool-registry");
const environment_tool_1 = require("./tools/environment-tool");
const mark_session_failed_tool_1 = require("./tools/mark-session-failed.tool");
const workflow_tool_unavailable_error_1 = require("./tools/workflow-tool-unavailable-error");
const workflow_tool_workflow_resolver_1 = require("./tools/workflow-tool-workflow-resolver");
const workflow_tool_workflow_loader_service_1 = require("./tools/workflow-tool-workflow-loader.service");
const agent_runtime_assets_1 = require("./utils/agent-runtime-assets");
const sub_agent_resolver_1 = require("./utils/sub-agent-resolver");
async function getChatIntegrationToolServices() {
    const { IntegrationMessageContextService } = await import('./integrations/integration-message-context.service.js');
    const { ChatIntegrationActionExecutor } = await import('./integrations/integration-action-executor.js');
    const { ChatIntegrationContextQueryExecutor } = await import('./integrations/integration-context-query-executor.js');
    return {
        messageContextStore: di_1.Container.get(IntegrationMessageContextService),
        actionExecutor: di_1.Container.get(ChatIntegrationActionExecutor),
        queryExecutor: di_1.Container.get(ChatIntegrationContextQueryExecutor),
    };
}
async function getWorkflowRunner() {
    const { WorkflowRunner } = await import('../../workflow-runner.js');
    return di_1.Container.get(WorkflowRunner);
}
function toolRefName(ref) {
    if (ref.type === 'custom')
        return ref.id;
    return ref.type === 'workflow' ? (ref.name ?? ref.workflow) : ref.name;
}
let AgentRuntimeReconstructionService = class AgentRuntimeReconstructionService {
    constructor(logger, agentRepository, agentFileRepository, activeExecutions, workflowRepository, n8nCheckpointStorage, secureRuntime, ephemeralNodeExecutor, n8nMemory, oauthService, mcpRegistryService, agentSandboxRuntimeService, aiService, outboundHttp, agentWorkspaceService, agentKnowledgeMirrorService, credentialsFinderService, workflowFinderService, agentChatAttachmentService, credentialsService) {
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.agentFileRepository = agentFileRepository;
        this.activeExecutions = activeExecutions;
        this.workflowRepository = workflowRepository;
        this.n8nCheckpointStorage = n8nCheckpointStorage;
        this.secureRuntime = secureRuntime;
        this.ephemeralNodeExecutor = ephemeralNodeExecutor;
        this.n8nMemory = n8nMemory;
        this.oauthService = oauthService;
        this.mcpRegistryService = mcpRegistryService;
        this.agentSandboxRuntimeService = agentSandboxRuntimeService;
        this.aiService = aiService;
        this.outboundHttp = outboundHttp;
        this.agentWorkspaceService = agentWorkspaceService;
        this.agentKnowledgeMirrorService = agentKnowledgeMirrorService;
        this.credentialsFinderService = credentialsFinderService;
        this.workflowFinderService = workflowFinderService;
        this.agentChatAttachmentService = agentChatAttachmentService;
        this.credentialsService = credentialsService;
    }
    async reconstructFromAgentEntity({ agent: agentEntity, skillRefs, skills }, credentialProvider, runType, integrationType, user, instrumentation, workflowToolExecutionMode = 'manual', sandboxPrincipalHash, { supportsHitl, previewChat, allowBackgroundTasks = true, allowPlanTools = true, attributionUserId, } = {}) {
        if (!agentEntity.schema) {
            throw new n8n_workflow_1.UserError('Agent has no JSON config.');
        }
        let config = (0, agent_document_1.toAgentDocument)(agentEntity.schema, skillRefs);
        let userToolAccessSnapshot;
        let unavailableTools = [];
        if (user && config.tools?.length) {
            const filtered = await this.filterToolsForUser(config.tools, agentEntity.projectId, user);
            config = { ...config, tools: filtered.tools };
            userToolAccessSnapshot = filtered.snapshot;
            unavailableTools = filtered.unavailable;
        }
        const { toolDescriptors, toolCodeByName } = (0, agent_runtime_assets_1.getAgentRuntimeAssets)(agentEntity, skills);
        const subAgentDelegation = await this.createSubAgentDelegationConfig(config, agentEntity.projectId);
        const runtime = await this.reconstructRuntime({
            config,
            memoryOwnerAgentId: agentEntity.id,
            projectId: agentEntity.projectId,
            credentialProvider,
            toolDescriptors,
            toolCodeByName,
            skills,
            runtimeProfile: 'top-level',
            supportsHitl,
            runType,
            workflowToolExecutionMode,
            parentAgentIdForDelegation: agentEntity.id,
            integrationType,
            credentialIntegrations: agentEntity.integrations ?? [],
            subAgentDelegation,
            user,
            attributionUserId,
            instrumentation,
            sandboxPrincipalHash,
            unavailableTools,
            allowBackgroundTasks,
            allowPlanTools,
            previewChat,
        });
        return {
            ...runtime,
            ...(userToolAccessSnapshot !== undefined ? { userToolAccessSnapshot } : {}),
        };
    }
    async filterToolsForUser(tools, projectId, user) {
        const canExecute = await (0, check_access_1.userHasScopes)(user, ['workflow:execute'], false, { projectId });
        let usableIdsLoad;
        const loadUsableIds = async () => await (usableIdsLoad ??= this.loadAgentUsableCredentialIds(projectId, user));
        const filtered = [];
        const unavailable = [];
        const grantedCredentialIds = new Set();
        const grantedWorkflowIds = new Set();
        let keptGatedTool = false;
        for (const ref of tools) {
            if (ref.enabled === false)
                continue;
            if (ref.type === 'custom') {
                filtered.push(ref);
                continue;
            }
            const access = await this.checkToolAccess(ref, projectId, user, canExecute, loadUsableIds);
            if (access && 'reason' in access) {
                unavailable.push(access);
                continue;
            }
            filtered.push(ref);
            if (!access)
                continue;
            keptGatedTool = true;
            for (const id of access.credentialIds)
                grantedCredentialIds.add(id);
            for (const id of access.workflowIds)
                grantedWorkflowIds.add(id);
        }
        return {
            tools: filtered,
            unavailable,
            ...(keptGatedTool
                ? {
                    snapshot: {
                        credentialIds: [...grantedCredentialIds],
                        workflowIds: [...grantedWorkflowIds],
                    },
                }
                : {}),
        };
    }
    async loadAgentUsableCredentialIds(projectId, user) {
        if (!(0, credential_sharing_1.isCredSharingEnabled)())
            return undefined;
        const usable = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(user, {
            projectId,
            excludePersonalRoute: true,
        });
        return new Set(usable.map((credential) => credential.id));
    }
    async checkToolAccess(ref, projectId, user, canExecute, loadUsableIds) {
        const denied = (message) => ({
            toolName: toolRefName(ref),
            toolType: ref.type,
            reason: 'no_access',
            message,
        });
        if (!canExecute)
            return denied('The user lacks workflow:execute on the project');
        if (ref.type === 'node') {
            const credentialIds = Object.values(ref.node.credentials ?? {})
                .map((credential) => credential.id)
                .filter((id) => Boolean(id));
            const credentials = await Promise.all(credentialIds.map(async (id) => await this.credentialsFinderService.findCredentialForUser(id, user, [
                'credential:read',
            ])));
            if (credentials.some((credential) => credential === null)) {
                return denied('The user cannot read a credential the tool uses');
            }
            const usableIds = credentialIds.length > 0 ? await loadUsableIds() : undefined;
            if (usableIds && !credentialIds.every((id) => usableIds.has(id))) {
                return denied('The tool uses a personal credential that agents cannot use yet');
            }
            return { credentialIds, workflowIds: [] };
        }
        const workflow = await (0, workflow_tool_workflow_resolver_1.findWorkflowToolWorkflow)(this.workflowRepository, ref, projectId);
        if (!workflow)
            return undefined;
        const accessibleWorkflow = await this.workflowFinderService.findWorkflowForUser(workflow.id, user, ['workflow:execute']);
        if (!accessibleWorkflow) {
            return denied(`The user cannot execute workflow "${workflow.name}"`);
        }
        return { credentialIds: [], workflowIds: [workflow.id] };
    }
    async userStillHasToolAccess(snapshot, projectId, user) {
        if (!(await (0, check_access_1.userHasScopes)(user, ['workflow:execute'], false, { projectId })))
            return false;
        const credentials = await Promise.all(snapshot.credentialIds.map(async (id) => await this.credentialsFinderService.findCredentialForUser(id, user, ['credential:read'])));
        if (credentials.some((credential) => credential === null))
            return false;
        if (snapshot.credentialIds.length > 0) {
            const usableIds = await this.loadAgentUsableCredentialIds(projectId, user);
            if (usableIds && !snapshot.credentialIds.every((id) => usableIds.has(id)))
                return false;
        }
        const workflows = await Promise.all(snapshot.workflowIds.map(async (id) => await this.workflowFinderService.findWorkflowForUser(id, user, ['workflow:execute'])));
        return workflows.every((workflow) => Boolean(workflow));
    }
    async reconstructFromResolvedSource(params) {
        let config = params.config;
        let unavailableTools = [];
        if (params.user && config.tools?.length) {
            const filtered = await this.filterToolsForUser(config.tools, params.projectId, params.user);
            config = { ...config, tools: filtered.tools };
            unavailableTools = filtered.unavailable;
        }
        const subAgentDelegation = await this.createSubAgentDelegationConfig(config, params.projectId);
        return await this.reconstructRuntime({
            ...params,
            config,
            credentialIntegrations: [],
            subAgentDelegation,
            unavailableTools,
        });
    }
    async reconstructRuntime(options) {
        const unavailable = [...(options.unavailableTools ?? [])];
        const backgroundTasksEnabled = options.runtimeProfile === 'top-level' &&
            (options.allowBackgroundTasks ?? true) &&
            di_1.Container.get(config_1.AgentsConfig).backgroundTasksEnabled;
        const runtime = await this.buildConfiguredRuntime(options, backgroundTasksEnabled, unavailable);
        if (unavailable.length > 0) {
            this.logger.warn('Agent runtime built with unavailable tools', {
                agentId: options.memoryOwnerAgentId,
                runType: options.runType,
                tools: unavailable,
            });
        }
        await this.injectRuntimeDependencies({
            ...options,
            agent: runtime.agent,
            agentId: options.memoryOwnerAgentId,
            workflowToolExecutionMode: options.workflowToolExecutionMode ?? 'manual',
            parentAgentIdForDelegation: options.parentAgentIdForDelegation ?? options.memoryOwnerAgentId,
            backgroundTasksEnabled,
        });
        return {
            agent: runtime.agent,
            toolRegistry: (0, tool_registry_1.buildToolRegistry)(runtime.resolvedTools),
            mcpServerAttributions: runtime.mcpServerAttributions,
            ...(options.config.config?.guardrails?.budget !== undefined
                ? { budget: options.config.config.guardrails.budget }
                : {}),
        };
    }
    async buildConfiguredRuntime(options, backgroundTasksEnabled, unavailable) {
        const { config, memoryOwnerAgentId, projectId, credentialProvider, toolDescriptors, toolCodeByName, skills, instrumentation, previewChat, } = options;
        const toolExecutor = this.secureRuntime.createToolExecutor(toolCodeByName);
        const toolResolver = this.createRuntimeToolResolver(options, backgroundTasksEnabled, unavailable);
        const resolvedTools = [];
        const mcpServerAttributions = new Map();
        const aiProxyFetch = (0, ai_proxy_fetch_1.createAiProxyFetch)(this.outboundHttp);
        const aiMcpFetch = instrumentation?.mcpFetch ?? (0, ai_proxy_fetch_1.createAiMcpFetch)(this.outboundHttp);
        const webSearchFetch = (0, ai_proxy_fetch_1.createWebSearchFetch)(this.outboundHttp);
        const buildMcpClient = this.makeMcpClientFactory(options, aiMcpFetch, mcpServerAttributions);
        const reconstructed = await (0, from_json_config_1.buildFromJson)(config, toolDescriptors, {
            toolExecutor,
            credentialProvider,
            resolveTool: async (ref) => {
                const resolved = await toolResolver(ref);
                if (resolved)
                    resolvedTools.push(resolved);
                return resolved;
            },
            skills,
            memoryFactory: this.getMemoryFactory(memoryOwnerAgentId),
            buildMcpClient,
            resolveManagedEmbeddingProviderOptions: async () => await this.resolveManagedEmbeddingProviderOptions(projectId),
            modelFetch: instrumentation?.modelFetch ?? aiProxyFetch,
            fallbackWebSearch: instrumentation?.webSearch,
            attachAuthPendingMcpServers: instrumentation?.mcpFetch !== undefined,
            webSearchFetch,
            previewChat,
        });
        return { agent: reconstructed, resolvedTools, mcpServerAttributions };
    }
    createRuntimeToolResolver(options, backgroundTasksEnabled, unavailable) {
        const { projectId, workflowToolExecutionMode = 'manual', runType, memoryOwnerAgentId, integrationType, user, attributionUserId, previewChat, supportsHitl, runtimeProfile, instrumentation, } = options;
        const canResume = supportsHitl ?? runtimeProfile === 'top-level';
        return this.makeToolResolver({
            projectId,
            workflowToolExecutionMode,
            usePublishedWorkflowVersion: runType === 'production',
            agentId: memoryOwnerAgentId,
            integrationType,
            userId: attributionUserId ?? user?.id,
            previewChat,
            publishedN8nChat: runType === 'production' &&
                integrationType === api_types_1.N8N_CHAT_INTEGRATION_TYPE &&
                attributionUserId !== undefined,
            supportsHitl: canResume,
            backgroundTasksEnabled: backgroundTasksEnabled && canResume,
        }, instrumentation, unavailable);
    }
    makeMcpClientFactory(options, aiMcpFetch, mcpServerAttributions) {
        const { credentialProvider, projectId, memoryOwnerAgentId, instrumentation, runtimeProfile } = options;
        return async (server) => await (0, mcp_client_factory_1.buildMcpClientForServer)(server, {
            credentialProvider,
            nonInterrupting: runtimeProfile === 'inline',
            oauthService: this.oauthService,
            projectId,
            proxyFetch: aiMcpFetch,
            resolveRegistryConnection: async (nodeTypeName) => {
                const connection = await this.mcpRegistryService.getConnection(nodeTypeName);
                if (connection?.attribution) {
                    mcpServerAttributions.set(server.name, connection.attribution);
                }
                return connection;
            },
            onConnectionFailed: (event) => {
                this.logger.warn('Skipped MCP server that failed to connect', {
                    agentId: memoryOwnerAgentId,
                    serverName: event.server,
                    error: event.error,
                });
            },
            ...(instrumentation?.onMcpToolCallSettled !== undefined && {
                onToolCallSettled: async (event) => await instrumentation.onMcpToolCallSettled?.({
                    serverName: server.name,
                    ...event,
                }),
            }),
        });
    }
    async createSubAgentDelegationConfig(config, projectId) {
        const configuredAgents = (config.subAgents?.agents ?? []).filter((ref) => ref.enabled !== false);
        const sourcesById = {};
        const availableSubAgents = [];
        for (const { agentId, agent, useWhen } of await (0, sub_agent_resolver_1.resolveUniqueSubAgents)({
            refs: configuredAgents,
            projectId,
            agentRepository: this.agentRepository,
        })) {
            if (!agent)
                continue;
            sourcesById[agentId] = { agentId };
            availableSubAgents.push({
                id: agentId,
                name: agent.name,
                ...(useWhen ? { useWhen } : {}),
            });
        }
        return { sourcesById, availableSubAgents };
    }
    getMemoryFactory(agentId) {
        return (_params) => this.n8nMemory.getImplementation(agentId);
    }
    async resolveManagedEmbeddingProviderOptions(ownerId) {
        if (!this.aiService.isProxyEnabled())
            return null;
        const client = await this.aiService.getClient();
        const baseURL = client.getApiProxyBaseUrl().replace(/\/$/, '') + '/openai/';
        const tokenManager = new proxy_token_manager_1.ProxyTokenManager(async () => {
            return await client.getBuilderApiProxyToken({ id: ownerId }, { userMessageId: (0, nanoid_1.nanoid)() });
        });
        const proxyManagedFetch = (0, ai_proxy_fetch_1.createAiProxyFetch)(this.outboundHttp);
        return {
            baseURL,
            apiKey: 'proxy-managed',
            fetch: async (input, init) => {
                const headers = new Headers(init?.headers);
                const auth = await tokenManager.getAuthHeaders();
                for (const [key, value] of Object.entries(auth)) {
                    headers.set(key, value);
                }
                for (const [key, value] of Object.entries((0, api_types_1.buildProxyHeaders)({ feature: 'agent-builder', n8nVersion: constants_1.N8N_VERSION }))) {
                    headers.set(key, value);
                }
                return await proxyManagedFetch(input, { ...init, headers });
            },
        };
    }
    makeToolResolver(runIdentity, instrumentation, unavailable) {
        const instrumentToolAdditionalData = instrumentation?.configureToolAdditionalData;
        return async (ref) => {
            if (ref.type === 'workflow') {
                return await this.resolveWorkflowTool(ref, runIdentity, instrumentToolAdditionalData, unavailable);
            }
            if (ref.type === 'node') {
                const { resolveNodeTool } = await import('./tools/node-tool-factory.js');
                return await resolveNodeTool(ref, {
                    executor: this.ephemeralNodeExecutor,
                    projectId: runIdentity.projectId,
                    instrumentToolAdditionalData,
                });
            }
            return null;
        };
    }
    async resolveWorkflowTool(ref, runIdentity, instrumentToolAdditionalData, unavailable) {
        const { projectId, workflowToolExecutionMode, usePublishedWorkflowVersion, agentId, integrationType, userId, previewChat, publishedN8nChat, supportsHitl, backgroundTasksEnabled, } = runIdentity;
        const { resolveWorkflowTool, buildUnavailableWorkflowTool } = await import('./tools/workflow-tool-factory.js');
        const context = {
            workflowLoader: di_1.Container.get(workflow_tool_workflow_loader_service_1.WorkflowToolWorkflowLoader),
            executor: this.ephemeralNodeExecutor,
            workflowRunner: await getWorkflowRunner(),
            subworkflowPolicyChecker: di_1.Container.get(pre_execution_checks_1.SubworkflowPolicyChecker),
            activeExecutions: this.activeExecutions,
            projectId,
            executionMode: workflowToolExecutionMode,
            usePublishedWorkflowVersion,
            instrumentToolAdditionalData,
            agentId,
            integrationType,
            userId,
            previewChat,
            publishedN8nChat,
            supportsHitl,
            backgroundTasksEnabled,
        };
        try {
            return await resolveWorkflowTool(ref, context);
        }
        catch (error) {
            if (!(error instanceof workflow_tool_unavailable_error_1.WorkflowToolUnavailableError))
                throw error;
            unavailable.push({
                toolName: toolRefName(ref),
                toolType: 'workflow',
                reason: error.reason,
                message: error.message,
            });
            return buildUnavailableWorkflowTool(ref, context);
        }
    }
    async injectRuntimeDependencies(params) {
        const { agent, agentId, projectId, runtimeProfile, config } = params;
        agent.nativeToolDeferral({
            eagerToolNames: [...agents_1.CORE_WORKSPACE_TOOL_NAMES, 'load_skill', 'mark_session_failed'],
        });
        agent.tool((0, environment_tool_1.createGetEnvironmentTool)());
        const parentWorkspaceHandle = await this.attachWorkspaceAndKnowledge(params);
        if (runtimeProfile === 'top-level') {
            await this.attachIntegrationTools(params);
            await this.attachTopLevelTools(params, parentWorkspaceHandle);
        }
        if (runtimeProfile === 'inline')
            return;
        if (!agent.hasCheckpointStorage()) {
            agent.checkpoint(this.n8nCheckpointStorage.getStorage(agentId));
        }
        agent.fileStore(this.agentChatAttachmentService.getFileStore({ agentId, projectId }, (0, agent_config_1.getProviderPrefix)(config.model)));
    }
    async attachWorkspaceAndKnowledge(params) {
        if (params.runtimeProfile === 'inline' || !this.agentSandboxRuntimeService.isEnabled())
            return undefined;
        const parentWorkspaceHandle = await this.attachWorkspace(params);
        const { agent, agentId, projectId } = params;
        if (await this.agentFileRepository.hasFilesForAgent(agentId)) {
            const { createKnowledgeRetrievalTools } = await import('./tools/knowledge/search-knowledge.tool.js');
            agent.tool(createKnowledgeRetrievalTools({
                projectId,
                agentId,
                knowledgeMirrorService: this.agentKnowledgeMirrorService,
            }));
        }
        return parentWorkspaceHandle;
    }
    async attachWorkspace(params) {
        const { agent, agentId, projectId, runtimeProfile, parentWorkspace, sandboxPrincipalHash } = params;
        if (runtimeProfile === 'sub-agent') {
            if (parentWorkspace) {
                agent.workspace(this.agentWorkspaceService.getDelegatedAgentWorkspace(parentWorkspace.handle, parentWorkspace.delegationThreadId));
            }
            return undefined;
        }
        if (!sandboxPrincipalHash) {
            throw new n8n_workflow_1.UserError('Agent workspace scope is missing and the runtime cannot be reconstructed');
        }
        try {
            const { workspace, handle } = await this.agentWorkspaceService.getAgentWorkspace(projectId, agentId, sandboxPrincipalHash);
            agent.workspace(workspace);
            return handle;
        }
        catch (error) {
            this.logger.warn('Failed to attach agent workspace', {
                projectId,
                agentId,
                error: (0, agent_sandbox_runtime_service_1.sanitizeSandboxErrorDetail)(error instanceof Error ? error.message : String(error)),
            });
        }
        return undefined;
    }
    async attachIntegrationTools(params) {
        const { agent, agentId, integrationType, credentialIntegrations } = params;
        const includeN8nChat = integrationType === api_types_1.N8N_CHAT_INTEGRATION_TYPE;
        if (credentialIntegrations.length === 0 && !includeN8nChat)
            return;
        const integrationRegistry = di_1.Container.get(agent_chat_integration_1.ChatIntegrationRegistry);
        const { messageContextStore, actionExecutor, queryExecutor } = await getChatIntegrationToolServices();
        const descriptors = this.createIntegrationDescriptors(agentId, credentialIntegrations.filter(api_types_1.isCredentialAgentIntegration), integrationRegistry);
        if (includeN8nChat) {
            descriptors.push(this.createN8nChatDescriptor(agentId, integrationRegistry));
        }
        for (const descriptor of descriptors) {
            agent.tool((0, integration_tools_1.createIntegrationContextTool)({ descriptor, queryExecutor }));
            agent.tool((0, integration_tools_1.createIntegrationActionTool)({ descriptor, messageContextStore, actionExecutor }));
        }
    }
    createIntegrationDescriptors(agentId, credentialIntegrations, integrationRegistry) {
        return (0, integration_tools_1.getIntegrationToolConnectionDescriptors)(credentialIntegrations, agentId, (integrationConfig) => {
            const integrationDef = integrationRegistry.get(integrationConfig.type);
            return {
                contextToolDefinitions: integrationDef?.contextToolDefinitions,
                actionToolDefinitions: integrationDef?.actionToolDefinitions,
                contextQueries: integrationDef?.contextQueries,
                actions: integrationDef?.actions,
                contextToolGuidance: integrationDef?.contextToolGuidance,
                actionToolGuidance: integrationDef?.actionToolGuidance,
            };
        });
    }
    createN8nChatDescriptor(agentId, integrationRegistry) {
        const n8nChat = integrationRegistry.require(api_types_1.N8N_CHAT_INTEGRATION_TYPE);
        const n8nChatIntegration = {
            type: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
        };
        return {
            agentId,
            integration: n8nChatIntegration,
            integrationConnectionId: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
            contextToolName: api_types_1.N8N_CHAT_CONTEXT_TOOL_NAME,
            actionToolName: api_types_1.N8N_CHAT_ACTION_TOOL_NAME,
            contextQueries: [...n8nChat.contextQueries],
            actions: [...n8nChat.actions],
            contextToolDefinitions: [...n8nChat.contextToolDefinitions],
            actionToolDefinitions: [...n8nChat.actionToolDefinitions],
            contextToolGuidance: n8nChat.contextToolGuidance,
            actionToolGuidance: n8nChat.actionToolGuidance,
        };
    }
    async attachTopLevelTools(params, parentWorkspaceHandle) {
        const { agent, agentId, config, parentAgentIdForDelegation, projectId, credentialProvider, runType, workflowToolExecutionMode, subAgentDelegation, user, instrumentation, backgroundTasksEnabled, } = params;
        const delegationParams = {
            agent,
            parentAgentId: parentAgentIdForDelegation,
            projectId,
            credentialProvider,
            runType,
            workflowToolExecutionMode,
            delegation: subAgentDelegation,
            user,
            instrumentation,
        };
        let runBackgroundSubAgent;
        if (backgroundTasksEnabled) {
            const budget = config.config?.guardrails?.budget;
            const sessionCap = budget?.enabled ? budget.sessionCostCapUsd : undefined;
            const rootSessionCapUsd = sessionCap !== undefined && sessionCap > 0 ? sessionCap : undefined;
            runBackgroundSubAgent = await this.attachBackgroundJobTools({
                ...delegationParams,
                ...(parentWorkspaceHandle !== undefined ? { parentWorkspaceHandle } : {}),
                ...(rootSessionCapUsd !== undefined ? { rootSessionCapUsd } : {}),
            });
        }
        await this.attachSubAgentDelegationTool({
            ...delegationParams,
            config,
            parentWorkspaceHandle,
            rootSessionId: params.rootSessionId,
            rootSessionCapUsd: params.rootSessionCapUsd,
            budgetForwarded: params.budgetForwarded,
            runBackgroundSubAgent,
        });
        if (params.allowPlanTools !== false && di_1.Container.get(config_1.AgentsConfig).planToolsEnabled) {
            const { AgentPlanService } = await import('./agent-plan.service.js');
            const { createAgentPlanTools } = await import('./plans/agent-plan-tools.js');
            agent.tool(createAgentPlanTools(di_1.Container.get(AgentPlanService)));
        }
        else {
            this.attachWriteTodosTool(agent, agentId);
        }
        agent.tool((0, mark_session_failed_tool_1.createMarkSessionFailedTool)());
        if (!backgroundTasksEnabled)
            return;
        agent.volatileInstructionsProvider(async ({ persistence }) => {
            if (!persistence?.threadId)
                return undefined;
            const { AgentWakeService } = await import('./background/agent-wake.service.js');
            return await di_1.Container.get(AgentWakeService).getBackgroundUpdates(persistence.threadId, persistence.resourceId);
        });
    }
    async attachSubAgentDelegationTool(params) {
        const { agent, config, parentAgentId, projectId, credentialProvider, runType, workflowToolExecutionMode, delegation, parentWorkspaceHandle, user, instrumentation, rootSessionId, rootSessionCapUsd, budgetForwarded, runBackgroundSubAgent, } = params;
        const inlineSubAgentModelsByDifficulty = await this.resolveInlineSubAgentModelsByDifficulty(config, credentialProvider);
        agent.tool((0, delegate_sub_agent_tool_1.createN8nDelegateSubAgentTool)({
            runner: di_1.Container.get(sub_agent_runner_1.SubAgentRunner),
            ...delegation,
            projectId,
            parentAgentId,
            credentialProvider,
            runType,
            workflowToolExecutionMode,
            ...(parentWorkspaceHandle !== undefined ? { parentWorkspaceHandle } : {}),
            user,
            instrumentation,
            parentBudget: config.config?.guardrails?.budget,
            runBackgroundSubAgent,
            ...(budgetForwarded ? { rootSessionId, rootSessionCapUsd, budgetForwarded: true } : {}),
            policy: this.buildSubAgentPolicy(config),
            ...(inlineSubAgentModelsByDifficulty !== undefined
                ? { inlineSubAgentModelsByDifficulty }
                : {}),
            resolveInlineSubAgentProviderTools: (modelConfig) => (0, from_json_config_1.buildProviderToolsForModel)(config, modelConfig),
        }));
        this.logger.debug('Injected delegate_subagent tool', { agentId: parentAgentId });
    }
    async resolveInlineSubAgentModelsByDifficulty(config, credentialProvider) {
        const mappings = config.subAgents?.modelsByDifficulty;
        if (!mappings)
            return undefined;
        const resolved = {};
        for (const difficulty of api_types_1.SUB_AGENT_TASK_DIFFICULTIES) {
            const mapping = mappings[difficulty];
            if (!mapping)
                continue;
            resolved[difficulty] = await (0, model_config_1.resolveCredentialAwareModelConfig)(mapping.model, mapping.credential, credentialProvider);
        }
        return Object.keys(resolved).length > 0 ? resolved : undefined;
    }
    attachWriteTodosTool(agent, agentId) {
        agent.tool((0, agents_1.createWriteTodosTool)());
        this.logger.debug('Injected write_todos tool', { agentId });
    }
    async attachBackgroundJobTools(params) {
        const { agent, parentAgentId, projectId, delegation, ...runContext } = params;
        const { createBackgroundSubAgentHandler, createCheckBackgroundJobsTool, createCancelBackgroundJobTool, createResumeBackgroundJobsTool, } = await import('./background/background-job-tools.js');
        const { AgentBackgroundJobService } = await import('./background/agent-background-job.service.js');
        const { SubAgentBackgroundRunner } = await import('./background/sub-agent-background-runner.js');
        const jobService = di_1.Container.get(AgentBackgroundJobService);
        agent.tool(createCheckBackgroundJobsTool(jobService));
        agent.tool(createCancelBackgroundJobTool(jobService));
        agent.tool(createResumeBackgroundJobsTool({
            jobService,
            backgroundRunner: di_1.Container.get(SubAgentBackgroundRunner),
            projectId,
            parentAgentId,
            runContext,
        }));
        this.logger.debug('Injected background job tools', { agentId: parentAgentId });
        return createBackgroundSubAgentHandler({
            jobService,
            backgroundRunner: di_1.Container.get(SubAgentBackgroundRunner),
            sourcesById: delegation.sourcesById,
            availableSubAgents: delegation.availableSubAgents,
            projectId,
            parentAgentId,
            runContext,
        });
    }
    buildSubAgentPolicy(config) {
        return {
            maxChildren: config.subAgents?.maxChildren ?? api_types_1.SUB_AGENT_MAX_CHILDREN_DEFAULT,
        };
    }
};
exports.AgentRuntimeReconstructionService = AgentRuntimeReconstructionService;
exports.AgentRuntimeReconstructionService = AgentRuntimeReconstructionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository, agent_file_repository_1.AgentFileRepository, active_executions_1.ActiveExecutions, db_1.WorkflowRepository, n8n_checkpoint_storage_1.N8NCheckpointStorage, agent_secure_runtime_1.AgentSecureRuntime, node_execution_1.EphemeralNodeExecutor, n8n_memory_1.N8nMemory, oauth_service_1.OauthService, mcp_registry_service_1.McpRegistryService, agent_sandbox_runtime_service_1.AgentSandboxRuntimeService, ai_service_1.AiService, backend_network_1.OutboundHttp, agent_workspace_service_1.AgentWorkspaceService, agent_knowledge_mirror_service_1.AgentKnowledgeMirrorService, backend_services_1.CredentialsFinderService, workflow_finder_service_1.WorkflowFinderService, agent_chat_attachment_service_1.AgentChatAttachmentService, credentials_service_1.CredentialsService])
], AgentRuntimeReconstructionService);
//# sourceMappingURL=agent-runtime-reconstruction.service.js.map