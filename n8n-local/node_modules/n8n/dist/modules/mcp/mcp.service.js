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
exports.McpService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const server_1 = require("@n8n/mcp-apps/server");
const is_record_1 = require("@n8n/utils/is-record");
const lazy_import_1 = require("@n8n/utils/lazy-import");
const deferred_promise_1 = require("@n8n/utils/promise/deferred-promise");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const active_executions_1 = require("../../active-executions");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
const constants_1 = require("../../constants");
const credentials_service_1 = require("../../credentials/credentials.service");
const execution_list_service_1 = require("../../executions/execution-list.service");
const execution_service_1 = require("../../executions/execution.service");
const data_table_proxy_service_1 = require("../../modules/data-table/data-table-proxy.service");
const node_catalog_1 = require("../../node-catalog");
const node_types_1 = require("../../node-types");
const posthog_1 = require("../../posthog");
const ai_gateway_service_1 = require("../../services/ai-gateway.service");
const ai_preference_service_1 = require("../../services/ai-preference.service");
const folder_service_1 = require("../../services/folder.service");
const node_resource_explorer_service_1 = require("../../services/node-resource-explorer.service");
const project_service_ee_1 = require("../../services/project.service.ee");
const tag_service_1 = require("../../services/tag.service");
const telemetry_1 = require("../../telemetry");
const workflow_runner_1 = require("../../workflow-runner");
const error_workflow_validation_service_1 = require("../../workflows/error-workflow-validation.service");
const workflow_creation_service_1 = require("../../workflows/workflow-creation.service");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const workflow_history_service_1 = require("../../workflows/workflow-history/workflow-history.service");
const workflow_service_1 = require("../../workflows/workflow.service");
const mcp_post_save_metrics_service_1 = require("./mcp-post-save-metrics.service");
const mcp_config_1 = require("./mcp.config");
const mcp_constants_1 = require("./mcp.constants");
const mcp_scopes_1 = require("./mcp-scopes");
const mcp_tool_availability_1 = require("./mcp-tool-availability");
const tool_schema_util_1 = require("./tool-schema.util");
const create_folder_tool_1 = require("./tools/create-folder.tool");
const data_table_1 = require("./tools/data-table");
const execute_workflow_tool_1 = require("./tools/execute-workflow.tool");
const get_execution_tool_1 = require("./tools/get-execution.tool");
const get_instance_context_tool_1 = require("./tools/get-instance-context.tool");
const get_node_usage_tool_1 = require("./tools/get-node-usage.tool");
const get_user_preferences_tool_1 = require("./tools/get-user-preferences.tool");
const get_workflow_details_tool_1 = require("./tools/get-workflow-details.tool");
const get_workflow_history_tool_1 = require("./tools/get-workflow-history.tool");
const get_workflow_version_tool_1 = require("./tools/get-workflow-version.tool");
const get_workflow_versions_diff_tool_1 = require("./tools/get-workflow-versions-diff.tool");
const instance_activity_tool_1 = require("./tools/instance-activity.tool");
const list_credentials_tool_1 = require("./tools/list-credentials.tool");
const list_n8n_gateway_services_tool_1 = require("./tools/list-n8n-gateway-services.tool");
const list_tags_tool_1 = require("./tools/list-tags.tool");
const move_workflows_to_folder_tool_1 = require("./tools/move-workflows-to-folder.tool");
const prepare_workflow_pin_data_tool_1 = require("./tools/prepare-workflow-pin-data.tool");
const publish_workflow_tool_1 = require("./tools/publish-workflow.tool");
const save_user_preference_tool_1 = require("./tools/save-user-preference.tool");
const search_executions_tool_1 = require("./tools/search-executions.tool");
const search_folders_tool_1 = require("./tools/search-folders.tool");
const search_projects_tool_1 = require("./tools/search-projects.tool");
const search_workflows_tool_1 = require("./tools/search-workflows.tool");
const test_workflow_tool_1 = require("./tools/test-workflow.tool");
const undo_user_preference_tool_1 = require("./tools/undo-user-preference.tool");
const unpublish_workflow_tool_1 = require("./tools/unpublish-workflow.tool");
const update_folder_tool_1 = require("./tools/update-folder.tool");
const update_user_preference_tool_1 = require("./tools/update-user-preference.tool");
const constants_2 = require("./tools/workflow-builder/constants");
const create_workflow_from_code_tool_1 = require("./tools/workflow-builder/create-workflow-from-code.tool");
const delete_workflow_tool_1 = require("./tools/workflow-builder/delete-workflow.tool");
const explore_node_resources_tool_1 = require("./tools/workflow-builder/explore-node-resources.tool");
const get_workflow_best_practices_tool_1 = require("./tools/workflow-builder/get-workflow-best-practices.tool");
const get_workflow_node_types_tool_1 = require("./tools/workflow-builder/get-workflow-node-types.tool");
const get_workflow_sdk_reference_tool_1 = require("./tools/workflow-builder/get-workflow-sdk-reference.tool");
const mcp_instructions_1 = require("./tools/workflow-builder/mcp-instructions");
const restore_workflow_version_tool_1 = require("./tools/workflow-builder/restore-workflow-version.tool");
const sdk_reference_content_1 = require("./tools/workflow-builder/sdk-reference-content");
const search_workflow_nodes_tool_1 = require("./tools/workflow-builder/search-workflow-nodes.tool");
const update_workflow_tool_1 = require("./tools/workflow-builder/update-workflow.tool");
const validate_node_tool_1 = require("./tools/workflow-builder/validate-node.tool");
const validate_workflow_code_tool_1 = require("./tools/workflow-builder/validate-workflow-code.tool");
function isInputRequired(result) {
    return result !== undefined && 'resultType' in result && result.resultType === 'input_required';
}
function getToolCallOutcome(result) {
    if (!result)
        return { status: 'success' };
    if (isInputRequired(result))
        return { status: 'success' };
    const structured = typeof result.structuredContent === 'object' && result.structuredContent !== null
        ? result.structuredContent
        : undefined;
    const errorMessage = typeof structured?.error === 'string' ? structured.error : undefined;
    if (result.isError !== true && structured?.status !== 'error' && errorMessage === undefined) {
        return { status: 'success' };
    }
    if (errorMessage !== undefined)
        return { status: 'error', errorMessage };
    for (const item of result.content ?? []) {
        if (item.type === 'text')
            return { status: 'error', errorMessage: item.text };
    }
    return { status: 'error' };
}
function getWorkflowId(source) {
    if (!source || typeof source !== 'object' || !('workflowId' in source))
        return undefined;
    const workflowId = source.workflowId;
    return typeof workflowId === 'string' ? workflowId : undefined;
}
let McpService = class McpService {
    constructor(logger, executionsConfig, instanceSettings, workflowFinderService, workflowService, urlService, credentialsService, activeExecutions, globalConfig, telemetry, workflowRunner, roleService, projectService, nodeCatalogService, workflowCreationService, nodeTypes, projectRepository, folderFinderService, sharedWorkflowRepository, executionRepository, executionService, executionListService, dataTableProxyService, collaborationService, nodeResourceExplorerService, tagService, licenseState, postHogClient, workflowHistoryService, workflowsConfig, workflowPublishedDataService, errorWorkflowValidationService, aiGatewayService, postSaveMetrics, moduleRegistry, eventService, folderService, aiPreferenceService, mcpConfig, executionRedactionServiceProxy, instanceWriteAccess) {
        this.logger = logger;
        this.executionsConfig = executionsConfig;
        this.instanceSettings = instanceSettings;
        this.workflowFinderService = workflowFinderService;
        this.workflowService = workflowService;
        this.urlService = urlService;
        this.credentialsService = credentialsService;
        this.activeExecutions = activeExecutions;
        this.globalConfig = globalConfig;
        this.telemetry = telemetry;
        this.workflowRunner = workflowRunner;
        this.roleService = roleService;
        this.projectService = projectService;
        this.nodeCatalogService = nodeCatalogService;
        this.workflowCreationService = workflowCreationService;
        this.nodeTypes = nodeTypes;
        this.projectRepository = projectRepository;
        this.folderFinderService = folderFinderService;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.executionRepository = executionRepository;
        this.executionService = executionService;
        this.executionListService = executionListService;
        this.dataTableProxyService = dataTableProxyService;
        this.collaborationService = collaborationService;
        this.nodeResourceExplorerService = nodeResourceExplorerService;
        this.tagService = tagService;
        this.licenseState = licenseState;
        this.postHogClient = postHogClient;
        this.workflowHistoryService = workflowHistoryService;
        this.workflowsConfig = workflowsConfig;
        this.workflowPublishedDataService = workflowPublishedDataService;
        this.errorWorkflowValidationService = errorWorkflowValidationService;
        this.aiGatewayService = aiGatewayService;
        this.postSaveMetrics = postSaveMetrics;
        this.moduleRegistry = moduleRegistry;
        this.eventService = eventService;
        this.folderService = folderService;
        this.aiPreferenceService = aiPreferenceService;
        this.mcpConfig = mcpConfig;
        this.executionRedactionServiceProxy = executionRedactionServiceProxy;
        this.instanceWriteAccess = instanceWriteAccess;
        this.pendingResponses = new Map();
    }
    recordDiscoveryConnection(userId, clientName, caller) {
        this.eventService.emit('experiment-mcp-client-connected', { userId, clientName, caller });
    }
    async resolveFeatureFlags(user) {
        const { mcpAppsEnabled } = this.globalConfig.endpoints;
        const [userFlags, instanceFlag] = await Promise.allSettled([
            this.postHogClient.getFeatureFlags(user),
            this.postHogClient.getFeatureFlagForInstance(api_types_1.INSTANCE_ACTIVITY_CONTEXT_FLAG),
        ]);
        const flags = userFlags.status === 'fulfilled' ? userFlags.value : {};
        return {
            credentialDescriptionsEnabled: flags[api_types_1.CREDENTIAL_DESCRIPTIONS_FLAG] === true,
            mcpApps: this.resolveMcpApps(mcpAppsEnabled, flags),
            instanceContextEnabled: instanceFlag.status === 'fulfilled' && instanceFlag.value === true,
            aiPreferencesEnabled: (0, mcp_tool_availability_1.arePreferenceToolsEnabled)(flags),
        };
    }
    resolveMcpApps(envOverride, flags) {
        if (envOverride)
            return { enabled: true, variant: 'env_override' };
        const raw = flags[api_types_1.MCP_APPS_FLAG];
        if (raw === api_types_1.MCP_APPS_VARIANT_ENABLED)
            return { enabled: true, variant: 'variant' };
        if (raw === api_types_1.MCP_APPS_VARIANT_CONTROL)
            return { enabled: false, variant: 'control' };
        return { enabled: false, variant: 'unassigned' };
    }
    buildMcpAppTelemetryConfig() {
        const { enabled, frontendConfig } = this.globalConfig.diagnostics;
        const disabledTelemetry = {
            enabled: false,
            writeKey: '',
            dataPlaneUrl: '',
            configUrl: '',
            instanceId: this.instanceSettings.instanceId,
            versionCli: constants_1.N8N_VERSION,
        };
        if (!enabled)
            return { telemetry: disabledTelemetry };
        const instanceBaseUrl = this.urlService.getInstanceBaseUrl();
        const restEndpoint = this.globalConfig.endpoints.rest;
        const [writeKey] = frontendConfig.split(';');
        const telemetry = {
            enabled,
            writeKey: writeKey ?? '',
            dataPlaneUrl: `${instanceBaseUrl}/${restEndpoint}/telemetry/proxy`,
            configUrl: `${instanceBaseUrl}/${restEndpoint}/telemetry/rudderstack`,
            instanceId: this.instanceSettings.instanceId,
            versionCli: constants_1.N8N_VERSION,
        };
        try {
            return { telemetry, instanceOrigin: new URL(telemetry.dataPlaneUrl).origin };
        }
        catch {
            this.logger.warn('Disabling MCP app telemetry because telemetry proxy URL is invalid', {
                dataPlaneUrl: telemetry.dataPlaneUrl,
            });
            return {
                telemetry: disabledTelemetry,
            };
        }
    }
    createToolRegistrar(server, user, clientInfo, auth) {
        const caller = auth?.caller;
        const telemetryCaller = caller?.authType === 'api_key' ? { authType: caller.authType } : caller;
        return (tool) => {
            const invoke = tool.handler;
            const instrumentedHandler = async (...handlerArgs) => {
                const workflowId = getWorkflowId(handlerArgs[0]);
                try {
                    const isProductionExecution = tool.name === 'execute_workflow' &&
                        (0, is_record_1.isRecord)(handlerArgs[0]) &&
                        handlerArgs[0].executionMode === 'production';
                    const isBlocked = this.instanceWriteAccess.isReadOnly() &&
                        tool.config.annotations?.readOnlyHint !== true &&
                        !isProductionExecution;
                    const result = isBlocked
                        ? {
                            isError: true,
                            content: [{ type: 'text', text: mcp_constants_1.MCP_INSTANCE_READ_ONLY_ERROR_MESSAGE }],
                        }
                        : await invoke(...handlerArgs);
                    const { status, errorMessage } = getToolCallOutcome(result);
                    if ((tool.name === 'create_workflow_from_code' || tool.name === 'update_workflow') &&
                        result &&
                        !isInputRequired(result)) {
                        this.eventService.emit('experiment-mcp-workflow-write-completed', {
                            userId: user.id,
                            toolName: tool.name,
                            status,
                            workflowId: getWorkflowId(result.structuredContent),
                            structuredContent: result.structuredContent,
                        });
                    }
                    this.eventService.emit('mcp-tool-called', {
                        user,
                        toolName: tool.name,
                        workflowId: workflowId ??
                            (isInputRequired(result) ? undefined : getWorkflowId(result?.structuredContent)),
                        status,
                        errorMessage,
                        ...telemetryCaller,
                        clientName: clientInfo?.name,
                    });
                    return result;
                }
                catch (error) {
                    this.eventService.emit('mcp-tool-called', {
                        user,
                        toolName: tool.name,
                        workflowId,
                        status: 'error',
                        errorMessage: error instanceof Error ? error.message : String(error),
                        ...telemetryCaller,
                        clientName: clientInfo?.name,
                    });
                    throw error;
                }
            };
            const { inputSchema, outputSchema, ...config } = tool.config;
            return server.registerTool(tool.name, {
                ...config,
                ...(inputSchema ? { inputSchema: (0, tool_schema_util_1.shapeToStandardSchema)(inputSchema) } : {}),
                ...(outputSchema ? { outputSchema: (0, tool_schema_util_1.shapeToStandardSchema)(outputSchema) } : {}),
            }, instrumentedHandler);
        };
    }
    createResourceRegistrar(server) {
        return (resource) => server.registerResource(resource.name, resource.uri, resource.config, resource.read);
    }
    async getServer(user, featureFlags, clientInfo, auth) {
        const { McpServer } = await (0, lazy_import_1.lazyImport)(async () => await import('@modelcontextprotocol/server'));
        const builderEnabled = this.globalConfig.endpoints.mcpBuilderEnabled;
        const n8nConnectAvailable = builderEnabled
            ? (await this.aiGatewayService.isAvailable()).available
            : false;
        const allowedToolNames = (0, mcp_scopes_1.getAllowedToolNames)(auth?.grantedScopes);
        const builderInstructionsEnabled = builderEnabled &&
            (allowedToolNames?.has(constants_2.MCP_CREATE_WORKFLOW_FROM_CODE_TOOL.toolName) ?? true);
        const agentsEnabled = (0, mcp_tool_availability_1.areAgentToolsAvailable)(this.globalConfig, this.moduleRegistry);
        const agentInstructionsEnabled = agentsEnabled && (allowedToolNames?.has(mcp_constants_1.MCP_CREATE_AGENT_TOOL_NAME) ?? true);
        const contextToolsAllowed = allowedToolNames?.has(get_instance_context_tool_1.GET_INSTANCE_CONTEXT_TOOL_NAME) ?? true;
        const userPreferencesInstructionsEnabled = featureFlags.aiPreferencesEnabled &&
            (allowedToolNames?.has(mcp_constants_1.MCP_GET_USER_PREFERENCES_TOOL_NAME) ?? true);
        const server = new McpServer({
            name: 'n8n MCP Server',
            version: agentsEnabled ? '1.2.0' : builderEnabled ? '1.1.0' : '1.0.0',
        }, {
            instructions: (0, mcp_instructions_1.getMcpInstructions)({
                isInstanceContextEnabled: featureFlags.instanceContextEnabled &&
                    this.moduleRegistry.isActive('instance-ai') &&
                    contextToolsAllowed,
                isBuilderEnabled: builderInstructionsEnabled,
                isN8nConnectAvailable: n8nConnectAvailable,
                isAgentsEnabled: agentInstructionsEnabled,
                isUserPreferencesEnabled: userPreferencesInstructionsEnabled,
                credentialDescriptionsEnabled: featureFlags.credentialDescriptionsEnabled === true,
            }),
        });
        const registerTool = this.createToolRegistrar(server, user, clientInfo, auth);
        const registerResource = this.createResourceRegistrar(server);
        const registerIfAllowed = (tool) => {
            if (allowedToolNames && !allowedToolNames.has(tool.name))
                return;
            registerTool(tool);
        };
        const workflowSearchTool = (0, search_workflows_tool_1.createSearchWorkflowsTool)(user, this.workflowService, this.folderFinderService, this.telemetry);
        registerIfAllowed(workflowSearchTool);
        const executeWorkflowTool = (0, execute_workflow_tool_1.createExecuteWorkflowTool)(user, this.workflowFinderService, this.workflowRunner, this.telemetry, this, this.workflowsConfig, this.workflowPublishedDataService);
        registerIfAllowed(executeWorkflowTool);
        const getExecutionTool = (0, get_execution_tool_1.createGetExecutionTool)(user, this.executionRepository, this.workflowFinderService, this.telemetry, this.executionRedactionServiceProxy);
        registerIfAllowed(getExecutionTool);
        const searchExecutionsTool = (0, search_executions_tool_1.createSearchExecutionsTool)(user, this.executionListService, this.workflowFinderService, this.telemetry);
        registerIfAllowed(searchExecutionsTool);
        const workflowDetailsTool = (0, get_workflow_details_tool_1.createWorkflowDetailsTool)(user, this.urlService.getWebhookBaseUrl(), this.workflowFinderService, this.credentialsService, this.nodeTypes, {
            webhook: this.globalConfig.endpoints.webhook,
            webhookTest: this.globalConfig.endpoints.webhookTest,
        }, this.telemetry, this.roleService, this.projectService, this.urlService.getTestWebhookBaseUrl());
        registerIfAllowed(workflowDetailsTool);
        const workflowHistoryTool = (0, get_workflow_history_tool_1.createGetWorkflowHistoryTool)(user, this.workflowFinderService, this.workflowHistoryService, this.telemetry);
        registerIfAllowed(workflowHistoryTool);
        const workflowVersionTool = (0, get_workflow_version_tool_1.createGetWorkflowVersionTool)(user, this.workflowFinderService, this.workflowHistoryService, this.telemetry);
        registerIfAllowed(workflowVersionTool);
        const workflowVersionsDiffTool = (0, get_workflow_versions_diff_tool_1.createGetWorkflowVersionsDiffTool)(user, this.workflowFinderService, this.workflowHistoryService, this.telemetry);
        registerIfAllowed(workflowVersionsDiffTool);
        const publishWorkflowTool = (0, publish_workflow_tool_1.createPublishWorkflowTool)(user, this.workflowFinderService, this.workflowService, this.telemetry, this.collaborationService);
        registerIfAllowed(publishWorkflowTool);
        const unpublishWorkflowTool = (0, unpublish_workflow_tool_1.createUnpublishWorkflowTool)(user, this.workflowFinderService, this.workflowService, this.telemetry, this.collaborationService);
        registerIfAllowed(unpublishWorkflowTool);
        const prepareTestPinDataTool = (0, prepare_workflow_pin_data_tool_1.createPrepareTestPinDataTool)(user, this.workflowFinderService, this.executionService, this.nodeTypes, this.telemetry, this.logger);
        registerIfAllowed(prepareTestPinDataTool);
        const testWorkflowTool = (0, test_workflow_tool_1.createTestWorkflowTool)(user, this.workflowFinderService, this.activeExecutions, this.workflowRunner, this.nodeTypes, this.telemetry, this);
        registerIfAllowed(testWorkflowTool);
        const listCredentialsTool = (0, list_credentials_tool_1.createListCredentialsTool)(user, this.credentialsService, this.telemetry, this.aiGatewayService, featureFlags.credentialDescriptionsEnabled === true);
        const listN8nGatewayServicesTool = (0, list_n8n_gateway_services_tool_1.createListN8nGatewayServicesTool)(user, this.aiGatewayService, this.telemetry);
        registerIfAllowed(listCredentialsTool);
        registerIfAllowed(listN8nGatewayServicesTool);
        if (!this.globalConfig.tags.disabled) {
            const listTagsTool = (0, list_tags_tool_1.createListTagsTool)(user, this.tagService, this.telemetry);
            registerIfAllowed(listTagsTool);
        }
        if (featureFlags.instanceContextEnabled) {
            const credentialGranted = allowedToolNames?.has('list_credentials') ?? true;
            const executionGranted = allowedToolNames?.has('get_workflow_execution') ?? true;
            if (this.moduleRegistry.isActive('instance-ai')) {
                const { InstanceContextService } = await import('../../modules/instance-ai/instance-context.service.js');
                const instanceContext = di_1.Container.get(InstanceContextService);
                registerIfAllowed((0, instance_activity_tool_1.createGetInstanceActivityTool)(user, instanceContext, this.telemetry, {
                    credentialGranted,
                    executionGranted,
                }));
                registerIfAllowed((0, instance_activity_tool_1.createExpandInstanceActivityTool)(user, instanceContext, this.telemetry, {
                    credentialGranted,
                    executionGranted,
                }));
                if (contextToolsAllowed) {
                    registerResource({
                        name: 'instance-context',
                        uri: get_instance_context_tool_1.INSTANCE_CONTEXT_RESOURCE_URI,
                        config: {
                            description: get_instance_context_tool_1.INSTANCE_CONTEXT_RESOURCE_DESCRIPTION,
                            mimeType: 'text/plain',
                            cacheHint: { ttlMs: 0, cacheScope: 'private' },
                        },
                        read: async () => {
                            const read = await (0, get_instance_context_tool_1.readInstanceContext)(user, instanceContext, {
                                executionGranted,
                            });
                            this.telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, {
                                user_id: user.id,
                                tool_name: get_instance_context_tool_1.GET_INSTANCE_CONTEXT_TOOL_NAME,
                                parameters: { surface: 'resource' },
                                results: { success: true, data: { outcome: read.kind } },
                            });
                            return {
                                contents: [
                                    {
                                        uri: get_instance_context_tool_1.INSTANCE_CONTEXT_RESOURCE_URI,
                                        mimeType: 'text/plain',
                                        text: (0, get_instance_context_tool_1.instanceContextText)(read),
                                    },
                                ],
                            };
                        },
                    });
                }
                registerIfAllowed((0, get_instance_context_tool_1.createGetInstanceContextTool)(user, instanceContext, this.telemetry, {
                    executionGranted,
                }));
            }
            const { WorkflowDependencyQueryService } = await import('../../modules/workflow-index/workflow-dependency-query.service.js');
            registerIfAllowed((0, get_node_usage_tool_1.createGetNodeUsageTool)(user, di_1.Container.get(WorkflowDependencyQueryService), this.telemetry));
        }
        const dataTableOps = this.dataTableProxyService.makeDataTableOperationsForUser(user);
        const searchDataTablesTool = (0, data_table_1.createSearchDataTablesTool)(user, dataTableOps, this.telemetry);
        registerIfAllowed(searchDataTablesTool);
        const createDataTableTool = (0, data_table_1.createCreateDataTableTool)(user, dataTableOps, this.telemetry);
        registerIfAllowed(createDataTableTool);
        const renameDataTableTool = (0, data_table_1.createRenameDataTableTool)(user, dataTableOps, this.telemetry);
        registerIfAllowed(renameDataTableTool);
        const addDataTableColumnTool = (0, data_table_1.createAddDataTableColumnTool)(user, dataTableOps, this.telemetry);
        registerIfAllowed(addDataTableColumnTool);
        const deleteDataTableColumnTool = (0, data_table_1.createDeleteDataTableColumnTool)(user, dataTableOps, this.telemetry);
        registerIfAllowed(deleteDataTableColumnTool);
        const renameDataTableColumnTool = (0, data_table_1.createRenameDataTableColumnTool)(user, dataTableOps, this.telemetry);
        registerIfAllowed(renameDataTableColumnTool);
        const addDataTableRowsTool = (0, data_table_1.createAddDataTableRowsTool)(user, dataTableOps, this.telemetry);
        registerIfAllowed(addDataTableRowsTool);
        const getDataTableRowsTool = (0, data_table_1.createGetDataTableRowsTool)(user, dataTableOps, this.telemetry);
        registerIfAllowed(getDataTableRowsTool);
        if (featureFlags.aiPreferencesEnabled) {
            registerIfAllowed((0, get_user_preferences_tool_1.createGetUserPreferencesTool)(user, this.aiPreferenceService, this.telemetry));
            registerIfAllowed((0, save_user_preference_tool_1.createSaveUserPreferenceTool)(user, this.aiPreferenceService, this.telemetry, this.urlService, this.logger));
            registerIfAllowed((0, update_user_preference_tool_1.createUpdateUserPreferenceTool)(user, this.aiPreferenceService, this.telemetry, this.urlService, this.logger));
            registerIfAllowed((0, undo_user_preference_tool_1.createUndoUserPreferenceTool)(user, this.aiPreferenceService, this.telemetry, this.logger));
        }
        if (builderEnabled) {
            await this.registerBuilderTools(server, user, dataTableOps, featureFlags, registerIfAllowed, registerResource, allowedToolNames, clientInfo);
        }
        if (agentsEnabled) {
            const { McpAgentToolsService } = await import('./tools/agents/agent-tools.service.js');
            di_1.Container.get(McpAgentToolsService).registerTools(registerIfAllowed, registerResource, user, allowedToolNames);
        }
        if ((0, mcp_tool_availability_1.areSkillToolsAvailable)(this.globalConfig, this.moduleRegistry)) {
            const { McpSkillToolsService } = await import('./tools/skills/skill-tools.service.js');
            di_1.Container.get(McpSkillToolsService).registerTools(registerIfAllowed, user);
        }
        return server;
    }
    async isInstallToolAvailable(user, allowedToolNames) {
        if (!allowedToolNames?.has(mcp_constants_1.INSTALL_COMMUNITY_NODE_TOOL.toolName))
            return false;
        const { CommunityPackagesConfig } = await import('../../modules/community-packages/community-packages.config.js');
        return (0, mcp_tool_availability_1.isCommunityNodeInstallAvailable)(this.moduleRegistry, di_1.Container.get(CommunityPackagesConfig), this.globalConfig, this.mcpConfig, user);
    }
    async registerInstallCommunityNodeTool(user, registerIfAllowed, installToolAvailable) {
        if (!installToolAvailable)
            return;
        const [{ CommunityNodeTypesService }, { CommunityPackagesLifecycleService }] = await Promise.all([
            import('../../modules/community-packages/community-node-types.service.js'),
            import('../../modules/community-packages/community-packages.lifecycle.service.js'),
        ]);
        const { createInstallCommunityNodeTool } = await import('./tools/workflow-builder/install-community-node.tool.js');
        registerIfAllowed(createInstallCommunityNodeTool(user, di_1.Container.get(CommunityNodeTypesService), di_1.Container.get(CommunityPackagesLifecycleService), this.nodeTypes, this.telemetry));
    }
    async registerBuilderTools(server, user, dataTableOps, featureFlags, registerIfAllowed, registerResource, allowedToolNames, clientInfo) {
        await this.nodeCatalogService.initialize();
        const communityNodeDiscovery = this.mcpConfig.communityNodeDiscoveryEnabled;
        const installToolAvailable = await this.isInstallToolAvailable(user, allowedToolNames);
        const uninstalledNodeOptions = communityNodeDiscovery
            ? {
                findUninstalledNodeTypes: async (nodeTypes) => await this.nodeCatalogService.findUninstalledNodeTypes(nodeTypes),
                installToolAvailable,
            }
            : {};
        const searchNodesTool = (0, search_workflow_nodes_tool_1.createSearchWorkflowNodesTool)(user, this.nodeCatalogService, this.telemetry, this.aiGatewayService, communityNodeDiscovery);
        registerIfAllowed(searchNodesTool);
        const getNodeTypesTool = (0, get_workflow_node_types_tool_1.createGetWorkflowNodeTypesTool)(user, this.nodeCatalogService, this.telemetry, this.aiGatewayService, communityNodeDiscovery);
        registerIfAllowed(getNodeTypesTool);
        const bestPracticesTool = (0, get_workflow_best_practices_tool_1.createGetWorkflowBestPracticesTool)(user, this.telemetry);
        registerIfAllowed(bestPracticesTool);
        const exploreNodeResourcesTool = (0, explore_node_resources_tool_1.createExploreNodeResourcesTool)(user, this.nodeResourceExplorerService, this.telemetry);
        registerIfAllowed(exploreNodeResourcesTool);
        const validateTool = (0, validate_workflow_code_tool_1.createValidateWorkflowCodeTool)(user, this.telemetry, this.nodeTypes);
        registerIfAllowed(validateTool);
        const validateNodeTool = (0, validate_node_tool_1.createValidateNodeTool)(user, this.telemetry);
        registerIfAllowed(validateNodeTool);
        const createTool = (0, create_workflow_from_code_tool_1.createCreateWorkflowFromCodeTool)(user, this.workflowCreationService, this.workflowFinderService, this.urlService, this.telemetry, this.nodeTypes, this.credentialsService, this.projectRepository, dataTableOps, this.aiGatewayService, uninstalledNodeOptions, this.logger, this.postSaveMetrics);
        const createToolAllowed = !allowedToolNames || allowedToolNames.has(createTool.name);
        if (featureFlags.mcpApps.enabled && createToolAllowed) {
            const appTelemetry = this.buildMcpAppTelemetryConfig();
            (0, server_1.registerWorkflowPreviewApp)(server, {
                instanceOrigin: appTelemetry.instanceOrigin,
                telemetry: appTelemetry.telemetry,
                onResourceRead: () => {
                    this.telemetry.track(mcp_constants_1.MCP_PREVIEW_RENDER_REQUESTED_EVENT, {
                        user_id: user.id,
                        client_name: clientInfo?.name,
                        client_version: clientInfo?.version,
                    });
                },
            });
            registerIfAllowed({
                ...createTool,
                config: {
                    ...createTool.config,
                    _meta: (0, server_1.mcpAppToolMeta)(server_1.WORKFLOW_PREVIEW_APP_URI),
                },
            });
        }
        else {
            registerIfAllowed(createTool);
        }
        const searchProjectsTool = (0, search_projects_tool_1.createSearchProjectsTool)(user, this.projectRepository, this.licenseState, this.telemetry);
        registerIfAllowed(searchProjectsTool);
        if (this.licenseState.isFoldersLicensed()) {
            const searchFoldersTool = (0, search_folders_tool_1.createSearchFoldersTool)(user, this.folderService, this.projectService, this.telemetry);
            registerIfAllowed(searchFoldersTool);
            const createFolderTool = (0, create_folder_tool_1.createCreateFolderTool)(user, this.folderService, this.projectService, this.telemetry);
            registerIfAllowed(createFolderTool);
            const updateFolderTool = (0, update_folder_tool_1.createUpdateFolderTool)(user, this.folderService, this.projectService, this.telemetry);
            registerIfAllowed(updateFolderTool);
            const moveWorkflowsToFolderTool = (0, move_workflows_to_folder_tool_1.createMoveWorkflowsToFolderTool)(user, this.workflowFinderService, this.workflowService, this.folderFinderService, this.telemetry);
            registerIfAllowed(moveWorkflowsToFolderTool);
        }
        const archiveTool = (0, delete_workflow_tool_1.createArchiveWorkflowTool)(user, this.workflowFinderService, this.workflowService, this.telemetry, this.collaborationService);
        registerIfAllowed(archiveTool);
        const updateTool = (0, update_workflow_tool_1.createUpdateWorkflowTool)(user, this.workflowFinderService, this.workflowService, this.urlService, this.telemetry, this.nodeTypes, this.credentialsService, this.sharedWorkflowRepository, this.collaborationService, dataTableOps, this.tagService, this.globalConfig, this.errorWorkflowValidationService, this.aiGatewayService, uninstalledNodeOptions, this.logger, this.postSaveMetrics);
        registerIfAllowed(updateTool);
        const restoreVersionTool = (0, restore_workflow_version_tool_1.createRestoreWorkflowVersionTool)(user, this.workflowFinderService, this.workflowHistoryService, this.workflowService, this.telemetry, this.collaborationService);
        registerIfAllowed(restoreVersionTool);
        await this.registerInstallCommunityNodeTool(user, registerIfAllowed, installToolAvailable);
        registerResource({
            name: 'workflow-sdk-reference',
            uri: 'n8n://workflow-sdk/reference',
            config: {
                description: 'Required n8n Workflow SDK reference for building workflows from code. Read this before writing workflow code.',
            },
            read: () => ({
                contents: [
                    {
                        uri: 'n8n://workflow-sdk/reference',
                        mimeType: 'text/plain',
                        text: (0, sdk_reference_content_1.getSdkReferenceContent)(),
                    },
                ],
            }),
        });
        const sdkRefTool = (0, get_workflow_sdk_reference_tool_1.createGetWorkflowSdkReferenceTool)(user, this.telemetry);
        registerIfAllowed(sdkRefTool);
    }
    get isQueueMode() {
        return this.executionsConfig.mode === 'queue';
    }
    createPendingResponse(executionId) {
        const deferred = (0, deferred_promise_1.createDeferredPromise)();
        this.pendingResponses.set(executionId, {
            executionId,
            promise: deferred,
            createdAt: new Date(),
        });
        return deferred;
    }
    handleWorkerResponse(executionId, runData) {
        const pending = this.pendingResponses.get(executionId);
        if (!pending) {
            this.logger.warn('Received MCP response for unknown execution', { executionId });
            return;
        }
        pending.promise.resolve(runData);
        this.pendingResponses.delete(executionId);
    }
    removePendingResponse(executionId) {
        if (this.pendingResponses.has(executionId)) {
            this.pendingResponses.delete(executionId);
            this.logger.debug('Removed pending MCP response', { executionId });
        }
    }
    cancelPendingExecution(executionId, reason = 'MCP execution cancelled') {
        const pending = this.pendingResponses.get(executionId);
        if (!pending) {
            this.logger.debug('No pending MCP execution to cancel', { executionId });
            return;
        }
        this.logger.debug('Cancelling pending MCP execution', { executionId, reason });
        const cancellationError = new n8n_workflow_1.ManualExecutionCancelledError(executionId);
        pending.promise.reject(cancellationError);
        this.pendingResponses.delete(executionId);
        if (this.activeExecutions.has(executionId)) {
            this.activeExecutions.stopExecution(executionId, cancellationError);
        }
    }
    cancelAllPendingExecutions(reason = 'MCP service shutdown') {
        const executionIds = Array.from(this.pendingResponses.keys());
        this.logger.debug('Cancelling all pending MCP executions', {
            count: executionIds.length,
            reason,
        });
        for (const executionId of executionIds) {
            this.cancelPendingExecution(executionId, reason);
        }
    }
    get pendingExecutionCount() {
        return this.pendingResponses.size;
    }
};
exports.McpService = McpService;
exports.McpService = McpService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.ExecutionsConfig, n8n_core_1.InstanceSettings, workflow_finder_service_1.WorkflowFinderService, workflow_service_1.WorkflowService, backend_services_1.UrlService, credentials_service_1.CredentialsService, active_executions_1.ActiveExecutions, config_1.GlobalConfig, telemetry_1.Telemetry, workflow_runner_1.WorkflowRunner, backend_services_1.RoleService, project_service_ee_1.ProjectService, node_catalog_1.NodeCatalogService, workflow_creation_service_1.WorkflowCreationService, node_types_1.NodeTypes, db_1.ProjectRepository, backend_services_1.FolderFinderService, db_1.SharedWorkflowRepository, db_1.ExecutionRepository, execution_service_1.ExecutionService, execution_list_service_1.ExecutionListService, data_table_proxy_service_1.DataTableProxyService, collaboration_service_1.CollaborationService, node_resource_explorer_service_1.NodeResourceExplorerService, tag_service_1.TagService, backend_common_1.LicenseState, posthog_1.PostHogClient, workflow_history_service_1.WorkflowHistoryService, config_1.WorkflowsConfig, backend_services_1.WorkflowPublishedDataService, error_workflow_validation_service_1.ErrorWorkflowValidationService, ai_gateway_service_1.AiGatewayService, mcp_post_save_metrics_service_1.McpPostSaveMetricsService, backend_common_1.ModuleRegistry, backend_services_1.EventService, folder_service_1.FolderService, ai_preference_service_1.AiPreferenceService, mcp_config_1.McpConfig, backend_services_1.ExecutionRedactionServiceProxy, backend_services_1.InstanceWriteAccessService])
], McpService);
//# sourceMappingURL=mcp.service.js.map