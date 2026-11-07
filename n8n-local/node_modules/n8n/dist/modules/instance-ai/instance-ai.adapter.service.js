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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiAdapterService = void 0;
exports.resolveMetricProviders = resolveMetricProviders;
exports.buildEvaluationConfigDto = buildEvaluationConfigDto;
exports.evaluationConfigToSummary = evaluationConfigToSummary;
exports.evaluationConfigToDetail = evaluationConfigToDetail;
exports.resolveDataTableByIdOrName = resolveDataTableByIdOrName;
exports.truncateResultData = truncateResultData;
exports.extractExecutionResult = extractExecutionResult;
exports.extractExecutionOutcome = extractExecutionOutcome;
exports.formatExecutionError = formatExecutionError;
exports.truncateNodeOutput = truncateNodeOutput;
exports.redactExecuteNodeResult = redactExecuteNodeResult;
exports.extractNodeOutput = extractNodeOutput;
exports.extractExecutionDebugInfo = extractExecutionDebugInfo;
const ai_utilities_1 = require("@n8n/ai-utilities");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const telemetry_1 = require("@n8n/telemetry");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const active_executions_1 = require("../../active-executions");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
const credentials_overwrites_1 = require("../../credentials-overwrites");
const credentials_service_1 = require("../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const evaluation_config_service_1 = require("../../evaluation.ee/evaluation-config.service");
const llm_judge_provider_registry_1 = require("../../evaluation.ee/llm-judge-provider-registry");
const execution_persistence_1 = require("../../executions/execution-persistence");
const license_1 = require("../../license");
const load_nodes_and_credentials_1 = require("../../load-nodes-and-credentials");
const agents_credential_provider_1 = require("../../modules/agents/adapters/agents-credential-provider");
const scoped_credential_provider_1 = require("./eval/scoped-credential-provider");
const instance_ai_builder_delegate_adapter_1 = require("../../modules/agents/instance-ai-builder-delegate.adapter");
const data_table_repository_1 = require("../../modules/data-table/data-table.repository");
const data_table_service_1 = require("../../modules/data-table/data-table.service");
const node_description_transform_1 = require("../../modules/mcp-registry/node-description-transform");
const mcp_registry_connection_1 = require("../../modules/mcp-registry/mcp-registry-connection");
const mcp_registry_service_1 = require("../../modules/mcp-registry/registry/mcp-registry.service");
const workflow_dependency_query_service_1 = require("../../modules/workflow-index/workflow-dependency-query.service");
const node_catalog_1 = require("../../node-catalog");
const node_execution_1 = require("../../node-execution");
const node_types_1 = require("../../node-types");
const check_access_1 = require("../../permissions.ee/check-access");
const policy_enforcement_service_1 = require("../../policy/policy-enforcement.service");
const posthog_1 = require("../../posthog");
const ai_gateway_service_1 = require("../../services/ai-gateway.service");
const ai_preference_write_1 = require("../../services/ai-preference-write");
const ai_preference_service_1 = require("../../services/ai-preference.service");
const folder_service_1 = require("../../services/folder.service");
const node_resource_explorer_service_1 = require("../../services/node-resource-explorer.service");
const project_service_ee_1 = require("../../services/project.service.ee");
const tag_service_1 = require("../../services/tag.service");
const telemetry_2 = require("../../telemetry");
const node_definition_dirs_1 = require("../../utils/node-definition-dirs");
const workflow_runner_1 = require("../../workflow-runner");
const execution_timeout_validation_1 = require("../../workflows/execution-timeout-validation");
const utils_1 = require("../../workflows/utils");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const workflow_history_service_1 = require("../../workflows/workflow-history/workflow-history.service");
const workflow_service_1 = require("../../workflows/workflow.service");
const workflow_service_ee_1 = require("../../workflows/workflow.service.ee");
const agents_access_1 = require("./agents-access");
const extract_resolved_node_parameters_1 = require("./extract-resolved-node-parameters");
const instance_ai_execution_wait_1 = require("./instance-ai-execution-wait");
const instance_ai_folder_scope_1 = require("./instance-ai-folder-scope");
const instance_ai_run_pin_data_1 = require("./instance-ai-run-pin-data");
const instance_ai_settings_service_1 = require("./instance-ai-settings.service");
const instance_ai_step_run_1 = require("./instance-ai-step-run");
const instance_context_service_1 = require("./instance-context.service");
const mcp_1 = require("./mcp");
const node_definition_resolver_1 = require("./node-definition-resolver");
const web_research_1 = require("./web-research");
const workflow_templates_service_1 = require("./workflow-templates.service");
function resolveDisplayedDefaults(nodeProperties, parameters, nodeType, typeVersion, desc) {
    const stubNode = {
        id: '',
        name: '',
        type: nodeType,
        typeVersion,
        parameters: parameters,
        position: [0, 0],
    };
    const resolved = n8n_workflow_1.NodeHelpers.getNodeParameters(nodeProperties, parameters, true, false, stubNode, desc);
    return resolved ?? parameters;
}
function isToolNode(nodeTypes, node) {
    try {
        const { description } = nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
        return n8n_workflow_1.NodeHelpers.isTool(description, node.parameters);
    }
    catch {
        return false;
    }
}
function credentialDocsUrl(documentationUrl) {
    if (!documentationUrl)
        return undefined;
    if (documentationUrl.startsWith('http'))
        return documentationUrl;
    return `https://docs.n8n.io/integrations/builtin/credentials/${documentationUrl}/`;
}
function collectCredentialProperties(loadNodesAndCredentials, credentialType) {
    const allTypes = [credentialType];
    const { knownCredentials } = loadNodesAndCredentials;
    for (const typeName of allTypes) {
        allTypes.push(...(knownCredentials[typeName]?.extends ?? []));
    }
    const properties = [];
    const seen = new Set();
    for (const typeName of allTypes) {
        try {
            for (const prop of loadNodesAndCredentials.getCredential(typeName).type.properties) {
                if (prop.type === 'hidden' || seen.has(prop.name))
                    continue;
                seen.add(prop.name);
                properties.push(prop);
            }
        }
        catch {
        }
    }
    return properties;
}
function hasCredentialValue(value) {
    if (value === undefined || value === null)
        return false;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed !== '' && trimmed !== '{}' && trimmed !== '[]';
    }
    if (Array.isArray(value))
        return value.length > 0;
    if (typeof value === 'object')
        return Object.keys(value).length > 0;
    return true;
}
function toTelemetryReason(reason) {
    switch (reason) {
        case 'not-found':
            return 'not_found';
        case 'scope-too-wide':
            return 'scope_too_wide';
        default:
            return reason;
    }
}
let httpCredentialHostsCache;
let InstanceAiAdapterService = class InstanceAiAdapterService {
    async getNodesFromCache() {
        if (this.nodesCache && Date.now() < this.nodesCache.expiresAt) {
            return await this.nodesCache.promise;
        }
        const filePath = node_path_1.default.join(this.instanceSettings.staticCacheDir, 'types/nodes.json');
        const promise = (0, promises_1.readFile)(filePath, 'utf-8').then((json) => (0, n8n_workflow_1.jsonParse)(json));
        this.nodesCache = { promise, expiresAt: Date.now() + this.NODES_CACHE_TTL_MS };
        promise.catch(() => {
            this.nodesCache = null;
        });
        return await promise;
    }
    constructor(logger, globalConfig, workflowService, workflowFinderService, workflowRepository, sharedWorkflowRepository, projectRepository, executionRepository, credentialsService, credentialsFinderService, activeExecutions, workflowRunner, loadNodesAndCredentials, nodeTypes, instanceSettings, dataTableService, dataTableRepository, nodeResourceExplorerService, folderService, projectService, tagService, instanceWriteAccess, settingsService, workflowHistoryService, enterpriseWorkflowService, license, executionPersistence, eventService, roleService, telemetry, aiBuilderTemporaryWorkflowRepository, outboundHttp, aiGatewayService, workflowTemplatesService, collaborationService, policyEnforcementService, nodeCatalogService, evaluationConfigService, llmJudgeProviderRegistry, workflowDependencyQueryService, folderRepository, folderFinderService, instanceContext, executeNodeService, licenseState, aiPreferenceService) {
        this.globalConfig = globalConfig;
        this.workflowService = workflowService;
        this.workflowFinderService = workflowFinderService;
        this.workflowRepository = workflowRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.projectRepository = projectRepository;
        this.executionRepository = executionRepository;
        this.credentialsService = credentialsService;
        this.credentialsFinderService = credentialsFinderService;
        this.activeExecutions = activeExecutions;
        this.workflowRunner = workflowRunner;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.nodeTypes = nodeTypes;
        this.instanceSettings = instanceSettings;
        this.dataTableService = dataTableService;
        this.dataTableRepository = dataTableRepository;
        this.nodeResourceExplorerService = nodeResourceExplorerService;
        this.folderService = folderService;
        this.projectService = projectService;
        this.tagService = tagService;
        this.instanceWriteAccess = instanceWriteAccess;
        this.settingsService = settingsService;
        this.workflowHistoryService = workflowHistoryService;
        this.enterpriseWorkflowService = enterpriseWorkflowService;
        this.license = license;
        this.executionPersistence = executionPersistence;
        this.eventService = eventService;
        this.roleService = roleService;
        this.telemetry = telemetry;
        this.aiBuilderTemporaryWorkflowRepository = aiBuilderTemporaryWorkflowRepository;
        this.outboundHttp = outboundHttp;
        this.aiGatewayService = aiGatewayService;
        this.workflowTemplatesService = workflowTemplatesService;
        this.collaborationService = collaborationService;
        this.policyEnforcementService = policyEnforcementService;
        this.nodeCatalogService = nodeCatalogService;
        this.evaluationConfigService = evaluationConfigService;
        this.llmJudgeProviderRegistry = llmJudgeProviderRegistry;
        this.workflowDependencyQueryService = workflowDependencyQueryService;
        this.folderRepository = folderRepository;
        this.folderFinderService = folderFinderService;
        this.instanceContext = instanceContext;
        this.executeNodeService = executeNodeService;
        this.licenseState = licenseState;
        this.aiPreferenceService = aiPreferenceService;
        this.nodesCache = null;
        this.NODES_CACHE_TTL_MS = 5 * 60 * 1000;
        this.webResearchCache = new web_research_1.LRUCache({
            maxEntries: 100,
            ttlMs: 15 * 60 * 1000,
        });
        this.searchCache = new web_research_1.LRUCache({
            maxEntries: 100,
            ttlMs: 15 * 60 * 1000,
        });
        this.logger = logger.scoped('instance-ai');
        this.allowSendingParameterValues = globalConfig.ai.allowSendingParameterValues;
        this.loadNodesAndCredentials.addPostProcessor?.(async () => {
            this.nodesCache = null;
        });
    }
    createContext(user, options) {
        const { searchProxyConfig, pushRef, threadId, projectId, getCredentialIdAllowlist, shouldBypassCredentialTest, getCredentialTestTarget, agentId, configEvalsEnabled, setupPanelVariant, mcpConnectionsAvailable, nodeUsageEnabled, instanceContextEnabled, conversationHistory, folderExplorationEnabled, onboardingThread, credentialDescriptionsEnabled, aiPreferencesEnabled, modelId, allowSendingParameterValues = this.allowSendingParameterValues, } = options ?? {};
        void this.trackGatewayAvailability();
        const builderDelegateAdapter = this.getBuilderDelegateAdapter();
        const credentialService = this.createCredentialAdapter(user, projectId, getCredentialIdAllowlist, shouldBypassCredentialTest, getCredentialTestTarget);
        return {
            userId: user.id,
            projectId,
            ...(folderExplorationEnabled ? { folderExplorationEnabled: true } : {}),
            ...(onboardingThread ? { onboardingThread: true } : {}),
            ...(credentialDescriptionsEnabled ? { credentialDescriptionsEnabled: true } : {}),
            modelId,
            workflowService: this.createWorkflowAdapter(user, threadId, projectId, {
                nodeUsageGateOpen: nodeUsageEnabled === true,
                folderExploration: folderExplorationEnabled === true,
                setupPanelVariant,
                allowSendingParameterValues,
            }),
            executionService: this.createExecutionAdapter(user, allowSendingParameterValues, pushRef, threadId),
            credentialService,
            nodeService: this.createNodeAdapter(user),
            dataTableService: this.createDataTableAdapter(user, projectId),
            ...(configEvalsEnabled && this.evaluationConfigService
                ? {
                    evaluationConfigService: this.createEvaluationConfigAdapter(this.evaluationConfigService, user),
                }
                : {}),
            mcpService: mcpConnectionsAvailable ? this.createMcpAdapter(user) : undefined,
            executeNodeService: this.executeNodeService
                ? this.createExecuteNodeAdapter(this.executeNodeService, user, allowSendingParameterValues, projectId)
                : undefined,
            conversationHistoryService: conversationHistory,
            ...(instanceContextEnabled === true && this.instanceContext
                ? { activityService: this.createActivityAdapter(user, projectId) }
                : {}),
            ...(aiPreferencesEnabled ? { aiPreferenceService: this.createPreferenceAdapter(user) } : {}),
            webResearchService: this.createWebResearchAdapter(user, searchProxyConfig),
            workspaceService: this.createWorkspaceAdapter(user, projectId),
            templatesService: this.getTemplatesService(),
            workflowTemplateService: this.createWorkflowTemplateAdapter(),
            licenseHints: this.buildLicenseHints(),
            logger: this.logger,
            nodeTypesProvider: this.nodeTypes,
            outputSchemaLookup: this.loadNodesAndCredentials.createOutputSchemaLookup?.(),
            allowSendingParameterValues,
            ...(builderDelegateAdapter && agentId && projectId
                ? { agentBuilderTarget: { agentId, projectId } }
                : {}),
            ...(builderDelegateAdapter && projectId
                ? {
                    builderDelegate: builderDelegateAdapter.createDelegate(user, projectId, (targetAgentId) => this.createAgentCredentialProvider(user, projectId, targetAgentId, getCredentialIdAllowlist), credentialService, { useEvalModelCatalog: getCredentialIdAllowlist?.() !== undefined }),
                }
                : {}),
        };
    }
    createAgentCredentialProvider(user, projectId, agentId, getCredentialIdAllowlist) {
        const provider = new agents_credential_provider_1.AgentsCredentialProvider(this.credentialsService, projectId, user, agentId);
        return getCredentialIdAllowlist
            ? (0, scoped_credential_provider_1.scopeCredentialProvider)(provider, getCredentialIdAllowlist)
            : provider;
    }
    getBuilderDelegateAdapter() {
        if (!(0, agents_access_1.isAgentsAccessEnabled)())
            return null;
        try {
            return di_1.Container.get(instance_ai_builder_delegate_adapter_1.InstanceAiBuilderDelegateAdapterService);
        }
        catch (error) {
            this.logger.warn('Failed to resolve builder delegate adapter; agent building disabled', {
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    async getGatewayConfigOrNull() {
        try {
            this.aiGatewayService.assertEnabled();
            return await this.aiGatewayService.getGatewayConfig();
        }
        catch {
            return null;
        }
    }
    async resolveExperimentGates(user) {
        let flags = {};
        let instanceContextEnabled = false;
        try {
            const postHog = di_1.Container.get(posthog_1.PostHogClient);
            const [userFlags, instanceFlag] = await Promise.allSettled([
                postHog.getFeatureFlags(user),
                postHog.getFeatureFlagForInstance(api_types_1.INSTANCE_ACTIVITY_CONTEXT_FLAG),
            ]);
            if (userFlags.status === 'fulfilled')
                flags = userFlags.value;
            instanceContextEnabled = instanceFlag.status === 'fulfilled' && instanceFlag.value === true;
        }
        catch {
        }
        const setupPanelVariant = flags[api_types_1.INSTANCE_AI_SETUP_PANEL_FLAG];
        return {
            credentialDescriptionsEnabled: flags[api_types_1.CREDENTIAL_DESCRIPTIONS_FLAG] === true,
            configEvalsEnabled: flags[api_types_1.CONFIG_EVALUATIONS_FLAG] === api_types_1.CONFIG_EVALUATIONS_ENABLED_VARIANT,
            conversationHistoryEnabled: flags[api_types_1.INSTANCE_AI_CONVERSATION_HISTORY_FLAG] ===
                api_types_1.INSTANCE_AI_CONVERSATION_HISTORY_ENABLED_VARIANT,
            progressiveBuildingEnabled: flags[api_types_1.INSTANCE_AI_PROGRESSIVE_BUILDING_FLAG] ===
                api_types_1.INSTANCE_AI_PROGRESSIVE_BUILDING_ENABLED_VARIANT,
            conciseStyleEnabled: flags[api_types_1.INSTANCE_AI_CONCISE_STYLE_FLAG] === api_types_1.INSTANCE_AI_CONCISE_STYLE_ENABLED_VARIANT,
            setupPanelEnabled: setupPanelVariant === api_types_1.INSTANCE_AI_SETUP_PANEL_ENABLED_VARIANT,
            ...(setupPanelVariant === 'control' || setupPanelVariant === 'variant'
                ? { setupPanelVariant }
                : {}),
            nodeUsageEnabled: flags[api_types_1.INSTANCE_AI_NODE_USAGE_FLAG] === true,
            nodeContextEnabled: flags[api_types_1.CANVAS_NODE_CONTEXT_FLAG] === true || flags[api_types_1.AI_ASSISTANT_AT_MENTIONS_FLAG] === true,
            folderExplorationEnabled: flags[api_types_1.INSTANCE_AI_FOLDER_EXPLORATION_FLAG] ===
                api_types_1.INSTANCE_AI_FOLDER_EXPLORATION_ENABLED_VARIANT,
            aiPreferencesEnabled: flags[api_types_1.CONTEXT_PREFERENCES_FLAG] === api_types_1.CONTEXT_PREFERENCES_ENABLED_VARIANT,
            instanceContextEnabled,
        };
    }
    createActivityAdapter(user, projectId) {
        const instanceContext = this.instanceContext;
        if (!instanceContext)
            throw new n8n_workflow_1.UnexpectedError('Instance context service is not available');
        const scope = {
            surface: 'conversation',
            ...(projectId !== undefined ? { projectId } : {}),
        };
        return {
            list: async (input) => await instanceContext.list({
                user,
                scope,
                limit: input.limit,
                ...(input.category !== undefined ? { category: input.category } : {}),
                ...(input.resourceId !== undefined ? { resourceId: input.resourceId } : {}),
                ...(input.beforeId !== undefined ? { beforeId: input.beforeId } : {}),
            }),
            expand: async (id) => await instanceContext.expand({ id, user, scope }),
        };
    }
    createPreferenceAdapter(user) {
        const aiPreferenceService = this.aiPreferenceService;
        if (!aiPreferenceService)
            throw new n8n_workflow_1.UnexpectedError('AI preference service is not available');
        return {
            create: async ({ content, scope }) => {
                const result = await (0, ai_preference_write_1.writeAssistantPreference)({
                    aiPreferenceService,
                    telemetry: this.telemetry,
                    logger: this.logger,
                    user,
                    surface: 'aia',
                    content,
                    scope,
                });
                if (!result.ok)
                    return result;
                const { id, content: saved, userId, projectId } = result.preference;
                return { ok: true, preference: { id, content: saved, scope, userId, projectId } };
            },
            recordRejection: (reason, textLength, scope) => {
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_WRITE_REJECTED, {
                    user_id: user.id,
                    surface: 'aia',
                    reason,
                    scope_type: scope,
                    text_length: textLength,
                });
            },
        };
    }
    createMcpAdapter(user) {
        const toSummaries = (servers) => servers
            .filter((server) => !server.isTemplated)
            .map((server) => ({
            slug: server.slug,
            title: server.title,
            description: server.description,
            tools: server.tools.map((tool) => tool.name),
        }));
        return {
            search: async (queries) => {
                const [servers, connections] = await Promise.all([
                    di_1.Container.get(mcp_registry_service_1.McpRegistryService).search(queries),
                    this.listMcpRegistryConnections(user),
                ]);
                const connected = new Set(connections.map((connection) => connection.slug));
                return toSummaries(servers.filter((server) => !connected.has(server.slug)));
            },
            getServers: async (slugs) => {
                const servers = await di_1.Container.get(mcp_registry_service_1.McpRegistryService).getBySlugs(slugs);
                return servers
                    .filter((server) => {
                    if (server.status !== 'active')
                        return false;
                    const connection = (0, mcp_registry_connection_1.resolveMcpRegistryConnection)(server);
                    return connection !== null && !connection.isTemplated;
                })
                    .map((server) => ({
                    slug: server.slug,
                    title: server.title,
                    description: server.tagline,
                    usesCredentials: (0, node_description_transform_1.getMcpRegistryCredentialOptions)(server),
                    tools: server.tools.map((tool) => tool.name),
                }));
            },
            listConnections: async () => await this.listMcpRegistryConnections(user),
        };
    }
    createExecuteNodeAdapter(executeNodeService, user, allowSendingParameterValues, boundProjectId) {
        const { resolveProjectId } = this.createProjectScopeHelpers(user, boundProjectId);
        return {
            execute: async (request) => {
                this.assertInstanceNotReadOnly('executions');
                const projectId = await resolveProjectId(['workflow:create', 'workflow:execute']);
                const result = await executeNodeService.run(user, {
                    type: request.type,
                    version: request.version,
                    config: {
                        parameters: request.config.parameters,
                        credentials: request.config.credentials,
                    },
                    input: request.input,
                    timeoutMs: request.timeoutMs,
                    projectId,
                });
                return redactExecuteNodeResult(result, allowSendingParameterValues);
            },
        };
    }
    async listMcpRegistryConnections(user) {
        const connections = await di_1.Container.get(mcp_1.InstanceAiMcpRegistryService).listConnectionsForUser(user);
        return [...new Set(connections.map((connection) => connection.serverSlug))].map((slug) => ({
            slug,
        }));
    }
    buildAiGatewayNodeMeta(config, nodeName) {
        if (!config)
            return undefined;
        if (!config.nodes.includes(nodeName))
            return undefined;
        const meta = { supported: true };
        const operations = config.supportedActions?.[nodeName];
        if (operations && Object.keys(operations).length > 0)
            meta.operations = operations;
        const minVersion = config.minNodeTypeVersion?.[nodeName];
        if (minVersion !== undefined)
            meta.minVersion = minVersion;
        const hiddenProperties = config.hiddenNodeProperties?.[nodeName];
        if (hiddenProperties && hiddenProperties.length > 0)
            meta.hiddenProperties = hiddenProperties;
        return meta;
    }
    getTemplatesService() {
        if (!this.templatesService) {
            this.templatesService = new instance_ai_1.BuilderTemplatesService({
                ...(0, instance_ai_1.builderTemplatesOptionsFromEnv)({ logger: this.logger }),
                cacheDir: node_path_1.default.join(this.instanceSettings.n8nFolder, 'n8n-sdk-templates'),
                logger: this.logger,
            });
        }
        return this.templatesService;
    }
    createWorkflowTemplateAdapter() {
        const workflowTemplatesService = this.workflowTemplatesService;
        return {
            async getTemplate(templateId) {
                return await workflowTemplatesService.getTemplate(templateId);
            },
        };
    }
    teamProjectsLicensed() {
        return this.licenseState?.isTeamProjectsLicensed() ?? true;
    }
    buildLicenseHints() {
        const hints = [];
        if (!this.license.isLicensed('feat:namedVersions')) {
            hints.push('**Named workflow versions** — naming and describing workflow versions (update-workflow-version) is available on the Pro plan and above.');
        }
        if (!this.license.isLicensed('feat:folders')) {
            hints.push('**Folders** — organizing workflows into folders (list-folders, create-folder, delete-folder, move-workflow-to-folder) is available on registered Community Edition or paid plans.');
        }
        if (!this.teamProjectsLicensed()) {
            hints.push('**Team projects** — this instance has no team-project license. `list-projects` returns only the user personal project and the project of this conversation, even when the instance holds more. Do not offer to create or move resources into another project. Team projects need a plan upgrade.');
        }
        return hints;
    }
    async trackGatewayAvailability() {
        const config = await this.getGatewayConfigOrNull();
        if (!config)
            return;
        this.telemetry.track('instance_ai_gateway_available', {
            nodeCount: config.nodes.length,
            credentialTypeCount: config.credentialTypes.length,
        });
    }
    assertInstanceNotReadOnly(resourceType) {
        if (this.instanceWriteAccess.isReadOnly()) {
            throw new Error(`Cannot modify ${resourceType} on a protected instance. This instance is in read-only mode.`);
        }
    }
    createProjectScopeHelpers(user, boundProjectId) {
        const { projectRepository } = this;
        let personalProjectIdPromise = null;
        const getPersonalProjectId = async () => {
            personalProjectIdPromise ??= projectRepository
                .getPersonalProjectForUserOrFail(user.id)
                .then((p) => p.id);
            return await personalProjectIdPromise;
        };
        const assertProjectScope = async (scopes, projectId) => {
            const allowed = await (0, check_access_1.userHasScopes)(user, scopes, false, { projectId });
            if (!allowed) {
                throw new Error('User does not have the required permissions in this project');
            }
        };
        const resolveProjectId = async (scopes, providedProjectId) => {
            const projectId = providedProjectId ?? boundProjectId ?? (await getPersonalProjectId());
            await assertProjectScope(scopes, projectId);
            return projectId;
        };
        const resolveBoundProjectId = async (scopes) => {
            if (!boundProjectId) {
                throw new n8n_workflow_1.UnexpectedError('Cannot create a resource: this Instance AI run has no bound project.');
            }
            await assertProjectScope(scopes, boundProjectId);
            return boundProjectId;
        };
        return { getPersonalProjectId, assertProjectScope, resolveProjectId, resolveBoundProjectId };
    }
    createWorkflowAdapter(user, threadId, boundProjectId, options = {}) {
        const setupExperimentProperties = options.setupPanelVariant
            ? {
                variant: options.setupPanelVariant,
                [`$feature/${api_types_1.INSTANCE_AI_SETUP_PANEL_FLAG}`]: options.setupPanelVariant,
            }
            : {};
        const foldersOn = options.folderExploration === true;
        const foldersAttributed = foldersOn && this.license.isLicensed('feat:folders');
        const { folderRepository, folderFinderService, projectService } = this;
        const { workflowService, workflowFinderService, workflowRepository, sharedWorkflowRepository, aiBuilderTemporaryWorkflowRepository, workflowHistoryService, enterpriseWorkflowService, executionRepository, executionPersistence, license, telemetry, eventService, collaborationService, policyEnforcementService, workflowDependencyQueryService, } = this;
        const logger = this.logger;
        const maxExecutionTimeout = this.globalConfig.executions.maxTimeout;
        const assertNotReadOnly = () => this.assertInstanceNotReadOnly('workflows');
        const nodeUsageEnabled = options.nodeUsageGateOpen === true && workflowDependencyQueryService !== undefined;
        const resolveTargetProjectId = (options) => options?.projectId ?? (options?.scope !== 'instance' ? boundProjectId : undefined);
        const { resolveBoundProjectId } = this.createProjectScopeHelpers(user, boundProjectId);
        const redactParameters = !(options.allowSendingParameterValues ?? this.allowSendingParameterValues);
        const assertParameterValuesAvailable = () => {
            if (redactParameters) {
                throw new n8n_workflow_1.UserError('Cannot create or edit workflows while parameter values are hidden from n8n Assistant. An instance owner or admin can turn on "Send actual data values" in Settings > AI usage.');
            }
        };
        const assertNotLockedByEditor = async (workflowId) => {
            try {
                await collaborationService.ensureWorkflowEditable(workflowId);
            }
            catch (error) {
                if (error instanceof errors_1.LockedError)
                    throw new instance_ai_1.WorkflowEditorLockedError(workflowId);
                throw error;
            }
        };
        const readFoldersInScope = async (projectIds, requested) => {
            if (!license.isLicensed('feat:folders') || !folderRepository)
                return undefined;
            const wantedLeaf = requested.folderPath !== undefined
                ? (0, instance_ai_folder_scope_1.normalizeFolderPath)(requested.folderPath).split('/').at(-1)
                : undefined;
            const scopedProjectIds = [];
            for (const projectId of projectIds) {
                if (await (0, check_access_1.userHasScopes)(user, ['folder:list'], false, { projectId })) {
                    scopedProjectIds.push(projectId);
                }
            }
            const byId = new Map();
            const add = (row, projectId) => {
                if (!byId.has(row.id))
                    byId.set(row.id, { id: row.id, name: row.name, path: row.name, projectId });
            };
            for (const projectId of scopedProjectIds) {
                if (requested.folderId !== undefined && requested.folderId !== '') {
                    try {
                        add(await folderRepository.findOneOrFailFolderInProject(requested.folderId, projectId), projectId);
                    }
                    catch {
                    }
                }
                else if (wantedLeaf) {
                    const rows = await folderRepository.findManyByExactName(projectId, wantedLeaf, instance_ai_folder_scope_1.FOLDER_SCAN_LIMIT);
                    for (const row of rows)
                        add(row, projectId);
                }
            }
            if (byId.size === 0) {
                for (const projectId of scopedProjectIds) {
                    const rows = await folderRepository.getMany({
                        filter: { projectId },
                        select: { name: true },
                        take: instance_ai_folder_scope_1.FOLDER_SCAN_LIMIT,
                    });
                    for (const row of rows)
                        add(row, projectId);
                }
            }
            const folders = [...byId.values()];
            const paths = await readFolderPaths(folderRepository, folders.map((folder) => folder.id));
            return folders.map((folder) => ({ ...folder, path: paths.get(folder.id) ?? folder.name }));
        };
        const notifyWorkflowUpdated = async (workflowId) => {
            try {
                await collaborationService.broadcastWorkflowUpdate(workflowId, user.id);
            }
            catch (error) {
                logger.warn('Failed to notify open editors of an AI workflow update', {
                    threadId,
                    workflowId,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        };
        const trackListed = (props) => {
            try {
                telemetry.track(telemetry_1.TELEMETRY_EVENT.INSTANCE_AI.BUILDER_LISTED_WORKFLOWS, {
                    user_id: user.id,
                    ...(threadId ? { thread_id: threadId } : {}),
                    folder_exploration_enabled: foldersOn,
                    folder_scope: props.folderScope,
                    ...(props.recursive !== undefined ? { recursive: props.recursive } : {}),
                    ...(props.folderResolution ? { folder_resolution: props.folderResolution } : {}),
                    ...(props.candidateCount !== undefined ? { candidate_count: props.candidateCount } : {}),
                    scope: props.scope,
                    has_query: props.hasQuery,
                    result_count: props.resultCount,
                    total: props.total,
                });
            }
            catch {
            }
        };
        return {
            ...(nodeUsageEnabled && workflowDependencyQueryService
                ? {
                    async nodeUsage(options) {
                        const targetProjectId = resolveTargetProjectId(options);
                        const result = await workflowDependencyQueryService.getNodeTypeUsage(user, {
                            ...(targetProjectId ? { projectId: targetProjectId } : {}),
                            ...(options?.nodeType ? { nodeType: options.nodeType } : {}),
                            ...(options?.limit !== undefined ? { limit: options.limit } : {}),
                        });
                        return {
                            workflowsInScope: result.workflowsInScope,
                            ...(result.nodeTypes ? { nodeTypes: result.nodeTypes } : {}),
                            ...(result.workflows
                                ? {
                                    workflows: result.workflows.map((workflow) => ({
                                        ...workflow,
                                        updatedAt: workflow.updatedAt.toISOString(),
                                    })),
                                }
                                : {}),
                            ...(result.truncated ? { truncated: true } : {}),
                        };
                    },
                }
                : {}),
            async list(options) {
                const targetProjectId = resolveTargetProjectId(options);
                const folderScope = foldersOn
                    ? options?.folderId !== undefined
                        ? 'id'
                        : options?.folderPath !== undefined
                            ? 'path'
                            : 'none'
                    : 'none';
                const listScope = options?.scope === 'instance' ? 'instance' : 'project';
                const failFolderResolution = (folderResolution) => {
                    trackListed({
                        folderScope,
                        recursive: options?.recursive !== false,
                        folderResolution: toTelemetryReason(folderResolution.reason),
                        candidateCount: folderResolution.candidates.length,
                        scope: listScope,
                        hasQuery: Boolean(options?.query),
                        resultCount: 0,
                        total: 0,
                    });
                    return { workflows: [], total: 0, totalInScope: 0, folderResolution };
                };
                let folderIds;
                if (foldersOn && (options?.folderPath !== undefined || options?.folderId !== undefined)) {
                    const requested = options.folderId ?? options.folderPath ?? '';
                    const projectIds = targetProjectId
                        ? [targetProjectId]
                        : (await projectService.getAccessibleProjects(user)).map((project) => project.id);
                    if (targetProjectId === undefined && projectIds.length > instance_ai_folder_scope_1.FOLDER_SCAN_PROJECT_LIMIT) {
                        return failFolderResolution({ requested, reason: 'scope-too-wide', candidates: [] });
                    }
                    const foldersInScope = await readFoldersInScope(projectIds, {
                        folderPath: options.folderPath,
                        folderId: options.folderId,
                    });
                    const resolved = (0, instance_ai_folder_scope_1.resolveRequestedFolder)({ folderPath: options.folderPath, folderId: options.folderId }, foldersInScope);
                    if (!('folderId' in resolved)) {
                        return failFolderResolution({ requested, ...resolved });
                    }
                    if (!folderFinderService) {
                        return failFolderResolution({ requested, reason: 'unsupported', candidates: [] });
                    }
                    const expanded = await folderFinderService.findFolderFilterIdsWithoutAccessCheck(resolved.folderId, options.recursive !== false);
                    if (expanded.length === 0) {
                        return failFolderResolution({
                            requested,
                            reason: 'not-found',
                            candidates: (0, instance_ai_folder_scope_1.listCandidatePaths)(foldersInScope ?? []),
                        });
                    }
                    folderIds = expanded;
                }
                const scopeFilter = {
                    ...(options?.status === 'all' ? {} : { isArchived: options?.status === 'archived' }),
                    ...(targetProjectId ? { projectId: targetProjectId } : {}),
                    ...(nodeUsageEnabled && options?.nodeTypes?.length
                        ? { nodeTypes: options.nodeTypes }
                        : {}),
                    ...(folderIds ? { parentFolderIds: folderIds } : {}),
                };
                const filter = {
                    ...scopeFilter,
                    ...(options?.query ? { query: options.query } : {}),
                };
                const { workflows, count } = await workflowService.getMany(user, {
                    take: options?.limit ?? 50,
                    filter,
                });
                const totalInScope = options?.query
                    ? (await workflowService.getMany(user, { take: 1, filter: scopeFilter })).count
                    : count;
                const attributeProjects = targetProjectId === undefined;
                const rows = workflows.filter((wf) => 'versionId' in wf);
                const rowFolderProjectId = (wf) => readHomeProject(wf)?.id;
                const folderProjectIds = foldersAttributed
                    ? [
                        ...new Set(rows.flatMap((wf) => (readParentFolder(wf) ? (rowFolderProjectId(wf) ?? []) : []))),
                    ]
                    : [];
                const scopedFolderProjectIds = new Set((await Promise.all(folderProjectIds.map(async (projectId) => [
                    projectId,
                    await (0, check_access_1.userHasScopes)(user, ['folder:list'], false, { projectId }),
                ])))
                    .filter(([, allowed]) => allowed)
                    .map(([projectId]) => projectId));
                const canAttributeFolder = (wf) => {
                    if (!foldersAttributed)
                        return false;
                    const projectId = rowFolderProjectId(wf);
                    return projectId !== undefined && scopedFolderProjectIds.has(projectId);
                };
                const folderPaths = scopedFolderProjectIds.size > 0 && folderRepository
                    ? await readFolderPaths(folderRepository, rows.flatMap((wf) => canAttributeFolder(wf) ? (readParentFolder(wf)?.id ?? []) : []))
                    : new Map();
                trackListed({
                    folderScope,
                    ...(folderIds
                        ? { recursive: options?.recursive !== false, folderResolution: 'resolved' }
                        : {}),
                    scope: listScope,
                    hasQuery: Boolean(options?.query),
                    resultCount: rows.length,
                    total: count,
                });
                return {
                    workflows: rows.map((wf) => {
                        const project = attributeProjects ? readHomeProject(wf) : undefined;
                        const parent = canAttributeFolder(wf) ? readParentFolder(wf) : undefined;
                        const folder = parent
                            ? {
                                id: parent.id,
                                name: parent.name,
                                path: folderPaths.get(parent.id) ?? parent.name,
                            }
                            : undefined;
                        return {
                            id: wf.id,
                            name: wf.name,
                            versionId: wf.versionId,
                            activeVersionId: wf.activeVersionId ?? null,
                            isArchived: wf.isArchived,
                            createdAt: wf.createdAt.toISOString(),
                            updatedAt: wf.updatedAt.toISOString(),
                            ...(project ? { project } : {}),
                            ...(folder ? { folder } : {}),
                        };
                    }),
                    total: count,
                    totalInScope,
                };
            },
            async get(workflowId) {
                const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:read',
                ]);
                if (!workflow) {
                    throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                }
                return await toWorkflowDetailWithChecksum(workflow, { redactParameters });
            },
            async archive(workflowId) {
                assertNotReadOnly();
                await assertNotLockedByEditor(workflowId);
                const result = await workflowService.archive(user, workflowId, { skipArchived: true });
                if (!result) {
                    throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                }
                await notifyWorkflowUpdated(workflowId);
            },
            async unarchive(workflowId) {
                assertNotReadOnly();
                const result = await workflowService.unarchive(user, workflowId);
                if (!result) {
                    throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                }
            },
            async clearAiTemporary(workflowId) {
                assertNotReadOnly();
                const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:update',
                ]);
                if (!workflow)
                    return;
                if (!(await aiBuilderTemporaryWorkflowRepository.existsForWorkflow(workflowId)))
                    return;
                await aiBuilderTemporaryWorkflowRepository.unmark(workflowId);
            },
            async archiveIfAiTemporary(workflowId) {
                assertNotReadOnly();
                const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:update',
                ]);
                if (!workflow)
                    return false;
                if (!(await aiBuilderTemporaryWorkflowRepository.existsForWorkflow(workflowId))) {
                    return false;
                }
                if (workflow.isArchived) {
                    await aiBuilderTemporaryWorkflowRepository.unmark(workflowId);
                    return false;
                }
                await workflowService.archive(user, workflowId, { skipArchived: true });
                await aiBuilderTemporaryWorkflowRepository.unmark(workflowId);
                return true;
            },
            async publish(workflowId, options) {
                await assertNotLockedByEditor(workflowId);
                const wf = await workflowService.activateWorkflow(user, workflowId, {
                    versionId: options?.versionId,
                    name: options?.name,
                    description: options?.description,
                    source: 'n8n-ai',
                });
                if (!wf.activeVersionId) {
                    throw new Error(`Workflow ${workflowId} was not activated — no active version set`);
                }
                if (threadId) {
                    telemetry.track('Builder published workflow', {
                        ...setupExperimentProperties,
                        user_id: user.id,
                        thread_id: threadId,
                        workflow_id: workflowId,
                        executed_by: 'ai',
                    });
                }
                await notifyWorkflowUpdated(workflowId);
                return { activeVersionId: wf.activeVersionId };
            },
            async unpublish(workflowId) {
                await assertNotLockedByEditor(workflowId);
                await workflowService.deactivateWorkflow(user, workflowId, {
                    source: 'n8n-ai',
                });
                await notifyWorkflowUpdated(workflowId);
            },
            async getAsWorkflowJSON(workflowId, versionId) {
                const wf = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:read',
                ]);
                if (!wf)
                    throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                if (!versionId)
                    return toWorkflowJSON(wf, { redactParameters });
                const version = await workflowHistoryService.getVersion(user, workflowId, versionId);
                return toWorkflowJSON(wf, { redactParameters, graph: version });
            },
            async getPinnedDataSummary(workflowId) {
                const wf = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:read',
                ]);
                if (!wf)
                    throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                return Object.entries(wf.pinData ?? {}).map(([nodeName, items]) => ({
                    nodeName,
                    itemCount: Array.isArray(items) ? items.length : 0,
                }));
            },
            async getWorkflowHead(workflowId) {
                const head = await workflowFinderService.findWorkflowHeadForUser(workflowId, user, [
                    'workflow:read',
                ]);
                if (!head)
                    throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                return {
                    versionId: head.versionId,
                    activeVersionId: head.activeVersionId,
                    updatedAt: head.updatedAt.getTime(),
                };
            },
            async getWorkflowSnapshot(workflowId) {
                const wf = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:read',
                ]);
                if (!wf)
                    throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                return {
                    json: toWorkflowJSON(wf, { redactParameters }),
                    versionId: wf.versionId,
                    updatedAt: wf.updatedAt.getTime(),
                };
            },
            async getLatestRunData(workflowId) {
                const accessible = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:read',
                ]);
                if (!accessible)
                    return null;
                const [latest] = await executionRepository.find({
                    select: ['id'],
                    where: { workflowId },
                    order: { startedAt: 'DESC' },
                    take: 1,
                });
                if (!latest)
                    return null;
                const execution = await executionPersistence.findSingleExecution(latest.id, {
                    includeData: true,
                    unflattenData: true,
                });
                return execution?.data?.resultData?.runData ?? null;
            },
            async createFromWorkflowJSON(json, options) {
                assertNotReadOnly();
                assertParameterValuesAvailable();
                const projectId = await resolveBoundProjectId(['workflow:create']);
                let placement;
                if (foldersOn && (options?.folderPath !== undefined || options?.folderId !== undefined)) {
                    const requested = options.folderId ?? options.folderPath ?? '';
                    const foldersInScope = await readFoldersInScope([projectId], {
                        folderPath: options.folderPath,
                        folderId: options.folderId,
                    });
                    const resolved = (0, instance_ai_folder_scope_1.resolveRequestedFolder)({ folderPath: options.folderPath, folderId: options.folderId }, foldersInScope);
                    if (!('folderId' in resolved)) {
                        throw new instance_ai_1.FolderResolutionError({ requested, ...resolved });
                    }
                    placement = foldersInScope?.find((folder) => folder.id === resolved.folderId);
                }
                const settings = {
                    executionOrder: 'v1',
                    ...(json.settings ?? {}),
                };
                (0, execution_timeout_validation_1.assertExecutionTimeoutWithinMax)(settings.executionTimeout, maxExecutionTimeout);
                if (settings.redactionPolicy !== undefined && settings.redactionPolicy !== 'none') {
                    const canUpdateRedaction = await (0, check_access_1.userHasScopes)(user, ['workflow:enableRedaction'], false, { projectId });
                    if (!canUpdateRedaction) {
                        delete settings.redactionPolicy;
                    }
                }
                const newWorkflow = workflowRepository.create({
                    name: json.name,
                    nodes: [],
                    connections: {},
                    settings,
                    active: false,
                    versionId: (0, node_crypto_1.randomUUID)(),
                });
                const cleared = await policyEnforcementService.enforceWorkflowSave({
                    workflow: { id: null, name: newWorkflow.name, nodes: newWorkflow.nodes },
                    storedWorkflow: null,
                    projectId,
                }, { kind: 'user', user });
                const saved = await workflowRepository.runInTransaction({ policyCleared: cleared }, async (transactionManager, ctx) => {
                    const workflow = await workflowRepository.createContent(newWorkflow, ctx);
                    await sharedWorkflowRepository.makeOwner([workflow.id], projectId, transactionManager);
                    if (options?.markAsAiTemporary) {
                        if (!threadId) {
                            throw new n8n_workflow_1.UnexpectedError('Cannot mark AI-builder temporary workflow without a thread ID');
                        }
                        await aiBuilderTemporaryWorkflowRepository.mark(workflow.id, threadId, transactionManager);
                    }
                    return workflow;
                });
                const nodes = sanitizeCredentialReferencesForSave(json.nodes);
                let updateData = workflowRepository.create({
                    name: json.name,
                    nodes: nodes,
                    connections: json.connections,
                    settings,
                    pinData: (0, instance_ai_run_pin_data_1.sdkPinDataToRuntime)(json.pinData),
                    nodeGroups: sdkNodeGroupsToRuntime(json.nodeGroups),
                });
                let updated;
                try {
                    if (license.isSharingEnabled()) {
                        updateData = await enterpriseWorkflowService.preventTampering(updateData, saved.id, user);
                    }
                    updated = await workflowService.update(user, updateData, saved.id, {
                        source: 'n8n-ai',
                        ...(placement ? { parentFolderId: placement.id } : {}),
                    });
                }
                catch (error) {
                    logger.warn('AI-builder workflow save failed', {
                        threadId,
                        workflowId: saved.id,
                        error: error instanceof Error ? error.message : String(error),
                    });
                    try {
                        const archived = await workflowService.archive(user, saved.id, { skipArchived: true });
                        if (archived && options?.markAsAiTemporary) {
                            await aiBuilderTemporaryWorkflowRepository.unmark(saved.id);
                        }
                    }
                    catch (cleanupError) {
                        logger.warn('Failed to clean up AI-builder workflow shell after create failure', {
                            threadId,
                            workflowId: saved.id,
                            error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
                        });
                    }
                    throw error;
                }
                if (threadId) {
                    eventService.emit('experiment-assistant-change-saved', {
                        userId: user.id,
                        at: Date.now(),
                    });
                    telemetry.track('Builder created workflow', {
                        ...setupExperimentProperties,
                        user_id: user.id,
                        thread_id: threadId,
                        workflow_id: updated.id,
                        folder_placement: placement ? 'resolved' : 'none',
                    });
                }
                const detail = await toWorkflowDetailWithChecksum(updated, { redactParameters });
                if (placement) {
                    detail.folder = { id: placement.id, name: placement.name, path: placement.path };
                }
                return detail;
            },
            async updateFromWorkflowJSON(workflowId, json, options) {
                assertNotReadOnly();
                assertParameterValuesAvailable();
                await assertNotLockedByEditor(workflowId);
                const settings = (json.settings ?? {});
                let storedWorkflow;
                const getStoredWorkflow = async () => await (storedWorkflow ??= workflowRepository.findOne({ where: { id: workflowId } }));
                if ((0, execution_timeout_validation_1.exceedsMaxExecutionTimeout)(settings.executionTimeout, maxExecutionTimeout)) {
                    const existingWorkflow = await getStoredWorkflow();
                    if (existingWorkflow?.settings?.executionTimeout !== settings.executionTimeout) {
                        (0, execution_timeout_validation_1.assertExecutionTimeoutWithinMax)(settings.executionTimeout, maxExecutionTimeout);
                    }
                }
                if (settings.redactionPolicy !== undefined) {
                    const [existingWorkflow, ownerProject] = await Promise.all([
                        getStoredWorkflow(),
                        sharedWorkflowRepository.getWorkflowOwningProject(workflowId),
                    ]);
                    const currentPolicy = existingWorkflow?.settings?.redactionPolicy;
                    if (settings.redactionPolicy !== currentPolicy) {
                        const requiredScopes = (0, utils_1.getRequiredRedactionScopes)(currentPolicy, settings.redactionPolicy);
                        const canUpdateRedaction = ownerProject &&
                            (await (0, check_access_1.userHasScopes)(user, requiredScopes, false, { projectId: ownerProject.id }));
                        if (!canUpdateRedaction) {
                            delete settings.redactionPolicy;
                        }
                    }
                }
                const nodes = sanitizeCredentialReferencesForSave(json.nodes);
                let updateData = workflowRepository.create({
                    name: json.name,
                    nodes: nodes,
                    connections: json.connections,
                    settings,
                    pinData: (0, instance_ai_run_pin_data_1.sdkPinDataToRuntime)(json.pinData),
                    nodeGroups: sdkNodeGroupsToRuntime(json.nodeGroups),
                });
                let updated;
                try {
                    if (license.isSharingEnabled()) {
                        updateData = await enterpriseWorkflowService.preventTampering(updateData, workflowId, user);
                    }
                    updated = await workflowService.update(user, updateData, workflowId, {
                        source: 'n8n-ai',
                        ...(options?.expectedChecksum ? { expectedChecksum: options.expectedChecksum } : {}),
                    });
                }
                catch (error) {
                    if (error instanceof errors_1.ConflictError) {
                        throw new instance_ai_1.WorkflowSaveConflictError(workflowId);
                    }
                    if (error instanceof errors_1.NotFoundError) {
                        throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                    }
                    logger.warn('AI-builder workflow save failed', {
                        threadId,
                        workflowId,
                        error: error instanceof Error ? error.message : String(error),
                    });
                    throw error;
                }
                if (threadId) {
                    eventService.emit('experiment-assistant-change-saved', {
                        userId: user.id,
                        at: Date.now(),
                    });
                    telemetry.track('Builder modified workflow', {
                        ...setupExperimentProperties,
                        user_id: user.id,
                        thread_id: threadId,
                        workflow_id: workflowId,
                    });
                }
                await notifyWorkflowUpdated(workflowId);
                return await toWorkflowDetailWithChecksum(updated, { redactParameters });
            },
            async listVersions(workflowId, options) {
                const take = options?.limit ?? 20;
                const skip = options?.skip ?? 0;
                const versions = await workflowHistoryService.getList(user, workflowId, take, skip);
                const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:read',
                ]);
                const activeVersionId = workflow?.activeVersionId ?? null;
                const currentDraftVersionId = workflow?.versionId ?? null;
                return versions.map((v) => ({
                    versionId: v.versionId,
                    name: v.name ?? null,
                    description: v.description ?? null,
                    authors: v.authors,
                    createdAt: v.createdAt.toISOString(),
                    autosaved: v.autosaved ?? false,
                    isActive: v.versionId === activeVersionId,
                    isCurrentDraft: v.versionId === currentDraftVersionId,
                }));
            },
            async getVersion(workflowId, versionId) {
                const version = await workflowHistoryService.getVersion(user, workflowId, versionId);
                const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:read',
                ]);
                const activeVersionId = workflow?.activeVersionId ?? null;
                const currentDraftVersionId = workflow?.versionId ?? null;
                return {
                    versionId: version.versionId,
                    name: version.name ?? null,
                    description: version.description ?? null,
                    authors: version.authors,
                    createdAt: version.createdAt.toISOString(),
                    autosaved: version.autosaved ?? false,
                    isActive: version.versionId === activeVersionId,
                    isCurrentDraft: version.versionId === currentDraftVersionId,
                    nodes: (version.nodes ?? []).map((n) => ({
                        name: n.name,
                        type: n.type,
                        typeVersion: n.typeVersion,
                        parameters: redactParameters ? undefined : n.parameters,
                        position: n.position,
                    })),
                    connections: version.connections,
                };
            },
            async restoreVersion(workflowId, versionId) {
                assertParameterValuesAvailable();
                await assertNotLockedByEditor(workflowId);
                const version = await workflowHistoryService.getVersion(user, workflowId, versionId);
                const updateData = workflowRepository.create({
                    nodes: version.nodes,
                    connections: version.connections,
                    nodeGroups: version.nodeGroups,
                });
                const updated = await workflowService.update(user, updateData, workflowId, {
                    source: 'n8n-ai',
                });
                await notifyWorkflowUpdated(workflowId);
                return await toWorkflowDetailWithChecksum(updated, { redactParameters });
            },
            ...(this.license.isLicensed('feat:namedVersions')
                ? {
                    async updateVersion(workflowId, versionId, data) {
                        await workflowHistoryService.updateVersionForUser(user, workflowId, versionId, data);
                    },
                }
                : {}),
        };
    }
    createExecutionAdapter(user, allowSendingParameterValues, pushRef, threadId) {
        const { workflowFinderService, workflowRunner, activeExecutions, executionRepository, executionPersistence, workflowHistoryService, nodeTypes, roleService, telemetry, logger, globalConfig, } = this;
        const assertNotReadOnly = () => this.assertInstanceNotReadOnly('executions');
        const DEFAULT_TIMEOUT_MS = 5 * constants_1.Time.minutes.toMilliseconds;
        const MAX_TIMEOUT_MS = 10 * constants_1.Time.minutes.toMilliseconds;
        const assertExecutionAccess = async (executionId, scopes = ['workflow:read']) => {
            const execution = await executionRepository.findSingleExecution(executionId, {
                includeData: false,
            });
            if (!execution) {
                throw new Error(`Execution ${executionId} not found`);
            }
            const workflow = await workflowFinderService.findWorkflowForUser(execution.workflowId, user, scopes);
            if (!workflow) {
                throw new Error(`Execution ${executionId} not found`);
            }
            return execution;
        };
        return {
            async list(options) {
                const scope = 'workflow:read';
                const projectRoles = await roleService.rolesWithScope('project', [scope]);
                const workflowRoles = await roleService.rolesWithScope('workflow', [scope]);
                const sharingOptions = {
                    scopes: [scope],
                    projectRoles,
                    workflowRoles,
                };
                const query = {
                    kind: 'range',
                    range: { limit: options?.limit ?? 20 },
                    order: { startedAt: 'DESC' },
                    user,
                    sharingOptions,
                    ...(options?.workflowId ? { workflowId: options.workflowId } : {}),
                    ...(options?.status
                        ? {
                            status: [options.status],
                        }
                        : {}),
                };
                const executions = await executionRepository.findManyByRangeQuery(query);
                return executions.map((e) => ({
                    id: e.id,
                    workflowId: e.workflowId,
                    workflowName: e.workflowName ?? '',
                    status: e.status,
                    startedAt: String(e.startedAt ?? ''),
                    finishedAt: e.stoppedAt ? String(e.stoppedAt) : undefined,
                    mode: e.mode,
                    workflowVersionId: e.workflowVersionId ?? null,
                }));
            },
            async run(workflowId, inputData, options) {
                assertNotReadOnly();
                const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:execute',
                ]);
                if (!workflow) {
                    throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                }
                const nodes = workflow.nodes ?? [];
                const triggerNode = options?.triggerNodeName !== undefined
                    ? resolveRequestedTriggerNode(nodes, options.triggerNodeName)
                    : findTriggerNode(nodes);
                const timeoutMs = Math.min(options?.timeout ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);
                const connections = options?.omitConnections?.length
                    ? omitWorkflowConnections(workflow.connections, options.omitConnections)
                    : workflow.connections;
                const runData = {
                    executionMode: triggerNode ? getExecutionModeForTrigger(triggerNode) : 'manual',
                    workflowData: {
                        ...workflow,
                        connections,
                        settings: {
                            ...workflow.settings,
                            saveManualExecutions: true,
                            saveDataSuccessExecution: 'all',
                            saveDataErrorExecution: 'all',
                            executionTimeout: Math.ceil(timeoutMs / 1000),
                        },
                    },
                    userId: user.id,
                    pushRef,
                    callerAwaitsOutcome: 'completion',
                    ...(options?.isVerificationRun ? { suppressErrorWorkflow: true } : {}),
                };
                const pinDataPlan = (0, instance_ai_run_pin_data_1.buildInstanceAiRunPinDataPlan)({
                    workflowPinData: workflow.pinData ?? {},
                    verificationPinData: options?.verificationPinData,
                    inputData,
                    triggerNode,
                });
                if (pinDataPlan.startNodeName) {
                    runData.startNodes = [{ name: pinDataPlan.startNodeName, sourceData: null }];
                }
                else if (triggerNode) {
                    runData.triggerToStartFrom = { name: triggerNode.name };
                }
                if (pinDataPlan.runPinData) {
                    runData.pinData = pinDataPlan.runPinData;
                }
                if (pinDataPlan.triggerExecutionData) {
                    runData.executionData = pinDataPlan.triggerExecutionData;
                }
                runData.source = 'instance_ai';
                runData.telemetryMetadata = {
                    mockDataSources: pinDataPlan.mockDataSources,
                };
                if (runData.executionData) {
                    runData.executionData.manualData = {
                        ...runData.executionData.manualData,
                        userId: user.id,
                        source: runData.source,
                        suppressErrorWorkflow: runData.suppressErrorWorkflow,
                    };
                }
                const offloadingManualExecutionsInQueueMode = globalConfig.executions?.mode === 'queue' &&
                    process.env.OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS === 'true';
                if (runData.executionMode === 'manual' &&
                    offloadingManualExecutionsInQueueMode &&
                    !runData.executionData) {
                    runData.executionData = (0, n8n_workflow_1.createRunExecutionData)({
                        startData: { startNodes: runData.startNodes },
                        resultData: { pinData: runData.pinData, runData: null },
                        manualData: {
                            userId: runData.userId,
                            triggerToStartFrom: runData.triggerToStartFrom,
                            source: runData.source,
                        },
                        executionData: null,
                    });
                }
                const trackBuilderExecutedWorkflow = (status, error) => {
                    if (!threadId)
                        return;
                    telemetry.track('Builder executed workflow', {
                        user_id: user.id,
                        thread_id: threadId,
                        workflow_id: workflowId,
                        executed_by: 'ai',
                        pinned_node_count: Object.keys(runData.pinData ?? {}).length,
                        exec_type: runData.executionMode,
                        status,
                        ...(error ? { error: (0, telemetry_1.redactTelemetryText)(error) } : {}),
                    });
                };
                try {
                    const executionId = await workflowRunner.run(runData);
                    const pruneVerificationPins = async (executedNodeNames) => {
                        try {
                            await (0, instance_ai_run_pin_data_1.pruneUnreachedVerificationPinData)({
                                executionId,
                                verificationPinData: pinDataPlan.verificationPinData,
                                nonVerificationPinData: pinDataPlan.nonVerificationPinData,
                                executedNodeNames,
                            });
                        }
                        catch (error) {
                            logger.warn('Failed to prune verification pin data from execution', {
                                executionId,
                                error: error instanceof Error ? error.message : String(error),
                            });
                        }
                    };
                    const waitOutcome = await (0, instance_ai_execution_wait_1.waitForInstanceAiExecution)({
                        activeExecutions,
                        executionId,
                        timeoutMs,
                        abortSignal: options?.abortSignal,
                    });
                    if (waitOutcome.kind === 'cancelled') {
                        const result = {
                            executionId,
                            status: 'error',
                            error: waitOutcome.message,
                        };
                        await pruneVerificationPins();
                        trackBuilderExecutedWorkflow(result.status, result.error);
                        return result;
                    }
                    const { result, telemetryError } = await extractExecutionOutcome(executionId, allowSendingParameterValues, nodeTypes);
                    await pruneVerificationPins(result.executedNodeNames);
                    trackBuilderExecutedWorkflow(result.status, telemetryError);
                    const workflowPinnedNodeNames = Object.keys(workflow.pinData ?? {});
                    const injectedTriggerNodeName = triggerNode &&
                        (pinDataPlan.mockDataSources.includes('trigger_input') ||
                            Object.hasOwn(pinDataPlan.verificationPinData, triggerNode.name))
                        ? triggerNode.name
                        : undefined;
                    return {
                        ...result,
                        ...(workflowPinnedNodeNames.length > 0 ? { workflowPinnedNodeNames } : {}),
                        ...(injectedTriggerNodeName ? { injectedTriggerNodeName } : {}),
                    };
                }
                catch (error) {
                    trackBuilderExecutedWorkflow('error', error instanceof Error ? error.message : String(error));
                    throw error;
                }
            },
            async runStep(workflowId, nodeName, options) {
                assertNotReadOnly();
                const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:execute',
                ]);
                if (!workflow) {
                    throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                }
                let nodes = workflow.nodes ?? [];
                let connections = workflow.connections ?? {};
                const versionId = options?.versionId;
                if (versionId !== undefined && versionId !== workflow.versionId) {
                    const version = await workflowHistoryService.getVersion(user, workflowId, versionId);
                    nodes = version.nodes ?? [];
                    connections = version.connections ?? {};
                }
                const target = nodes.find((node) => node.name === nodeName);
                if (!target) {
                    throw new n8n_workflow_1.UserError(`The workflow has no node named "${nodeName}". Use workflow_builder_workflows(action="get-as-code") to see the node names.`);
                }
                if (target.disabled) {
                    throw new n8n_workflow_1.UserError(`Node "${nodeName}" is disabled. Enable it before you run it.`);
                }
                let priorRunData;
                let reusedFromExecutionId;
                if (options?.reuseExecutionId !== undefined) {
                    const execution = await assertExecutionAccess(options.reuseExecutionId);
                    if (execution.workflowId !== workflowId) {
                        throw new n8n_workflow_1.UserError(`Execution ${options.reuseExecutionId} belongs to a different workflow.`);
                    }
                    const stored = await executionPersistence.findSingleExecution(options.reuseExecutionId, {
                        includeData: true,
                        unflattenData: true,
                    });
                    priorRunData = stored?.data?.resultData?.runData ?? {};
                    reusedFromExecutionId = options.reuseExecutionId;
                }
                const plan = (0, instance_ai_step_run_1.planStepRun)({
                    nodes,
                    connections,
                    targetName: nodeName,
                    mockItems: options?.mockInput ? (0, instance_ai_step_run_1.toExecutionItems)(options.mockInput) : undefined,
                    priorRunData,
                    pinnedNodeNames: Object.keys(workflow.pinData ?? {}),
                });
                if (plan.unhonoredInput) {
                    const names = plan.unhonoredInput.upstreamNodeNames;
                    const upstream = names.slice(0, 10).join(', ') + (names.length > 10 ? ', …' : '');
                    if (plan.unhonoredInput.requested === 'mocked') {
                        throw new n8n_workflow_1.UserError(`mockInput cannot keep every node above "${nodeName}" out of the run: ` +
                            `the mock leaves a Loop Over Items node unfinished, and n8n would restart it and execute these nodes for real (${upstream}). ` +
                            'Pass reuseExecutionId with an execution where the loop finished, or omit both options to run the chain on purpose.');
                    }
                    throw new n8n_workflow_1.UserError(`Execution ${options?.reuseExecutionId} does not cover every node above "${nodeName}", ` +
                        `so the run would execute them for real (${upstream}). ` +
                        'Pick an execution where those nodes ran to completion, or omit both options to run the chain on purpose.');
                }
                let agentRequest;
                if (plan.rootNodeNames) {
                    const roots = plan.rootNodeNames.map((name) => `"${name}"`).join(' or ');
                    if (!isToolNode(nodeTypes, target)) {
                        throw new n8n_workflow_1.UserError(`Node "${nodeName}" cannot run on its own — n8n runs it as part of ${roots}. ` +
                            `Run ${roots} instead: its execution records what this node returned on every ` +
                            'call it made.');
                    }
                    if ((0, instance_ai_step_run_1.isToolkitNode)(target)) {
                        throw new n8n_workflow_1.UserError(`Node "${nodeName}" holds several tools, and a step run cannot pick one of them. ` +
                            `Run ${roots} instead, then read this node with ` +
                            'workflow_builder_executions(action="get-node-output") on that execution: it holds what every ' +
                            'tool call returned.');
                    }
                    const upperRoots = (0, instance_ai_step_run_1.findRootsAboveOtherRoots)(nodes, connections, plan.rootNodeNames);
                    if (upperRoots.length > 0) {
                        const upper = upperRoots.map((name) => `"${name}"`).join(' or ');
                        throw new n8n_workflow_1.UserError(`Node "${nodeName}" runs through ${roots}, and ${upper} runs above another of them, ` +
                            `so a step run would run ${upper} and the nodes after it again. ` +
                            `Run ${upper} instead, then read this node with ` +
                            'workflow_builder_executions(action="get-node-output") on that execution: it holds what every ' +
                            'tool call returned.');
                    }
                    const expected = (0, instance_ai_step_run_1.declaredToolArguments)(target);
                    if (expected.length > 0 && options?.toolArguments === undefined) {
                        throw new n8n_workflow_1.UserError(`Node "${nodeName}" takes its arguments from the agent, so a step run has to supply them. ` +
                            `Pass toolArguments with: ${expected.join(', ')}.`);
                    }
                    agentRequest = (0, instance_ai_step_run_1.buildToolAgentRequest)({ target, toolArguments: options?.toolArguments });
                }
                else if (isToolNode(nodeTypes, target)) {
                    throw new n8n_workflow_1.UserError(`Node "${nodeName}" is a tool, and no node is connected to run it. ` +
                        'A tool runs only through the node that owns it, so connect it to an Agent ' +
                        'and run the step again.');
                }
                else if (options?.toolArguments !== undefined) {
                    throw new n8n_workflow_1.UserError(`toolArguments applies only to a tool node. "${nodeName}" runs in the main graph, ` +
                        'so its input comes from mockInput, reuseExecutionId, or the nodes above it.');
                }
                const stepPinData = (0, instance_ai_step_run_1.pinDataForStepRun)(workflow.pinData, {
                    targetName: nodeName,
                    mockedNodeNames: plan.mockedNodeNames,
                });
                const timeoutMs = Math.min(options?.timeout ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);
                const runData = {
                    executionMode: 'manual',
                    workflowData: {
                        ...workflow,
                        nodes,
                        connections,
                        settings: {
                            ...workflow.settings,
                            saveManualExecutions: true,
                            saveDataSuccessExecution: 'all',
                            saveDataErrorExecution: 'all',
                            executionTimeout: Math.ceil(timeoutMs / 1000),
                        },
                    },
                    userId: user.id,
                    pushRef,
                    destinationNode: { nodeName, mode: 'inclusive' },
                    pinData: stepPinData,
                    runData: plan.runData,
                    dirtyNodeNames: plan.dirtyNodeNames,
                    agentRequest,
                    source: 'instance_ai',
                };
                if ((0, n8n_workflow_1.isTriggerNodeType)(target.type)) {
                    runData.triggerToStartFrom = { name: nodeName };
                }
                const offloadingManualExecutionsInQueueMode = globalConfig.executions?.mode === 'queue' &&
                    process.env.OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS === 'true';
                if (offloadingManualExecutionsInQueueMode) {
                    runData.executionData = (0, n8n_workflow_1.createRunExecutionData)({
                        startData: { destinationNode: runData.destinationNode },
                        resultData: { pinData: stepPinData, runData: plan.runData ?? null },
                        manualData: {
                            userId: user.id,
                            dirtyNodeNames: plan.dirtyNodeNames,
                            triggerToStartFrom: runData.triggerToStartFrom,
                            agentRequest,
                            source: 'instance_ai',
                        },
                        executionData: null,
                    });
                }
                const trackStepRun = (status, error) => {
                    if (!threadId)
                        return;
                    telemetry.track('Builder executed workflow', {
                        user_id: user.id,
                        thread_id: threadId,
                        workflow_id: workflowId,
                        executed_by: 'ai',
                        pinned_node_count: Object.keys(stepPinData ?? {}).length,
                        exec_type: 'step',
                        input_mode: plan.inputMode,
                        status,
                        ...(error ? { error: (0, telemetry_1.redactTelemetryText)(error) } : {}),
                    });
                };
                const offeredForReplay = priorRunData
                    ? Object.keys(priorRunData).filter((name) => name !== nodeName)
                    : [];
                const describe = (result) => {
                    const inRunData = new Set(result.executedNodeNames ?? []);
                    const replayedNodeNames = offeredForReplay.filter((name) => inRunData.has(name));
                    const notExecutedHere = new Set([...plan.mockedNodeNames, ...replayedNodeNames]);
                    return {
                        ...result,
                        ...(result.executedNodeNames
                            ? {
                                executedNodeNames: result.executedNodeNames.filter((name) => !notExecutedHere.has(name)),
                            }
                            : {}),
                        nodeName,
                        inputMode: plan.inputMode,
                        mockedNodeNames: plan.mockedNodeNames,
                        ...(plan.rootNodeNames ? { ranThroughNodeNames: plan.rootNodeNames } : {}),
                        ...(replayedNodeNames.length > 0 ? { replayedNodeNames } : {}),
                        ...(reusedFromExecutionId ? { reusedFromExecutionId } : {}),
                        ...(Object.keys(stepPinData ?? {}).length > 0
                            ? { workflowPinnedNodeNames: Object.keys(stepPinData ?? {}) }
                            : {}),
                    };
                };
                try {
                    const executionId = await workflowRunner.run(runData);
                    const waitOutcome = await (0, instance_ai_execution_wait_1.waitForInstanceAiExecution)({
                        activeExecutions,
                        executionId,
                        timeoutMs,
                        abortSignal: options?.abortSignal,
                    });
                    if (waitOutcome.kind === 'cancelled') {
                        trackStepRun('error', waitOutcome.message);
                        return describe({
                            executionId,
                            status: 'error',
                            error: waitOutcome.message,
                        });
                    }
                    const { result, telemetryError } = await extractExecutionOutcome(executionId, allowSendingParameterValues, nodeTypes, plan.rootNodeNames ? nodeName : undefined);
                    trackStepRun(result.status, telemetryError);
                    return describe(result);
                }
                catch (error) {
                    trackStepRun('error', error instanceof Error ? error.message : String(error));
                    throw error;
                }
            },
            async getStatus(executionId) {
                await assertExecutionAccess(executionId);
                const isRunning = activeExecutions.has(executionId);
                if (isRunning) {
                    return { executionId, status: 'running' };
                }
                return await extractExecutionResult(executionId, allowSendingParameterValues, nodeTypes);
            },
            async getResult(executionId) {
                await assertExecutionAccess(executionId);
                if (activeExecutions.has(executionId)) {
                    await activeExecutions.getPostExecutePromise(executionId);
                }
                return await extractExecutionResult(executionId, allowSendingParameterValues, nodeTypes);
            },
            async stop(executionId) {
                assertNotReadOnly();
                await assertExecutionAccess(executionId, ['workflow:execute']);
                if (!activeExecutions.has(executionId)) {
                    return {
                        success: false,
                        message: `Execution ${executionId} is not currently running`,
                    };
                }
                try {
                    activeExecutions.stopExecution(executionId, new n8n_workflow_1.TimeoutExecutionCancelledError(executionId));
                    return { success: true, message: `Execution ${executionId} cancelled` };
                }
                catch {
                    return {
                        success: false,
                        message: `Failed to cancel execution ${executionId}`,
                    };
                }
            },
            async getDebugInfo(executionId) {
                await assertExecutionAccess(executionId);
                return await extractExecutionDebugInfo(executionId, allowSendingParameterValues, nodeTypes);
            },
            async getNodeOutput(executionId, nodeName, options) {
                await assertExecutionAccess(executionId);
                if (!allowSendingParameterValues) {
                    return {
                        nodeName,
                        outputs: [],
                        totalItems: 0,
                        returned: { from: 0, to: 0 },
                    };
                }
                return await extractNodeOutput(executionId, nodeName, options, nodeTypes);
            },
            getResolvedNodeParameters: async (executionId, nodeName, options) => {
                await assertExecutionAccess(executionId);
                if (!allowSendingParameterValues) {
                    return {
                        nodeName,
                        runIndex: options?.runIndex ?? 0,
                        itemIndex: options?.itemIndex ?? 0,
                        parameters: null,
                        resolved: null,
                        failedExpressions: [],
                        emptyResolutions: [],
                        suppressed: 'parameter-values-disabled',
                    };
                }
                return await (0, extract_resolved_node_parameters_1.extractResolvedNodeParameters)(nodeTypes, executionId, nodeName, options);
            },
        };
    }
    createCredentialAdapter(user, boundProjectId, getCredentialIdAllowlist, shouldBypassCredentialTest, getCredentialTestTarget) {
        const { credentialsService, credentialsFinderService, loadNodesAndCredentials, aiGatewayService, } = this;
        const getGatewayConfig = async () => await this.getGatewayConfigOrNull();
        const adapter = {
            async list(options) {
                if (boundProjectId) {
                    const scoped = await credentialsService.getCredentialsAUserCanUseInAWorkflow(user, {
                        projectId: boundProjectId,
                    });
                    const filtered = options?.type ? scoped.filter((c) => c.type === options.type) : scoped;
                    return filtered.map((c) => ({
                        id: c.id,
                        name: c.name,
                        type: c.type,
                        ...(c.description !== undefined && { description: c.description }),
                    }));
                }
                if (options?.workflowId || options?.projectId) {
                    const scoped = options.workflowId
                        ? await credentialsService.getCredentialsAUserCanUseInAWorkflow(user, {
                            workflowId: options.workflowId,
                        })
                        : await credentialsService.getCredentialsAUserCanUseInAWorkflow(user, {
                            projectId: options.projectId,
                        });
                    const filtered = options.type ? scoped.filter((c) => c.type === options.type) : scoped;
                    return filtered.map((c) => ({
                        id: c.id,
                        name: c.name,
                        type: c.type,
                        ...(c.description !== undefined && { description: c.description }),
                    }));
                }
                const credentials = await credentialsService.getMany(user, {
                    listQueryOptions: {
                        filter: options?.type ? { type: options.type } : undefined,
                    },
                    includeGlobal: true,
                });
                return credentials.map((c) => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    ...(c.description !== undefined && { description: c.description }),
                }));
            },
            async get(credentialId) {
                const credential = await credentialsService.getOne(user, credentialId, false);
                return {
                    id: credential.id,
                    name: credential.name,
                    type: credential.type,
                    ...(credential.description !== undefined && { description: credential.description }),
                };
            },
            async delete(credentialId) {
                await credentialsService.delete(user, credentialId);
            },
            async test(credentialId) {
                const credential = await credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
                if (!credential) {
                    throw new Error(`Credential ${credentialId} not found or not accessible`);
                }
                if (shouldBypassCredentialTest?.(credentialId) === true) {
                    return { success: true, message: 'Connection tested successfully' };
                }
                const data = await credentialsService.decryptForUse(credential, { kind: 'user', user }, boundProjectId);
                const target = getCredentialTestTarget?.(credential.type);
                const credentialsToTest = {
                    id: credential.id,
                    name: credential.name,
                    type: credential.type,
                    data: target ? { ...data, [target.urlField]: target.baseUrl } : data,
                };
                const result = await credentialsService.test(user.id, credentialsToTest);
                return {
                    success: result.status === 'OK',
                    message: result.message,
                };
            },
            async getTemplatedCredentialHosts(credentialIds) {
                const normalizeHost = (value) => {
                    const trimmed = value.trim().toLowerCase();
                    if (!/^https?:\/\//.test(trimmed))
                        return trimmed || null;
                    try {
                        return new URL(trimmed).hostname || null;
                    }
                    catch {
                        return null;
                    }
                };
                const hosts = {};
                await Promise.all(credentialIds.map(async (credentialId) => {
                    hosts[credentialId] = null;
                    try {
                        const credential = await credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
                        if (!credential || credential.type !== api_types_1.TEMPLATED_CUSTOM_AUTH_CREDENTIAL_TYPE) {
                            return;
                        }
                        const data = await credentialsService.decrypt(credential, true);
                        const serviceHost = data.serviceHost;
                        if (typeof serviceHost === 'string') {
                            hosts[credentialId] = normalizeHost(serviceHost);
                        }
                    }
                    catch {
                    }
                }));
                return hosts;
            },
            async isTestable(credentialType) {
                try {
                    const credClass = loadNodesAndCredentials.getCredential(credentialType);
                    if (credClass.type.test)
                        return true;
                    const known = loadNodesAndCredentials.knownCredentials;
                    const supportedNodes = known[credentialType]?.supportedNodes ?? [];
                    for (const nodeName of supportedNodes) {
                        try {
                            const loaded = loadNodesAndCredentials.getNode(nodeName);
                            const nodeInstance = loaded.type;
                            const nodeDescriptions = 'nodeVersions' in nodeInstance
                                ? Object.values(nodeInstance.nodeVersions).map((version) => version.description)
                                : [nodeInstance.description];
                            const hasTestedBy = nodeDescriptions.some((nodeDesc) => nodeDesc?.credentials?.some((cred) => cred.name === credentialType && cred.testedBy));
                            if (hasTestedBy)
                                return true;
                        }
                        catch {
                            continue;
                        }
                    }
                    return false;
                }
                catch {
                    return false;
                }
            },
            async getDocumentationUrl(credentialType) {
                try {
                    const credClass = loadNodesAndCredentials.getCredential(credentialType);
                    return credentialDocsUrl(credClass.type.documentationUrl) ?? null;
                }
                catch {
                    return null;
                }
            },
            getCredentialFields(credentialType) {
                try {
                    return collectCredentialProperties(loadNodesAndCredentials, credentialType).map((prop) => ({
                        name: prop.name,
                        displayName: prop.displayName,
                        type: prop.type,
                        required: prop.required ?? false,
                        description: prop.description,
                    }));
                }
                catch {
                    return [];
                }
            },
            async getCredentialFillState(credentialId) {
                try {
                    const credential = await credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
                    if (!credential)
                        return 'unknown';
                    const valueFields = collectCredentialProperties(loadNodesAndCredentials, credential.type).filter((prop) => prop.type !== 'notice');
                    if (valueFields.length === 0)
                        return 'unknown';
                    const data = await credentialsService.decrypt(credential, true);
                    const filled = valueFields.some((prop) => hasCredentialValue(data[prop.name]));
                    return filled ? 'filled' : 'blank';
                }
                catch {
                    return 'unknown';
                }
            },
            async credentialTypeExists(credentialType) {
                if (credentialType in loadNodesAndCredentials.knownCredentials)
                    return true;
                try {
                    loadNodesAndCredentials.getCredential(credentialType);
                    return true;
                }
                catch {
                    return false;
                }
            },
            async searchCredentialTypes(query) {
                const q = query.toLowerCase().trim();
                if (!q)
                    return [];
                const known = loadNodesAndCredentials.knownCredentials;
                const results = [];
                for (const typeName of Object.keys(known)) {
                    if (typeName.toLowerCase().includes(q)) {
                        try {
                            const credClass = loadNodesAndCredentials.getCredential(typeName);
                            const docsUrl = credentialDocsUrl(credClass.type.documentationUrl);
                            results.push({
                                type: typeName,
                                displayName: credClass.type.displayName,
                                ...(docsUrl ? { documentationUrl: docsUrl } : {}),
                            });
                        }
                        catch {
                            results.push({ type: typeName, displayName: typeName });
                        }
                        continue;
                    }
                    try {
                        const credClass = loadNodesAndCredentials.getCredential(typeName);
                        if (credClass.type.displayName.toLowerCase().includes(q)) {
                            const docsUrl = credentialDocsUrl(credClass.type.documentationUrl);
                            results.push({
                                type: typeName,
                                displayName: credClass.type.displayName,
                                ...(docsUrl ? { documentationUrl: docsUrl } : {}),
                            });
                        }
                    }
                    catch {
                    }
                }
                return results;
            },
            async listHttpCredentialHosts() {
                if (httpCredentialHostsCache)
                    return httpCredentialHostsCache;
                const { knownCredentials } = loadNodesAndCredentials;
                const result = [];
                for (const typeName of Object.keys(knownCredentials)) {
                    let credType;
                    try {
                        credType = loadNodesAndCredentials.getCredential(typeName).type;
                    }
                    catch {
                        continue;
                    }
                    const usableInHttpNode = Boolean(credType.authenticate) ||
                        (knownCredentials[typeName]?.extends ?? []).some((parent) => parent === 'oAuth2Api' || parent === 'oAuth1Api');
                    if (!usableInHttpNode)
                        continue;
                    const hosts = (0, instance_ai_1.deriveCredentialHosts)(credType);
                    if (hosts.length === 0)
                        continue;
                    result.push({ type: typeName, displayName: credType.displayName, hosts });
                }
                httpCredentialHostsCache = result;
                return result;
            },
            async getAccountContext(credentialId) {
                const credential = await credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
                if (!credential) {
                    return { accountIdentifier: undefined };
                }
                const mask = (id) => {
                    const atIdx = id.indexOf('@');
                    if (atIdx > 0) {
                        const local = id.slice(0, atIdx);
                        const domain = id.slice(atIdx);
                        const keep = Math.min(2, local.length);
                        return local.slice(0, keep) + '***' + domain;
                    }
                    if (id.length <= 3)
                        return id;
                    return id.slice(0, 2) + '***' + id.slice(-1);
                };
                try {
                    const redacted = await credentialsService.decrypt(credential, false);
                    if (typeof redacted.accountIdentifier === 'string' && redacted.accountIdentifier) {
                        return { accountIdentifier: mask(redacted.accountIdentifier) };
                    }
                    for (const key of ['email', 'user', 'username', 'account', 'serviceAccountEmail']) {
                        const value = redacted[key];
                        if (typeof value === 'string' && value) {
                            return { accountIdentifier: mask(value) };
                        }
                    }
                    const raw = await credentialsService.decrypt(credential, true);
                    const { extractAccountIdentifierFromData } = await import('../../oauth/account-identifier.js');
                    const identifier = extractAccountIdentifierFromData(raw);
                    if (identifier) {
                        return { accountIdentifier: mask(identifier) };
                    }
                    return { accountIdentifier: undefined };
                }
                catch {
                    return { accountIdentifier: undefined };
                }
            },
            async isAiGatewayCredentialType(credType) {
                const config = await getGatewayConfig();
                return config?.credentialTypes.includes(credType) ?? false;
            },
            async getAiGatewayWallet() {
                if (!aiGatewayService.isEnabled())
                    return null;
                try {
                    return await aiGatewayService.getWallet(user.id);
                }
                catch {
                    return null;
                }
            },
            async listAiGatewayCredentialTypes() {
                const config = await getGatewayConfig();
                return config?.credentialTypes ?? [];
            },
            async isManagedOAuthCredentialType(credType) {
                try {
                    return await Promise.resolve(di_1.Container.get(credentials_overwrites_1.CredentialsOverwrites).isManagedOAuthType(credType));
                }
                catch {
                    return false;
                }
            },
        };
        if (!getCredentialIdAllowlist?.())
            return adapter;
        return {
            ...adapter,
            list: async (options) => {
                const allowed = new Set(getCredentialIdAllowlist());
                return allowed.size === 0
                    ? []
                    : (await adapter.list(options)).filter((c) => allowed.has(c.id));
            },
        };
    }
    createEvaluationConfigAdapter(evaluationConfigService, user) {
        const { workflowFinderService, credentialsFinderService, llmJudgeProviderRegistry } = this;
        const assertNotReadOnly = () => this.assertInstanceNotReadOnly('evaluations');
        const findWorkflow = async (workflowId, scope) => {
            const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, [scope]);
            if (!workflow) {
                throw new instance_ai_1.WorkflowNotFoundError(workflowId);
            }
            return workflow;
        };
        const resolveProviders = async (input) => await resolveMetricProviders(input, {
            user,
            credentialsFinderService,
            llmJudgeProviderRegistry,
        });
        return {
            async list(workflowId) {
                await findWorkflow(workflowId, 'workflow:read');
                const configs = await evaluationConfigService.list(workflowId);
                return configs.map(evaluationConfigToSummary);
            },
            async get(workflowId, configId) {
                await findWorkflow(workflowId, 'workflow:read');
                const config = await evaluationConfigService.get(workflowId, configId);
                return config ? evaluationConfigToSummary(config) : null;
            },
            async describe(workflowId, configId) {
                await findWorkflow(workflowId, 'workflow:read');
                const config = await evaluationConfigService.get(workflowId, configId);
                return config ? evaluationConfigToDetail(config) : null;
            },
            async create(workflowId, input) {
                assertNotReadOnly();
                const workflow = await findWorkflow(workflowId, 'workflow:update');
                const resolved = await resolveProviders(input);
                const config = await evaluationConfigService.create(workflowId, workflow, user, buildEvaluationConfigDto(resolved));
                return evaluationConfigToSummary(config);
            },
            async update(workflowId, configId, input) {
                assertNotReadOnly();
                const workflow = await findWorkflow(workflowId, 'workflow:update');
                const resolved = await resolveProviders(input);
                const config = await evaluationConfigService.update(workflowId, configId, workflow, user, buildEvaluationConfigDto(resolved));
                return evaluationConfigToSummary(config);
            },
            async delete(workflowId, configId) {
                assertNotReadOnly();
                await findWorkflow(workflowId, 'workflow:update');
                await evaluationConfigService.delete(workflowId, configId);
            },
        };
    }
    createDataTableAdapter(user, boundProjectId) {
        const { dataTableService, dataTableRepository } = this;
        const assertNotReadOnly = () => this.assertInstanceNotReadOnly('data tables');
        const { resolveProjectId, resolveBoundProjectId } = this.createProjectScopeHelpers(user, boundProjectId);
        const logger = this.logger;
        const resolveAccessibleTable = async (scopes, dataTableId, disambiguator) => {
            const projectIdFilter = disambiguator?.projectId;
            const result = await resolveDataTableByIdOrName(dataTableRepository, logger, dataTableId, {
                projectIdFilter,
                accessFilter: async (id) => await (0, check_access_1.userHasScopes)(user, scopes, false, { dataTableId: id }),
            });
            if (result.kind === 'miss') {
                throw new Error(`Data table "${dataTableId}" not found`);
            }
            if (result.kind === 'ambiguous') {
                const projectIds = result.candidates.map((c) => c.projectId).join(', ');
                throw new Error(`Data table name "${dataTableId}" is ambiguous across accessible projects ` +
                    `(${projectIds}); pass the UUID or include a \`projectId\` to disambiguate.`);
            }
            if (projectIdFilter && result.table.projectId !== projectIdFilter) {
                throw new Error(`Data table "${dataTableId}" does not belong to project "${projectIdFilter}".`);
            }
            return result.table;
        };
        const resolveProjectIdForTable = async (scopes, dataTableId, disambiguator) => {
            const table = await resolveAccessibleTable(scopes, dataTableId, disambiguator);
            return { projectId: table.projectId, resolvedId: table.id };
        };
        const resolveTableMeta = async (scopes, dataTableId, disambiguator) => {
            const table = await resolveAccessibleTable(scopes, dataTableId, disambiguator);
            return { projectId: table.projectId, tableName: table.name, resolvedId: table.id };
        };
        const referenceScopes = {
            read: ['dataTable:read'],
            readRow: ['dataTable:readRow'],
            writeRow: ['dataTable:writeRow'],
            update: ['dataTable:update'],
            delete: ['dataTable:delete'],
        };
        return {
            async list(options) {
                const projectId = await resolveProjectId(['dataTable:listProject'], options?.projectId);
                const { data: tables } = await dataTableService.getManyAndCount({
                    filter: { projectId },
                });
                return tables.map((t) => ({
                    id: t.id,
                    name: t.name,
                    projectId,
                    columns: t.columns.map((c) => ({ id: c.id, name: c.name, type: c.type })),
                    createdAt: t.createdAt.toISOString(),
                    updatedAt: t.updatedAt.toISOString(),
                }));
            },
            async create(name, columns) {
                assertNotReadOnly();
                const projectId = await resolveBoundProjectId(['dataTable:create']);
                const result = await dataTableService.createDataTable(projectId, { name, columns });
                return {
                    id: result.id,
                    name: result.name,
                    projectId,
                    columns: result.columns.map((c) => ({ id: c.id, name: c.name, type: c.type })),
                    createdAt: result.createdAt.toISOString(),
                    updatedAt: result.updatedAt.toISOString(),
                };
            },
            async delete(dataTableId, options) {
                assertNotReadOnly();
                const { projectId, resolvedId } = await resolveProjectIdForTable(['dataTable:delete'], dataTableId, options);
                await dataTableService.deleteDataTable(resolvedId, projectId);
            },
            async resolveTableReference(dataTableId, options) {
                const { projectId, tableName, resolvedId } = await resolveTableMeta(referenceScopes[options?.permission ?? 'read'], dataTableId, options);
                return { id: resolvedId, name: tableName, projectId };
            },
            async getSchema(dataTableId, options) {
                const { projectId, resolvedId } = await resolveProjectIdForTable(['dataTable:read'], dataTableId, options);
                const columns = await dataTableService.getColumns(resolvedId, projectId);
                return columns.map((c, index) => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    index,
                }));
            },
            async addColumn(dataTableId, column, options) {
                assertNotReadOnly();
                const { projectId, resolvedId } = await resolveProjectIdForTable(['dataTable:update'], dataTableId, options);
                const result = await dataTableService.addColumn(resolvedId, projectId, column);
                return {
                    id: result.id,
                    name: result.name,
                    type: result.type,
                    index: result.index,
                };
            },
            async deleteColumn(dataTableId, columnId, options) {
                assertNotReadOnly();
                const { projectId, resolvedId } = await resolveProjectIdForTable(['dataTable:update'], dataTableId, options);
                await dataTableService.deleteColumn(resolvedId, projectId, columnId);
            },
            async renameColumn(dataTableId, columnId, newName, options) {
                assertNotReadOnly();
                const { projectId, resolvedId } = await resolveProjectIdForTable(['dataTable:update'], dataTableId, options);
                await dataTableService.renameColumn(resolvedId, projectId, columnId, {
                    name: newName,
                });
            },
            async queryRows(dataTableId, options) {
                const { projectId, resolvedId } = await resolveProjectIdForTable(['dataTable:readRow'], dataTableId, options);
                return await dataTableService.getManyRowsAndCount(resolvedId, projectId, {
                    take: options?.limit ?? 50,
                    skip: options?.offset ?? 0,
                    filter: options?.filter,
                });
            },
            async insertRows(dataTableId, rows, options) {
                const { projectId, tableName, resolvedId } = await resolveTableMeta(['dataTable:writeRow'], dataTableId, options);
                const result = await dataTableService.insertRows(resolvedId, projectId, rows, 'count');
                return {
                    insertedCount: typeof result === 'number' ? result : rows.length,
                    dataTableId: resolvedId,
                    tableName,
                    projectId,
                };
            },
            async updateRows(dataTableId, filter, data, options) {
                const { projectId, tableName, resolvedId } = await resolveTableMeta(['dataTable:writeRow'], dataTableId, options);
                const result = await dataTableService.updateRows(resolvedId, projectId, { filter, data: data }, true);
                return {
                    updatedCount: Array.isArray(result) ? result.length : 0,
                    dataTableId: resolvedId,
                    tableName,
                    projectId,
                };
            },
            async deleteRows(dataTableId, filter, options) {
                const { projectId, tableName, resolvedId } = await resolveTableMeta(['dataTable:writeRow'], dataTableId, options);
                const result = await dataTableService.deleteRows(resolvedId, projectId, { filter }, true);
                return {
                    deletedCount: Array.isArray(result) ? result.length : 0,
                    dataTableId: resolvedId,
                    tableName,
                    projectId,
                };
            },
        };
    }
    createWebResearchAdapter(user, searchProxyConfig) {
        const fetchCache = this.webResearchCache;
        const searchCacheRef = this.searchCache;
        const settingsService = this.settingsService;
        const { outboundHttp } = this;
        const sharedTransport = outboundHttp.transport({ useDefaultSsrfPolicy: 'enforced' });
        const userId = user.id;
        let resolvedSearchMethod;
        let searchResolved = false;
        const lazySearch = async (query, options) => {
            if (!searchResolved) {
                const config = await settingsService.resolveSearchConfig();
                resolvedSearchMethod = this.buildSearchMethod(config.braveApiKey ?? '', config.searxngUrl ?? '', searchCacheRef, searchProxyConfig, userId);
                searchResolved = true;
            }
            if (!resolvedSearchMethod)
                return { query, results: [] };
            return await resolvedSearchMethod(query, options);
        };
        return {
            search: lazySearch,
            async fetchUrl(url, options) {
                const cacheKey = `${userId}:${url}`;
                const cached = fetchCache.get(cacheKey);
                if (cached) {
                    if (options?.authorizeUrl && cached.finalUrl) {
                        const origHost = new URL(url).hostname;
                        const finalHost = new URL(cached.finalUrl).hostname;
                        if (origHost !== finalHost) {
                            await options.authorizeUrl(cached.finalUrl);
                        }
                    }
                    return cached;
                }
                const authorizeUrl = options?.authorizeUrl;
                const transport = authorizeUrl
                    ? outboundHttp.transport({
                        useDefaultSsrfPolicy: 'enforced',
                        authorize: async (target) => await authorizeUrl(target.href),
                    })
                    : sharedTransport;
                const page = await (0, web_research_1.fetchAndExtract)(url, {
                    maxContentLength: options?.maxContentLength,
                    maxResponseBytes: options?.maxResponseBytes,
                    timeoutMs: options?.timeoutMs,
                    abortSignal: options?.abortSignal,
                    transport,
                });
                const result = await (0, web_research_1.maybeSummarize)(page);
                fetchCache.set(cacheKey, result);
                return result;
            },
        };
    }
    buildSearchMethod(apiKey, searxngUrl, cache, searchProxyConfig, userId) {
        const keyPrefix = userId ? `${userId}:` : '';
        const searchCacheKey = (query, options) => {
            const { abortSignal: _abortSignal, ...cacheable } = options ?? {};
            return `${keyPrefix}${JSON.stringify([query, cacheable])}`;
        };
        if (searchProxyConfig) {
            return async (query, options) => {
                const cacheKey = searchCacheKey(query, options);
                const cached = cache.get(cacheKey);
                if (cached)
                    return cached;
                const result = await (0, ai_utilities_1.braveSearch)('', query, {
                    ...options,
                    proxyConfig: searchProxyConfig,
                });
                cache.set(cacheKey, result);
                return result;
            };
        }
        if (apiKey) {
            return async (query, options) => {
                const cacheKey = searchCacheKey(query, options);
                const cached = cache.get(cacheKey);
                if (cached)
                    return cached;
                const result = await (0, ai_utilities_1.braveSearch)(apiKey, query, options ?? {});
                cache.set(cacheKey, result);
                return result;
            };
        }
        if (searxngUrl) {
            return async (query, options) => {
                const cacheKey = searchCacheKey(query, options);
                const cached = cache.get(cacheKey);
                if (cached)
                    return cached;
                const result = await (0, ai_utilities_1.searxngSearch)(searxngUrl, query, options ?? {});
                cache.set(cacheKey, result);
                return result;
            };
        }
        return undefined;
    }
    getNodeDefinitionDirs() {
        const catalogDirs = this.nodeCatalogService?.getNodeDefinitionDirs();
        if (catalogDirs?.length)
            return catalogDirs;
        if (!this._nodeDefinitionDirs) {
            this._nodeDefinitionDirs = (0, node_definition_dirs_1.resolveBuiltinNodeDefinitionDirs)();
        }
        return this._nodeDefinitionDirs;
    }
    getNodeCatalogService() {
        return this.nodeCatalogService ?? di_1.Container.get(node_catalog_1.NodeCatalogService);
    }
    createNodeAdapter(user) {
        const getAllNodes = async () => await this.getNodesFromCache();
        const getNodes = async () => {
            const nodes = await getAllNodes();
            const disabled = new Set((0, node_catalog_1.getModuleDisabledNodeTypes)(di_1.Container.get(backend_common_1.ModuleRegistry)));
            return disabled.size > 0 ? nodes.filter((n) => !disabled.has(n.name)) : nodes;
        };
        const getUnavailableNotice = (nodeType) => (0, node_catalog_1.getModuleDisabledNotice)(di_1.Container.get(backend_common_1.ModuleRegistry), nodeType);
        const getGatewayConfig = async () => await this.getGatewayConfigOrNull();
        const buildMeta = (config, nodeName) => this.buildAiGatewayNodeMeta(config, nodeName);
        const findNodeByVersion = (nodes, nodeType, version) => {
            if (version !== undefined) {
                const exact = nodes.find((n) => {
                    if (n.name !== nodeType)
                        return false;
                    if (Array.isArray(n.version))
                        return n.version.includes(version);
                    return n.version === version;
                });
                if (exact)
                    return exact;
            }
            return nodes.find((n) => n.name === nodeType);
        };
        return {
            async listAvailable(options) {
                const [nodes, gatewayConfig] = await Promise.all([
                    getNodes(),
                    options?.gatewayCreditsOnly ? getGatewayConfig() : Promise.resolve(null),
                ]);
                let filtered = nodes;
                if (options?.query) {
                    const q = options.query.toLowerCase();
                    filtered = filtered.filter((n) => n.displayName.toLowerCase().includes(q) ||
                        n.name.toLowerCase().includes(q) ||
                        n.description?.toLowerCase().includes(q));
                }
                const summaries = filtered.map((n) => {
                    const summary = {
                        name: n.name,
                        displayName: n.displayName,
                        description: n.description ?? '',
                        group: n.group ?? [],
                        version: Array.isArray(n.version) ? n.version[n.version.length - 1] : n.version,
                    };
                    const meta = buildMeta(gatewayConfig, n.name);
                    if (meta)
                        summary.aiGateway = meta;
                    return summary;
                });
                return options?.gatewayCreditsOnly ? summaries.filter((s) => s.aiGateway) : summaries;
            },
            async listSearchable() {
                const [nodes, gatewayConfig] = await Promise.all([getNodes(), getGatewayConfig()]);
                const toStringArray = (value) => {
                    if (typeof value === 'string')
                        return value;
                    return value.map((v) => (typeof v === 'string' ? v : v.type));
                };
                return nodes.map((n) => {
                    const result = {
                        name: n.name,
                        displayName: n.displayName,
                        description: n.description ?? '',
                        version: n.version,
                        inputs: toStringArray(n.inputs),
                        outputs: toStringArray(n.outputs),
                    };
                    const meta = buildMeta(gatewayConfig, n.name);
                    if (meta)
                        result.aiGateway = meta;
                    if (n.codex?.alias) {
                        result.codex = { alias: n.codex.alias };
                    }
                    if (n.builderHint) {
                        result.builderHint = {};
                        if (n.builderHint.searchHint) {
                            result.builderHint.searchHint = n.builderHint.searchHint;
                        }
                        if (n.builderHint.inputs) {
                            const inputs = {};
                            for (const [key, config] of Object.entries(n.builderHint.inputs)) {
                                inputs[key] = {
                                    required: config.required,
                                    ...(config.displayOptions
                                        ? { displayOptions: config.displayOptions }
                                        : {}),
                                };
                            }
                            result.builderHint.inputs = inputs;
                        }
                        if (n.builderHint.outputs) {
                            const outputs = {};
                            for (const [key, config] of Object.entries(n.builderHint.outputs)) {
                                outputs[key] = {
                                    ...(config.required !== undefined ? { required: config.required } : {}),
                                    ...(config.displayOptions
                                        ? { displayOptions: config.displayOptions }
                                        : {}),
                                };
                            }
                            result.builderHint.outputs = outputs;
                        }
                    }
                    return result;
                });
            },
            async getDescription(nodeType, version, options) {
                const [nodes, gatewayConfig] = await Promise.all([
                    getAllNodes(),
                    options?.includeGatewayMetadata === false ? Promise.resolve(null) : getGatewayConfig(),
                ]);
                let desc = version !== undefined
                    ? nodes.find((n) => {
                        if (n.name !== nodeType)
                            return false;
                        if (Array.isArray(n.version))
                            return n.version.includes(version);
                        return n.version === version;
                    })
                    : undefined;
                if (!desc) {
                    desc = nodes.find((n) => n.name === nodeType);
                }
                if (!desc) {
                    throw new Error(`Node type ${nodeType} not found`);
                }
                const meta = buildMeta(gatewayConfig, desc.name);
                const unavailable = getUnavailableNotice(desc.name);
                return {
                    name: desc.name,
                    displayName: desc.displayName,
                    description: desc.description ?? '',
                    group: desc.group ?? [],
                    version: Array.isArray(desc.version)
                        ? desc.version[desc.version.length - 1]
                        : desc.version,
                    properties: desc.properties.map((p) => ({
                        displayName: p.displayName,
                        name: p.name,
                        type: p.type,
                        required: p.required,
                        description: p.description,
                        default: p.default,
                        options: p.options
                            ?.filter((o) => typeof o === 'object' && o !== null && 'name' in o && 'value' in o)
                            .map((o) => ({
                            name: String(o.name),
                            value: o.value,
                        })),
                        ...(p.displayOptions ? { displayOptions: p.displayOptions } : {}),
                    })),
                    credentials: desc.credentials?.map((c) => ({
                        name: c.name,
                        required: c.required,
                        ...(c.displayOptions
                            ? { displayOptions: c.displayOptions }
                            : {}),
                    })),
                    inputs: Array.isArray(desc.inputs) ? desc.inputs.map(String) : [],
                    outputs: Array.isArray(desc.outputs) ? desc.outputs.map(String) : [],
                    ...(desc.webhooks ? { webhooks: desc.webhooks } : {}),
                    ...(desc.polling ? { polling: desc.polling } : {}),
                    ...(desc.triggerPanel !== undefined ? { triggerPanel: desc.triggerPanel } : {}),
                    ...(meta ? { aiGateway: meta } : {}),
                    ...(unavailable ? { unavailable } : {}),
                };
            },
            getNodeTypeDefinition: async (nodeType, options) => {
                const nodeCatalogService = this.getNodeCatalogService();
                await nodeCatalogService.initialize();
                const { version, resource, operation, mode } = options ?? {};
                const getDefinition = async (nodeId) => await nodeCatalogService.getNodeTypeDefinition({
                    nodeId,
                    ...(version ? { version } : {}),
                    ...(resource ? { resource } : {}),
                    ...(operation ? { operation } : {}),
                    ...(mode ? { mode } : {}),
                });
                const result = await getDefinition(nodeType);
                const unavailable = getUnavailableNotice(nodeType);
                if (unavailable && !result.error)
                    return { ...result, unavailable };
                if (!result.error || nodeType.includes('.'))
                    return result;
                return await getDefinition(`${node_description_transform_1.MCP_REGISTRY_PACKAGE_NAME}.${nodeType}`);
            },
            listDiscriminators: async (nodeType) => {
                const nodeCatalogService = this.getNodeCatalogService();
                await nodeCatalogService.initialize();
                return (0, node_definition_resolver_1.listNodeDiscriminators)(nodeType, nodeCatalogService.getNodeDefinitionDirs());
            },
            getParameterIssues: async (nodeType, typeVersion, parameters) => {
                const nodes = await getAllNodes();
                const desc = findNodeByVersion(nodes, nodeType, typeVersion);
                if (!desc)
                    return {};
                const nodeProperties = desc.properties;
                const paramsWithDefaults = resolveDisplayedDefaults(nodeProperties, parameters, nodeType, typeVersion, desc);
                const minimalNode = {
                    id: '',
                    name: '',
                    type: nodeType,
                    typeVersion,
                    parameters: paramsWithDefaults,
                    position: [0, 0],
                };
                const issues = n8n_workflow_1.NodeHelpers.getNodeParametersIssues(nodeProperties, minimalNode, desc);
                const allIssues = issues?.parameters ?? {};
                const topLevelPropsByName = new Map();
                for (const prop of nodeProperties) {
                    const existing = topLevelPropsByName.get(prop.name);
                    if (existing) {
                        existing.push(prop);
                    }
                    else {
                        topLevelPropsByName.set(prop.name, [prop]);
                    }
                }
                const filteredIssues = {};
                for (const [key, value] of Object.entries(allIssues)) {
                    const props = topLevelPropsByName.get(key);
                    if (!props)
                        continue;
                    const isDisplayed = props.some((prop) => {
                        if (prop.type === 'hidden')
                            return false;
                        if (prop.displayOptions &&
                            !n8n_workflow_1.NodeHelpers.displayParameter(paramsWithDefaults, prop, minimalNode, desc)) {
                            return false;
                        }
                        return true;
                    });
                    if (!isDisplayed)
                        continue;
                    filteredIssues[key] = value;
                }
                return filteredIssues;
            },
            getNodeCredentialTypes: async (nodeType, typeVersion, parameters, _existingCredentials) => {
                const nodes = await getAllNodes();
                const desc = findNodeByVersion(nodes, nodeType, typeVersion);
                if (!desc)
                    return [];
                const credentialTypes = new Set();
                const paramsWithDefaults = resolveDisplayedDefaults(desc.properties, parameters, nodeType, typeVersion, desc);
                const minimalNode = {
                    id: '',
                    name: '',
                    type: nodeType,
                    typeVersion,
                    parameters: paramsWithDefaults,
                    position: [0, 0],
                };
                const nodeCredentials = desc.credentials ?? [];
                for (const cred of nodeCredentials) {
                    if (cred.displayOptions) {
                        if (!n8n_workflow_1.NodeHelpers.displayParameter(paramsWithDefaults, cred, minimalNode, desc)) {
                            continue;
                        }
                    }
                    credentialTypes.add(cred.name);
                }
                const issues = n8n_workflow_1.NodeHelpers.getNodeParametersIssues(desc.properties, minimalNode, desc);
                const credentialIssues = issues?.credentials ?? {};
                for (const credType of Object.keys(credentialIssues)) {
                    credentialTypes.add(credType);
                }
                if (parameters.authentication === 'genericCredentialType' && parameters.genericAuthType) {
                    credentialTypes.add(parameters.genericAuthType);
                }
                else if (parameters.authentication === 'predefinedCredentialType' &&
                    parameters.nodeCredentialType) {
                    credentialTypes.add(parameters.nodeCredentialType);
                }
                return Array.from(credentialTypes);
            },
            getResolvedNodeInputs: async (workflowJson, nodeName) => {
                const nodeJson = workflowJson.nodes.find((n) => n.name === nodeName);
                if (!nodeJson)
                    return [];
                const nodeType = this.nodeTypes.getByNameAndVersion(nodeJson.type, nodeJson.typeVersion ?? 1);
                if (!nodeType)
                    return [];
                const workflow = new n8n_workflow_1.Workflow({
                    nodes: workflowJson.nodes,
                    connections: workflowJson.connections,
                    active: false,
                    nodeTypes: this.nodeTypes,
                });
                const workflowNode = workflow.getNode(nodeName);
                if (!workflowNode)
                    return [];
                await workflow.expression.acquireIsolate();
                try {
                    return n8n_workflow_1.NodeHelpers.getNodeInputs(workflow, workflowNode, nodeType.description);
                }
                finally {
                    await workflow.expression.releaseIsolate();
                }
            },
            exploreResources: async (params) => await this.nodeResourceExplorerService.exploreResources(user, params),
            findUnavailableLocatorValues: async (params) => await this.nodeResourceExplorerService.findUnavailableResourceLocatorValues(user, params),
        };
    }
    createWorkspaceAdapter(user, boundProjectId) {
        const { projectService, folderService, tagService, workflowFinderService, workflowService, executionRepository, executionPersistence, eventService, } = this;
        const assertNotReadOnly = (resource) => this.assertInstanceNotReadOnly(resource);
        const { assertProjectScope } = this.createProjectScopeHelpers(user);
        const teamProjectsLicensed = this.teamProjectsLicensed();
        const adapter = {
            async getProject(projectId) {
                const project = await projectService.getProjectWithScope(user, projectId, ['project:read']);
                if (!project)
                    return null;
                return { id: project.id, name: project.name, type: project.type };
            },
            async listProjects() {
                const projects = await projectService.getAccessibleProjects(user);
                const summaries = projects.map((p) => ({
                    id: p.id,
                    name: p.name,
                    type: p.type,
                }));
                if (teamProjectsLicensed)
                    return summaries;
                const personalProjectId = (await projectService.getPersonalProject(user))?.id;
                return summaries.filter((p) => p.id === personalProjectId || p.id === boundProjectId);
            },
            ...(this.license.isLicensed('feat:folders')
                ? {
                    async listFolders(projectId) {
                        await assertProjectScope(['folder:list'], projectId);
                        const [folders] = await folderService.getManyAndCount(projectId, { take: 100 });
                        return folders.map((f) => ({
                            id: f.id,
                            name: f.name,
                            parentFolderId: f.parentFolderId,
                        }));
                    },
                    async createFolder(name, projectId, parentFolderId) {
                        assertNotReadOnly('folders');
                        await assertProjectScope(['folder:create'], projectId);
                        const folder = await folderService.createFolder({ name, parentFolderId: parentFolderId ?? undefined }, projectId);
                        return {
                            id: folder.id,
                            name: folder.name,
                            parentFolderId: folder.parentFolderId ?? null,
                        };
                    },
                    async deleteFolder(folderId, projectId, transferToFolderId) {
                        assertNotReadOnly('folders');
                        await assertProjectScope(['folder:delete'], projectId);
                        await folderService.deleteFolder(user, folderId, projectId, {
                            transferToFolderId: transferToFolderId ?? undefined,
                        });
                    },
                    async moveWorkflowToFolder(workflowId, folderId) {
                        assertNotReadOnly('workflows');
                        const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                            'workflow:update',
                        ]);
                        if (!workflow) {
                            throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                        }
                        await workflowService.update(user, workflow, workflowId, {
                            parentFolderId: folderId,
                            source: 'n8n-ai',
                        });
                    },
                }
                : {}),
            async tagWorkflow(workflowId, tagNames) {
                assertNotReadOnly('workflows');
                const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:update',
                ]);
                if (!workflow) {
                    throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                }
                if (!(0, permissions_1.hasGlobalScope)(user, 'tag:list')) {
                    throw new Error('User does not have permission to list tags');
                }
                const existingTags = await tagService.getAll();
                const tagMap = new Map(existingTags.map((t) => [t.name.toLowerCase(), t]));
                const tagIds = [];
                for (const tagName of tagNames) {
                    const existing = tagMap.get(tagName.toLowerCase());
                    if (existing) {
                        tagIds.push(existing.id);
                    }
                    else {
                        if (!(0, permissions_1.hasGlobalScope)(user, 'tag:create')) {
                            throw new Error('User does not have permission to create tags');
                        }
                        const entity = tagService.toEntity({ name: tagName });
                        const saved = await tagService.save(entity, 'create');
                        tagIds.push(saved.id);
                    }
                }
                await workflowService.update(user, workflow, workflowId, { tagIds, source: 'n8n-ai' });
                return tagNames;
            },
            async listTags() {
                if (!(0, permissions_1.hasGlobalScope)(user, 'tag:list')) {
                    throw new Error('User does not have permission to list tags');
                }
                const tags = await tagService.getAll();
                return tags.map((t) => ({ id: t.id, name: t.name }));
            },
            async createTag(name) {
                if (!(0, permissions_1.hasGlobalScope)(user, 'tag:create')) {
                    throw new Error('User does not have permission to create tags');
                }
                const entity = tagService.toEntity({ name });
                const saved = await tagService.save(entity, 'create');
                return { id: saved.id, name: saved.name };
            },
            async cleanupTestExecutions(workflowId, options) {
                assertNotReadOnly('executions');
                const workflow = await workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'execution:delete',
                ]);
                if (!workflow) {
                    throw new instance_ai_1.WorkflowNotFoundError(workflowId);
                }
                const olderThanHours = options?.olderThanHours ?? 1;
                const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
                const executions = await executionRepository.find({
                    select: ['id'],
                    where: {
                        workflowId,
                        mode: 'manual',
                        startedAt: (0, typeorm_1.LessThan)(cutoff),
                    },
                });
                if (executions.length === 0) {
                    return { deletedCount: 0 };
                }
                const ids = executions.map((e) => e.id);
                for (let start = 0; start < ids.length; start += EXECUTION_DELETE_CHUNK_SIZE) {
                    await executionPersistence.hardDeleteBy({
                        filters: undefined,
                        accessibleWorkflowIds: [workflowId],
                        deleteConditions: { ids: ids.slice(start, start + EXECUTION_DELETE_CHUNK_SIZE) },
                    });
                }
                eventService.emit('execution-deleted', {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                    },
                    executionIds: ids,
                    deleteBefore: cutoff,
                });
                return { deletedCount: ids.length };
            },
        };
        return adapter;
    }
};
exports.InstanceAiAdapterService = InstanceAiAdapterService;
exports.InstanceAiAdapterService = InstanceAiAdapterService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, workflow_service_1.WorkflowService, workflow_finder_service_1.WorkflowFinderService, db_1.WorkflowRepository, db_1.SharedWorkflowRepository, db_1.ProjectRepository, db_1.ExecutionRepository, credentials_service_1.CredentialsService, backend_services_1.CredentialsFinderService, active_executions_1.ActiveExecutions, workflow_runner_1.WorkflowRunner, load_nodes_and_credentials_1.LoadNodesAndCredentials, node_types_1.NodeTypes, n8n_core_1.InstanceSettings, data_table_service_1.DataTableService, data_table_repository_1.DataTableRepository, node_resource_explorer_service_1.NodeResourceExplorerService, folder_service_1.FolderService, project_service_ee_1.ProjectService, tag_service_1.TagService, backend_services_1.InstanceWriteAccessService, instance_ai_settings_service_1.InstanceAiSettingsService, workflow_history_service_1.WorkflowHistoryService, workflow_service_ee_1.EnterpriseWorkflowService, license_1.License, execution_persistence_1.ExecutionPersistence, backend_services_1.EventService, backend_services_1.RoleService, telemetry_2.Telemetry, db_1.AiBuilderTemporaryWorkflowRepository, backend_network_1.OutboundHttp, ai_gateway_service_1.AiGatewayService, workflow_templates_service_1.WorkflowTemplatesService, collaboration_service_1.CollaborationService, policy_enforcement_service_1.PolicyEnforcementService, node_catalog_1.NodeCatalogService, evaluation_config_service_1.EvaluationConfigService, llm_judge_provider_registry_1.LlmJudgeProviderRegistry, workflow_dependency_query_service_1.WorkflowDependencyQueryService, db_1.FolderRepository, backend_services_1.FolderFinderService, instance_context_service_1.InstanceContextService, node_execution_1.ExecuteNodeService, backend_common_1.LicenseState, ai_preference_service_1.AiPreferenceService])
], InstanceAiAdapterService);
const MAX_RESULT_CHARS = 20_000;
const MAX_NODE_OUTPUT_CHARS = 1_000;
async function resolveMetricProviders(input, deps) {
    const { user, credentialsFinderService, llmJudgeProviderRegistry } = deps;
    const metrics = await Promise.all(input.metrics.map(async (metric) => {
        if (metric.provider)
            return metric;
        if (!llmJudgeProviderRegistry) {
            throw new n8n_workflow_1.UnexpectedError('Cannot derive the judge provider: provider registry is unavailable.');
        }
        const credential = await credentialsFinderService.findCredentialForUser(metric.credentialId, user, ['credential:read']);
        if (!credential) {
            throw new n8n_workflow_1.UserError(`Credential "${metric.credentialId}" for metric "${metric.name}" was not found or is not accessible.`);
        }
        const provider = llmJudgeProviderRegistry.getByCredentialType(credential.type);
        if (!provider) {
            throw new n8n_workflow_1.UserError(`Credential type "${credential.type}" for metric "${metric.name}" is not a supported LLM judge provider.`);
        }
        return { ...metric, provider: provider.nodeType };
    }));
    return { ...input, metrics };
}
function buildEvaluationConfigDto(input) {
    return api_types_1.upsertEvaluationConfigSchema.parse({
        name: input.name,
        startNodeName: input.startNodeName,
        endNodeName: input.endNodeName,
        datasetSource: 'data_table',
        datasetRef: { dataTableId: input.dataTableId },
        metrics: input.metrics.map((metric) => ({
            id: (0, nanoid_1.nanoid)(),
            name: metric.name,
            type: 'llm_judge',
            config: {
                preset: metric.preset,
                ...(metric.prompt ? { prompt: metric.prompt } : {}),
                provider: metric.provider,
                credentialId: metric.credentialId,
                model: metric.model,
                outputType: metric.outputType,
                inputs: {
                    actualAnswer: metric.actualAnswer,
                    ...(metric.userQuery ? { userQuery: metric.userQuery } : {}),
                    ...(metric.expectedAnswer ? { expectedAnswer: metric.expectedAnswer } : {}),
                },
            },
        })),
    });
}
function evaluationConfigToSummary(config) {
    const dataTableId = config.datasetSource === 'data_table' && 'dataTableId' in config.datasetRef
        ? config.datasetRef.dataTableId
        : undefined;
    return {
        id: config.id,
        workflowId: config.workflowId,
        name: config.name,
        status: config.status,
        invalidReason: config.invalidReason,
        startNodeName: config.startNodeName,
        endNodeName: config.endNodeName,
        metrics: config.metrics.map((metric) => ({
            id: metric.id,
            name: metric.name,
            type: metric.type,
        })),
        datasetSource: config.datasetSource,
        ...(dataTableId !== undefined ? { dataTableId } : {}),
    };
}
function evaluationConfigToDetail(config) {
    const dataTableId = config.datasetSource === 'data_table' && 'dataTableId' in config.datasetRef
        ? config.datasetRef.dataTableId
        : undefined;
    return {
        id: config.id,
        workflowId: config.workflowId,
        name: config.name,
        status: config.status,
        invalidReason: config.invalidReason,
        startNodeName: config.startNodeName,
        endNodeName: config.endNodeName,
        metrics: config.metrics,
        datasetSource: config.datasetSource,
        ...(dataTableId !== undefined ? { dataTableId } : {}),
    };
}
async function resolveDataTableByIdOrName(repository, logger, idOrName, options) {
    const byId = await repository.findOneBy({ id: idOrName });
    if (byId) {
        if (options?.accessFilter && !(await options.accessFilter(byId.id))) {
            return { kind: 'miss' };
        }
        return { kind: 'hit', table: byId };
    }
    const candidates = await repository.findBy({
        name: idOrName,
        ...(options?.projectIdFilter ? { projectId: options.projectIdFilter } : {}),
    });
    let filtered = candidates;
    if (options?.accessFilter) {
        filtered = [];
        for (const c of candidates) {
            if (await options.accessFilter(c.id))
                filtered.push(c);
        }
    }
    if (filtered.length === 0)
        return { kind: 'miss' };
    if (filtered.length > 1)
        return { kind: 'ambiguous', candidates: filtered };
    const hit = filtered[0];
    logger.warn('data-tables tool called with table name instead of id — resolved by name fallback', {
        passedValue: idOrName,
        resolvedId: hit.id,
        projectId: hit.projectId,
    });
    return { kind: 'hit', table: hit };
}
function truncateResultData(resultData) {
    const serialized = JSON.stringify(resultData);
    if (serialized.length <= MAX_RESULT_CHARS)
        return resultData;
    const truncated = {};
    for (const [nodeName, value] of Object.entries(resultData)) {
        truncated[nodeName] = isBranchedNodeOutput(value)
            ? {
                ...value,
                outputs: value.outputs.map((output) => ({
                    ...output,
                    items: collapseItems(output.items),
                })),
            }
            : collapseItems(value);
    }
    return truncated;
}
function collapseItems(items) {
    if (!Array.isArray(items) || items.length === 0)
        return items;
    const itemStr = JSON.stringify(items[0]);
    const preview = itemStr.length > MAX_NODE_OUTPUT_CHARS
        ? `${itemStr.slice(0, MAX_NODE_OUTPUT_CHARS)}…`
        : items[0];
    return {
        _itemCount: items.length,
        _truncated: true,
        _firstItemPreview: preview,
    };
}
function isBranchedNodeOutput(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'outputs' in value &&
        Array.isArray(value.outputs));
}
function wrapResultDataEntries(data) {
    const wrapped = {};
    for (const [nodeName, value] of Object.entries(data)) {
        wrapped[nodeName] = (0, instance_ai_1.wrapUntrustedData)(JSON.stringify(value, null, 2), 'execution-output', `node:${nodeName}`);
    }
    return wrapped;
}
const MAX_NODE_ERRORS = 10;
function isFailedNodeRun(nodeRun) {
    return (nodeRun.executionStatus === 'error' ||
        nodeRun.error !== undefined ||
        nodeRun.redactedError !== undefined);
}
function nodeContinuesOnError(node) {
    return (node?.continueOnFail === true ||
        node?.onError === 'continueRegularOutput' ||
        node?.onError === 'continueErrorOutput');
}
function extractNodeErrors(runData, includeUpstreamDetails, workflowNodes = []) {
    if (!runData)
        return [];
    const nodesByName = new Map(workflowNodes.map((node) => [node.name, node]));
    const nodeErrors = [];
    for (const [nodeName, nodeRuns] of Object.entries(runData)) {
        if (nodeErrors.length >= MAX_NODE_ERRORS)
            break;
        if (nodeContinuesOnError(nodesByName.get(nodeName)))
            continue;
        const failedRun = nodeRuns.find(isFailedNodeRun);
        if (!failedRun)
            continue;
        const message = failedRun.error
            ? formatExecutionError(failedRun.error, includeUpstreamDetails)
            : failedRun.redactedError
                ? `${failedRun.redactedError.type} error${failedRun.redactedError.httpCode ? ` (${failedRun.redactedError.httpCode})` : ''}`
                : undefined;
        nodeErrors.push({
            nodeName,
            ...(message ? { message } : {}),
        });
    }
    return nodeErrors;
}
async function extractExecutionResult(executionId, includeOutputData = true, nodeTypes) {
    return (await extractExecutionOutcome(executionId, includeOutputData, nodeTypes)).result;
}
function nonMainOutputs(run) {
    return Object.entries(run?.data ?? {}).find(([type]) => type !== n8n_workflow_1.NodeConnectionTypes.Main)?.[1];
}
const isToolExecutor = (nodeName) => nodeName === constants_1.TOOL_EXECUTOR_NODE_NAME;
function renameToolExecutor(nodeName, subNodeTarget) {
    return subNodeTarget && isToolExecutor(nodeName) ? subNodeTarget : nodeName;
}
function foldToolExecutorRun(runData, subNodeTarget) {
    if (!runData || !subNodeTarget || !runData[constants_1.TOOL_EXECUTOR_NODE_NAME])
        return runData;
    const folded = {};
    for (const [nodeName, nodeRuns] of Object.entries(runData)) {
        if (isToolExecutor(nodeName)) {
            folded[subNodeTarget] ??= nodeRuns;
            continue;
        }
        folded[nodeName] = nodeRuns;
    }
    return folded;
}
async function extractExecutionOutcome(executionId, includeOutputData = true, nodeTypes, subNodeTarget) {
    const execution = await di_1.Container.get(execution_persistence_1.ExecutionPersistence).findSingleExecution(executionId, {
        includeData: true,
        unflattenData: true,
    });
    if (!execution) {
        return { result: { executionId, status: 'unknown' } };
    }
    const status = execution.status === 'error' || execution.status === 'crashed'
        ? 'error'
        : execution.status === 'running' || execution.status === 'new'
            ? 'running'
            : execution.status === 'waiting'
                ? 'waiting'
                : 'success';
    const resultData = {};
    const runData = foldToolExecutorRun(execution.data?.resultData?.runData, subNodeTarget);
    const executedNodeNames = Object.keys(runData ?? {});
    const binaryOutputNodeNames = [];
    if (includeOutputData && runData) {
        const workflow = buildExecutionWorkflow(execution.workflowData, nodeTypes);
        await workflow?.expression.acquireIsolate();
        try {
            for (const [nodeName, nodeRuns] of Object.entries(runData)) {
                const lastRun = nodeRuns[nodeRuns.length - 1];
                const outputs = lastRun?.data?.[n8n_workflow_1.NodeConnectionTypes.Main] ??
                    (nodeName === subNodeTarget ? nonMainOutputs(lastRun) : undefined);
                if (!outputs)
                    continue;
                if (outputs.some((items) => items?.some((item) => Object.keys(item.binary ?? {}).length))) {
                    binaryOutputNodeNames.push(nodeName);
                }
                const branches = outputs.map((items) => (items ?? []).map((item) => item.json));
                const totalItems = branches.reduce((sum, items) => sum + items.length, 0);
                if (totalItems === 0)
                    continue;
                if (branches.length === 1) {
                    resultData[nodeName] = truncateNodeOutput(branches[0]);
                    continue;
                }
                const names = resolveOutputNames(workflow, nodeName);
                resultData[nodeName] = {
                    outputs: branches.map((items, index) => ({
                        index,
                        ...(names[index] ? { name: names[index] } : {}),
                        items: truncateNodeOutput(items),
                    })),
                    totalItems,
                };
            }
        }
        finally {
            await workflow?.expression.releaseIsolate();
        }
    }
    const error = execution.data?.resultData?.error;
    const errorMessage = error ? formatExecutionError(error, includeOutputData) : undefined;
    const nodeErrors = extractNodeErrors(runData, includeOutputData, execution.workflowData?.nodes);
    return {
        result: {
            executionId,
            status,
            data: Object.keys(resultData).length > 0
                ? wrapResultDataEntries(truncateResultData(resultData))
                : undefined,
            executedNodeNames: executedNodeNames.length > 0 ? executedNodeNames : undefined,
            binaryOutputNodeNames: binaryOutputNodeNames.length > 0 ? binaryOutputNodeNames : undefined,
            nodeErrors: nodeErrors.length > 0 ? nodeErrors : undefined,
            lastNodeExecuted: renameToolExecutor(execution.data?.resultData?.lastNodeExecuted, subNodeTarget),
            workflowVersionId: execution.workflowVersionId,
            error: errorMessage,
            startedAt: execution.startedAt?.toISOString(),
            finishedAt: execution.stoppedAt?.toISOString(),
        },
        telemetryError: error ? formatExecutionError(error, false) : undefined,
    };
}
const MAX_ERROR_CHARS = 4_000;
function formatExecutionError(error, includeUpstreamDetails) {
    const parts = [];
    if (error.message)
        parts.push(error.message);
    if (includeUpstreamDetails) {
        if (error.description && error.description !== error.message) {
            parts.push(error.description);
        }
        if ('messages' in error && error.messages.length > 0) {
            parts.push(`Details: ${error.messages.join(' | ')}`);
        }
    }
    else {
        const hasDescription = !!error.description && error.description !== error.message;
        const hasMessages = 'messages' in error && error.messages.length > 0;
        if (hasDescription || hasMessages) {
            parts.push('(upstream error details suppressed by the instance AI privacy setting; ask the user to share the node error from the UI)');
        }
    }
    const combined = parts.join(' — ') || 'Unknown error';
    return combined.length > MAX_ERROR_CHARS ? `${combined.slice(0, MAX_ERROR_CHARS)}…` : combined;
}
const MAX_NODE_OUTPUT_BYTES = 5_000;
function truncateNodeOutput(items) {
    const truncated = capItemsBySerializedSize(items, MAX_NODE_OUTPUT_BYTES);
    if (truncated === items)
        return items;
    return {
        items: truncated,
        truncated: true,
        totalItems: items.length,
        shownItems: truncated.length,
        message: `Output truncated: showing ${truncated.length} of ${items.length} items. Use get-node-output to retrieve full data for this node.`,
    };
}
function capItemsBySerializedSize(items, maxBytes) {
    if (JSON.stringify(items).length <= maxBytes)
        return items;
    const kept = [];
    let size = 2;
    for (const item of items) {
        const itemStr = JSON.stringify(item);
        if (size + itemStr.length + 2 > maxBytes)
            break;
        kept.push(item);
        size += itemStr.length + 1;
    }
    return kept;
}
const EXECUTE_NODE_DETAILS_SUPPRESSED = '(upstream error details suppressed by the instance AI privacy setting; ask the user to share the node error from the UI)';
function redactExecuteNodeResult(result, allowSendingParameterValues) {
    if (result.status === 'error') {
        const { message, description, nodeErrorType } = result.error;
        const cappedDescription = description && description.length > MAX_ERROR_CHARS
            ? `${description.slice(0, MAX_ERROR_CHARS)}…`
            : description;
        return {
            status: 'error',
            error: {
                message,
                description: allowSendingParameterValues
                    ? cappedDescription
                    : description
                        ? EXECUTE_NODE_DETAILS_SUPPRESSED
                        : undefined,
                nodeErrorType,
            },
        };
    }
    if (!allowSendingParameterValues) {
        return {
            status: 'success',
            output: '',
            outputSuppressed: 'The node executed successfully, but its output items are suppressed by the instance AI privacy setting.',
        };
    }
    let totalItems = 0;
    let shownItems = 0;
    const kept = result.output.map((branch) => {
        totalItems += branch.length;
        const keptBranch = capItemsBySerializedSize(branch, MAX_NODE_OUTPUT_BYTES);
        shownItems += keptBranch.length;
        return keptBranch;
    });
    const output = (0, instance_ai_1.wrapUntrustedData)(JSON.stringify(kept, null, 2), 'execution-output');
    if (shownItems === totalItems)
        return { status: 'success', output };
    return {
        status: 'success',
        output,
        truncated: {
            totalItems,
            shownItems,
            message: `Output truncated: showing ${shownItems} of ${totalItems} items. Re-run with fewer input items or a narrower operation to see more.`,
        },
    };
}
const MAX_ITEM_CHARS = 50_000;
function capItem(item) {
    const str = JSON.stringify(item);
    return str.length > MAX_ITEM_CHARS
        ? { _truncatedItem: true, preview: str.slice(0, MAX_ITEM_CHARS), originalLength: str.length }
        : item;
}
function buildExecutionWorkflow(workflowData, nodeTypes) {
    if (!workflowData || !nodeTypes)
        return undefined;
    try {
        return new n8n_workflow_1.Workflow({
            nodes: workflowData.nodes,
            connections: workflowData.connections,
            active: false,
            nodeTypes,
        });
    }
    catch {
        return undefined;
    }
}
function resolveOutputNames(workflow, nodeName) {
    const node = workflow?.getNode(nodeName);
    if (!workflow || !node)
        return [];
    try {
        const { description } = workflow.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
        const outputs = n8n_workflow_1.NodeHelpers.getNodeOutputs(workflow, node, description);
        const count = Math.max(outputs.length, description.outputNames?.length ?? 0);
        return Array.from({ length: count }, (_, i) => {
            const output = outputs[i];
            const displayName = typeof output === 'object' ? output.displayName : undefined;
            return displayName ?? description.outputNames?.[i] ?? '';
        });
    }
    catch {
        return [];
    }
}
async function extractNodeOutput(executionId, nodeName, options, nodeTypes) {
    const execution = await di_1.Container.get(execution_persistence_1.ExecutionPersistence).findSingleExecution(executionId, {
        includeData: true,
        unflattenData: true,
    });
    if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
    }
    const runData = execution.data?.resultData?.runData;
    if (!runData?.[nodeName]) {
        throw new Error(`Node "${nodeName}" not found in execution ${executionId}`);
    }
    const nodeRuns = runData[nodeName];
    const lastRun = nodeRuns[nodeRuns.length - 1];
    const startIndex = options?.startIndex ?? 0;
    const maxItems = Math.min(options?.maxItems ?? 10, 50);
    const workflow = buildExecutionWorkflow(execution.workflowData, nodeTypes);
    await workflow?.expression.acquireIsolate();
    let names;
    try {
        names = resolveOutputNames(workflow, nodeName);
    }
    finally {
        await workflow?.expression.releaseIsolate();
    }
    const readsEveryRun = nodeRuns.some((run) => nonMainOutputs(run) !== undefined);
    const runsRead = readsEveryRun ? nodeRuns : [lastRun];
    const outputsPerRun = runsRead.map((run) => run?.data?.[n8n_workflow_1.NodeConnectionTypes.Main] ?? nonMainOutputs(run) ?? []);
    const outputCount = Math.max(0, ...outputsPerRun.map((runOutputs) => runOutputs.length));
    let index = 0;
    let returnedCount = 0;
    const outputs = [];
    for (let outputIndex = 0; outputIndex < outputCount; outputIndex++) {
        const collected = [];
        let itemsOnOutput = 0;
        outputsPerRun.forEach((runOutputs, runIndex) => {
            for (const item of runOutputs[outputIndex] ?? []) {
                if (index >= startIndex && returnedCount < maxItems) {
                    const call = runsRead.length > 1 ? `[call ${runIndex + 1}]` : '';
                    collected.push((0, instance_ai_1.wrapUntrustedData)(JSON.stringify(capItem(item.json), null, 2), 'execution-output', `node:${nodeName}${call}[${outputIndex}][${itemsOnOutput}]`));
                    returnedCount++;
                }
                index++;
                itemsOnOutput++;
            }
        });
        outputs.push({
            index: outputIndex,
            ...(names[outputIndex] ? { name: names[outputIndex] } : {}),
            totalItems: itemsOnOutput,
            items: collected,
        });
    }
    return {
        nodeName,
        outputs,
        totalItems: index,
        returned: { from: startIndex, to: startIndex + returnedCount },
        ...(nodeRuns.length > 1 ? { totalRuns: nodeRuns.length } : {}),
    };
}
const KNOWN_TRIGGER_TYPES = new Set([
    n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE,
    n8n_workflow_1.FORM_TRIGGER_NODE_TYPE,
    n8n_workflow_1.WEBHOOK_NODE_TYPE,
    n8n_workflow_1.SCHEDULE_TRIGGER_NODE_TYPE,
]);
function findTriggerNode(nodes) {
    const byPreference = [
        (n) => KNOWN_TRIGGER_TYPES.has(n.type),
        (n) => (0, n8n_workflow_1.isTriggerNodeType)(n.type),
    ];
    for (const isEligible of byPreference) {
        const enabled = nodes.find((n) => isEligible(n) && !n.disabled);
        if (enabled)
            return enabled;
    }
    for (const isEligible of byPreference) {
        const anyTrigger = nodes.find((n) => isEligible(n));
        if (anyTrigger)
            return anyTrigger;
    }
    return undefined;
}
function resolveRequestedTriggerNode(nodes, triggerNodeName) {
    const requested = nodes.find((n) => n.name === triggerNodeName);
    if (requested && (0, n8n_workflow_1.isTriggerNodeType)(requested.type))
        return requested;
    const available = nodes.filter((n) => (0, n8n_workflow_1.isTriggerNodeType)(n.type)).map((n) => `"${n.name}"`);
    const reason = requested
        ? `"${triggerNodeName}" is not a trigger node`
        : `Trigger node "${triggerNodeName}" not found in the workflow`;
    throw new n8n_workflow_1.UserError(`${reason}. ${available.length > 0
        ? `Available trigger nodes: ${available.join(', ')}.`
        : 'This workflow has no trigger nodes.'}`);
}
function omitWorkflowConnections(connections, omit) {
    const omitted = new Set(omit.map((edge) => `${edge.source}→${edge.target}`));
    const result = {};
    for (const [source, byType] of Object.entries(connections)) {
        const nextByType = {};
        for (const [type, groups] of Object.entries(byType)) {
            nextByType[type] = (groups ?? []).map((group) => group ? group.filter((connection) => !omitted.has(`${source}→${connection.node}`)) : group);
        }
        result[source] = nextByType;
    }
    return result;
}
function getExecutionModeForTrigger(node) {
    switch (node.type) {
        case n8n_workflow_1.WEBHOOK_NODE_TYPE:
            return 'webhook';
        case n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE:
            return 'chat';
        case n8n_workflow_1.FORM_TRIGGER_NODE_TYPE:
        case n8n_workflow_1.SCHEDULE_TRIGGER_NODE_TYPE:
            return 'trigger';
        default:
            return 'manual';
    }
}
async function extractExecutionDebugInfo(executionId, includeOutputData = true, nodeTypes) {
    const execution = await di_1.Container.get(execution_persistence_1.ExecutionPersistence).findSingleExecution(executionId, {
        includeData: true,
        unflattenData: true,
    });
    if (!execution) {
        return {
            executionId,
            status: 'unknown',
            nodeTrace: [],
        };
    }
    const baseResult = await extractExecutionResult(executionId, includeOutputData, nodeTypes);
    const runData = execution.data?.resultData?.runData;
    const nodeTrace = [];
    let failedNode;
    let failedItemIndex;
    let failedRunIndex;
    if (runData) {
        const workflowNodes = execution.workflowData?.nodes ?? [];
        const nodeTypeMap = new Map(workflowNodes.map((n) => [n.name, n.type]));
        for (const [nodeName, nodeRuns] of Object.entries(runData)) {
            const lastRun = nodeRuns[nodeRuns.length - 1];
            if (!lastRun)
                continue;
            const nodeType = nodeTypeMap.get(nodeName) ?? 'unknown';
            nodeTrace.push({
                name: nodeName,
                type: nodeType,
                status: isFailedNodeRun(lastRun) ? 'error' : 'success',
                startedAt: lastRun.startTime !== undefined ? new Date(lastRun.startTime).toISOString() : undefined,
                finishedAt: lastRun.startTime !== undefined && lastRun.executionTime !== undefined
                    ? new Date(lastRun.startTime + lastRun.executionTime).toISOString()
                    : undefined,
            });
            if (lastRun.error !== undefined && !failedNode) {
                const errorContext = lastRun.error.context;
                failedItemIndex =
                    typeof errorContext?.itemIndex === 'number' ? errorContext.itemIndex : undefined;
                failedRunIndex =
                    typeof errorContext?.runIndex === 'number' ? errorContext.runIndex : nodeRuns.length - 1;
                failedNode = {
                    name: nodeName,
                    type: nodeType,
                    error: formatExecutionError(lastRun.error, includeOutputData),
                    inputData: includeOutputData
                        ? (() => {
                            const inputItems = lastRun.data?.main
                                ?.flat()
                                .filter((item) => item !== null && item !== undefined)
                                .map((item) => item.json);
                            if (inputItems && inputItems.length > 0) {
                                const raw = inputItems[0];
                                return (0, instance_ai_1.wrapUntrustedData)(JSON.stringify(raw, null, 2), 'execution-output', `failed-node-input:${nodeName}`);
                            }
                            return undefined;
                        })()
                        : undefined,
                };
            }
        }
    }
    if (failedNode && includeOutputData && nodeTypes) {
        try {
            const { nodeName: _omitName, suppressed: _omitSuppressed, ...bundle } = await (0, extract_resolved_node_parameters_1.extractResolvedNodeParameters)(nodeTypes, executionId, failedNode.name, {
                itemIndex: failedItemIndex,
                runIndex: failedRunIndex,
            });
            failedNode.resolvedParameters = bundle;
        }
        catch {
        }
    }
    return {
        ...baseResult,
        failedNode,
        nodeTrace,
    };
}
function sdkNodeGroupsToRuntime(nodeGroups) {
    return nodeGroups ?? [];
}
function readHomeProject(workflow) {
    const home = Reflect.get(workflow, 'homeProject');
    if (typeof home !== 'object' || home === null)
        return undefined;
    const id = Reflect.get(home, 'id');
    const name = Reflect.get(home, 'name');
    if (typeof id !== 'string' || typeof name !== 'string')
        return undefined;
    return { id, name };
}
function readParentFolder(workflow) {
    const parent = workflow.parentFolder ?? undefined;
    return parent ? { id: parent.id, name: parent.name } : undefined;
}
const EXECUTION_DELETE_CHUNK_SIZE = 500;
const FOLDER_PATH_CHUNK_SIZE = 500;
async function readFolderPaths(folderRepository, folderIds) {
    const distinct = [...new Set(folderIds)];
    if (distinct.length === 0)
        return new Map();
    const paths = new Map();
    for (let start = 0; start < distinct.length; start += FOLDER_PATH_CHUNK_SIZE) {
        const segments = await folderRepository.getFolderPathsToRoot(distinct.slice(start, start + FOLDER_PATH_CHUNK_SIZE));
        for (const [id, names] of segments)
            paths.set(id, names.join('/'));
    }
    return paths;
}
function hasCredentialId(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    if (Reflect.get(value, 'id') === null && Reflect.get(value, '__aiGatewayManaged') === true) {
        return true;
    }
    const id = Reflect.get(value, 'id');
    return typeof id === 'string' && id.trim() !== '';
}
function normalizeManagedCredentialForSave(value) {
    if (typeof value !== 'object' || value === null)
        return value;
    if (Reflect.get(value, 'id') !== api_types_1.AI_GATEWAY_MANAGED_TAG)
        return value;
    const name = Reflect.get(value, 'name');
    return {
        id: null,
        name: typeof name === 'string' && name !== '' ? name : 'Gateway credits',
        __aiGatewayManaged: true,
    };
}
function sanitizeCredentialReferencesForSave(nodes) {
    return nodes.map((node) => {
        if (!node.credentials)
            return node;
        let changed = false;
        const credentials = Object.entries(node.credentials).reduce((acc, [type, rawValue]) => {
            const value = normalizeManagedCredentialForSave(rawValue);
            if (value !== rawValue)
                changed = true;
            if (hasCredentialId(value)) {
                acc[type] = value;
            }
            else {
                changed = true;
            }
            return acc;
        }, {});
        if (!changed)
            return node;
        const sanitized = { ...node };
        if (Object.keys(credentials).length > 0) {
            sanitized.credentials = credentials;
        }
        else {
            delete sanitized.credentials;
        }
        return sanitized;
    });
}
function toWorkflowJSON(workflow, options) {
    const redact = options?.redactParameters ?? false;
    const source = options?.graph ?? workflow;
    return {
        id: workflow.id,
        name: workflow.name,
        nodes: (source.nodes ?? []).map((n) => ({
            id: n.id ?? '',
            name: n.name,
            type: n.type,
            typeVersion: n.typeVersion,
            position: n.position,
            parameters: redact ? {} : n.parameters,
            credentials: n.credentials,
            webhookId: n.webhookId,
            disabled: n.disabled,
            notes: n.notes,
            notesInFlow: n.notesInFlow,
            executeOnce: n.executeOnce,
            retryOnFail: n.retryOnFail,
            maxTries: n.maxTries,
            waitBetweenTries: n.waitBetweenTries,
            alwaysOutputData: n.alwaysOutputData,
            onError: n.onError ?? (n.continueOnFail ? 'continueRegularOutput' : undefined),
            extendsCredential: n.extendsCredential,
            customTelemetryTags: n.customTelemetryTags,
        })),
        connections: source.connections,
        settings: workflow.settings,
        ...(source.nodeGroups ? { nodeGroups: source.nodeGroups } : {}),
    };
}
function toWorkflowDetail(workflow, options) {
    const redact = options?.redactParameters ?? false;
    return {
        id: workflow.id,
        name: workflow.name,
        versionId: workflow.versionId,
        activeVersionId: workflow.activeVersionId ?? null,
        isArchived: workflow.isArchived,
        createdAt: workflow.createdAt.toISOString(),
        updatedAt: workflow.updatedAt.toISOString(),
        nodes: (workflow.nodes ?? []).map((n) => ({
            name: n.name,
            type: n.type,
            typeVersion: n.typeVersion,
            parameters: redact ? undefined : n.parameters,
            position: n.position,
            webhookId: n.webhookId,
        })),
        connections: workflow.connections,
        settings: workflow.settings,
    };
}
async function toWorkflowDetailWithChecksum(workflow, options) {
    const detail = toWorkflowDetail(workflow, options);
    detail.checksum = await (0, n8n_workflow_1.calculateWorkflowChecksum)(workflow);
    return detail;
}
//# sourceMappingURL=instance-ai.adapter.service.js.map