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
exports.McpAgentToolsService = void 0;
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const json_schema_1 = require("@n8n/ai-utilities/json-schema");
const api_types_1 = require("@n8n/api-types");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const credentials_service_1 = require("../../../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const agent_config_service_1 = require("../../../../modules/agents/agent-config.service");
const agent_custom_tools_service_1 = require("../../../../modules/agents/agent-custom-tools.service");
const agent_integration_management_service_1 = require("../../../../modules/agents/agent-integration-management.service");
const agent_integration_persistence_service_1 = require("../../../../modules/agents/agent-integration-persistence.service");
const agent_model_catalog_service_1 = require("../../../../modules/agents/agent-model-catalog.service");
const agent_publish_service_1 = require("../../../../modules/agents/agent-publish.service");
const agent_skill_refs_service_1 = require("../../../../modules/agents/agent-skill-refs.service");
const agent_skills_service_1 = require("../../../../modules/agents/agent-skills.service");
const skill_name_taken_error_1 = require("../../../../modules/agents/skills/skill-name-taken.error");
const agent_task_service_1 = require("../../../../modules/agents/agent-task.service");
const agent_test_run_service_1 = require("../../../../modules/agents/agent-test-run.service");
const agent_validation_service_1 = require("../../../../modules/agents/agent-validation.service");
const agents_service_1 = require("../../../../modules/agents/agents.service");
const attachable_workflows_service_1 = require("../../../../modules/agents/attachable-workflows.service");
const agent_config_composition_1 = require("../../../../modules/agents/json-config/agent-config-composition");
const mcp_client_factory_1 = require("../../../../modules/agents/json-config/mcp-client-factory");
const sanitize_unknown_agent_credentials_1 = require("../../../../modules/agents/json-config/sanitize-unknown-agent-credentials");
const model_catalog_1 = require("../../../../modules/agents/model-catalog");
const agent_secure_runtime_1 = require("../../../../modules/agents/runtime/agent-secure-runtime");
const agent_config_hash_1 = require("../../../../modules/agents/utils/agent-config-hash");
const agent_credential_provider_1 = require("../../../../modules/agents/utils/agent-credential-provider");
const mcp_registry_service_1 = require("../../../../modules/mcp-registry/registry/mcp-registry.service");
const node_types_1 = require("../../../../node-types");
const oauth_service_1 = require("../../../../oauth/oauth.service");
const check_access_1 = require("../../../../permissions.ee/check-access");
const backend_services_1 = require("@n8n/backend-services");
const telemetry_1 = require("../../../../telemetry");
const ai_proxy_fetch_1 = require("../../../../utils/ai-proxy-fetch");
const agent_slack_setup_1 = require("./agent-slack-setup");
const agent_reference_1 = require("./agent-reference");
const mcp_constants_1 = require("../../mcp.constants");
const tool_result_utils_1 = require("../tool-result.utils");
const MCP_SERVER_DISCOVERY_LIMIT = 20;
const MODEL_DISCOVERY_LIMIT = 50;
const INTEGRATIONS_NOT_IN_CONFIG_MESSAGE = "Integrations can't be changed through config.replace or config.patch. Use update_agent_integration to configure or disconnect Slack, Telegram, or Linear. Configuration never publishes the Agent; an unpublished Agent's channel stays inactive until publish_agent is called.";
const MCP_AGENT_CONFIG_MESSAGES = {
    emptyInstructionsFollowUp: 'retrying the mutation.',
    dynamicSelectorFollowUp: 'Ask the user for the concrete value and write it into nodeParameters as a literal.',
};
function integrationsField(config) {
    return (0, is_record_1.isRecord)(config) ? config.integrations : undefined;
}
function collectClearedCredentialIds(original, sanitized, ids) {
    if (Array.isArray(original) && Array.isArray(sanitized)) {
        original.forEach((entry, index) => collectClearedCredentialIds(entry, sanitized[index], ids));
        return;
    }
    if (!(0, is_record_1.isRecord)(original) || !(0, is_record_1.isRecord)(sanitized))
        return;
    for (const [key, value] of Object.entries(original)) {
        if (typeof value === 'string' && value !== '' && sanitized[key] === '') {
            ids.add(value);
            continue;
        }
        collectClearedCredentialIds(value, sanitized[key], ids);
    }
}
function integrationsChanged(current, next) {
    return (JSON.stringify(current.integrations ?? []) !== JSON.stringify(integrationsField(next) ?? []));
}
const TELEGRAM_SETTINGS_JSON_SCHEMA = (0, json_schema_1.zodSchemaToJsonSchema)(api_types_1.AgentTelegramSettingsSchema);
const httpUrlSchema = zod_1.z
    .string()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), { message: 'Must be a valid HTTP(S) URL' });
const mcpEndpointUrlSchema = zod_1.z.union([httpUrlSchema, zod_1.z.string().startsWith('=')]);
const agentIdentityShape = {
    agentId: zod_1.z.string().min(1).describe('Agent ID'),
};
const getAgentInput = {
    ...agentIdentityShape,
    versionId: zod_1.z
        .string()
        .min(1)
        .optional()
        .describe('Read a published version snapshot instead of the draft, e.g. the activeVersionId. Snapshots are read-only, so the response has no configHash.'),
};
const publishAgentInput = {
    ...agentIdentityShape,
    versionId: zod_1.z
        .string()
        .min(1)
        .optional()
        .describe('Republish a previously published version instead of the current draft. The draft is left untouched.'),
};
const revertAgentInput = {
    ...agentIdentityShape,
    versionId: zod_1.z
        .string()
        .min(1)
        .optional()
        .describe('Published version to restore the draft from; defaults to the currently published version'),
};
const listAgentVersionsInput = {
    ...agentIdentityShape,
    limit: zod_1.z.number().int().min(1).max(100).optional().default(20),
    offset: zod_1.z.number().int().min(0).optional().default(0),
};
const searchAgentsInput = {
    projectId: zod_1.z.string().min(1).optional().describe('Restrict results to one project'),
    query: zod_1.z.string().optional().describe('Filter by Agent name'),
    publishedOnly: zod_1.z.boolean().optional().default(false),
    excludeAgentId: zod_1.z.string().optional().describe('Agent ID to omit, useful for sub-agent search'),
    limit: zod_1.z.number().int().min(1).max(100).optional().default(50),
};
const initialAgentConfigSchema = api_types_1.AgentJsonConfigBaseSchema.omit({
    name: true,
    skills: true,
    tasks: true,
    integrations: true,
}).superRefine((config, ctx) => {
    if (config.credential?.trim() && (0, api_types_1.isDraftAgentConfig)(config)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['credential'],
            message: 'A credential requires a model to be set',
        });
    }
    if (config.tools?.some((tool) => tool.type === 'custom')) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['tools'],
            message: 'Create custom tools with mutate_agent after creating the Agent',
        });
    }
});
const createAgentInput = {
    projectId: zod_1.z.string().min(1),
    name: zod_1.z.string().trim().min(1).max(128),
    config: initialAgentConfigSchema
        .optional()
        .describe('Optional initial Agent config without name, skills, tasks, or custom tools. The top-level name is injected into the config.'),
};
const jsonPatchValueSchema = zod_1.z.union([
    zod_1.z.null(),
    zod_1.z.boolean(),
    zod_1.z.number(),
    zod_1.z.string(),
    zod_1.z.array(zod_1.z.unknown()),
    zod_1.z.record(zod_1.z.unknown()),
]);
const jsonPatchOperationSchema = zod_1.z.discriminatedUnion('op', [
    zod_1.z.object({ op: zod_1.z.literal('add'), path: zod_1.z.string(), value: jsonPatchValueSchema }),
    zod_1.z.object({ op: zod_1.z.literal('remove'), path: zod_1.z.string() }),
    zod_1.z.object({ op: zod_1.z.literal('replace'), path: zod_1.z.string(), value: jsonPatchValueSchema }),
    zod_1.z.object({ op: zod_1.z.literal('move'), from: zod_1.z.string(), path: zod_1.z.string() }),
    zod_1.z.object({ op: zod_1.z.literal('copy'), from: zod_1.z.string(), path: zod_1.z.string() }),
    zod_1.z.object({ op: zod_1.z.literal('test'), path: zod_1.z.string(), value: jsonPatchValueSchema }),
]);
const mutationOperationSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({ type: zod_1.z.literal('config.replace'), config: zod_1.z.record(zod_1.z.unknown()) }),
    zod_1.z.object({
        type: zod_1.z.literal('config.patch'),
        patch: zod_1.z.array(jsonPatchOperationSchema).min(1),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('skill.upsert'),
        skillId: zod_1.z.string().optional(),
        baseSkillHash: zod_1.z
            .string()
            .optional()
            .describe('skillHashes[skillId] from get_agent; when set, the replace is rejected if the skill changed since'),
        skill: api_types_1.agentSkillSchema,
    }),
    zod_1.z.object({ type: zod_1.z.literal('skill.delete'), skillId: zod_1.z.string().min(1) }),
    zod_1.z.object({
        type: zod_1.z.literal('task.upsert'),
        taskId: zod_1.z.string().optional(),
        task: api_types_1.agentTaskSchema,
        enabled: zod_1.z.boolean().optional(),
    }),
    zod_1.z.object({ type: zod_1.z.literal('task.delete'), taskId: zod_1.z.string().min(1) }),
    zod_1.z.object({ type: zod_1.z.literal('customTool.upsert'), code: zod_1.z.string().min(1) }),
    zod_1.z.object({ type: zod_1.z.literal('customTool.delete'), toolId: zod_1.z.string().min(1) }),
]);
const mutateAgentInput = {
    ...agentIdentityShape,
    baseConfigHash: zod_1.z
        .string()
        .min(1)
        .describe('Latest configHash returned by get_agent or a successful mutation'),
    operation: mutationOperationSchema,
};
const discoverAssetsInput = {
    projectId: zod_1.z.string().min(1),
    kind: zod_1.z.enum(['models', 'integrations', 'workflows', 'subagents', 'mcpServers']),
    query: zod_1.z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe('Optional filter for model IDs, workflows, subagents, or MCP servers'),
    provider: zod_1.z
        .enum(api_types_1.AGENT_MODEL_PROVIDERS)
        .optional()
        .describe('Model provider for kind=models; omit to get a provider summary without model lists'),
    credentialId: zod_1.z
        .string()
        .min(1)
        .optional()
        .describe('Accessible credential used to verify models for the selected provider'),
    excludeAgentId: zod_1.z.string().optional().describe('Agent to omit when kind=subagents'),
};
const verifyMcpServerInput = {
    projectId: zod_1.z.string().min(1),
    name: zod_1.z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-zA-Z0-9_-]+$/),
    url: mcpEndpointUrlSchema.describe('HTTP(S) MCP server endpoint, or a registry `$self`-expression when metadata.nodeTypeName is set'),
    transport: zod_1.z.enum(['sse', 'streamableHttp']).optional().default('streamableHttp'),
    authentication: zod_1.z
        .union([api_types_1.McpAuthenticationSchemaTypes, api_types_1.McpOAuth2CredentialTypeSchema])
        .optional()
        .default('none')
        .describe('Authentication method; every value other than none requires credential'),
    credential: zod_1.z
        .string()
        .min(1)
        .optional()
        .describe('Accessible credential ID; required when authentication is not none'),
    metadata: zod_1.z.object({ nodeTypeName: zod_1.z.string().optional() }).optional(),
    connectionTimeoutMs: zod_1.z.number().int().min(1).max(120_000).optional(),
};
const updateIntegrationInput = {
    ...agentIdentityShape,
    action: zod_1.z.enum(['connect', 'disconnect']),
    type: zod_1.z.string().min(1).describe('Integration type returned by discover_agent_assets'),
    credentialId: zod_1.z
        .string()
        .min(1)
        .optional()
        .describe('Accessible credential for this integration. Required for disconnect and for non-Slack connect operations. Omit it to connect Slack through managed setup'),
    managerCredentialId: zod_1.z
        .string()
        .min(1)
        .optional()
        .describe('Slack managed setup only: the managerCredentialId returned by a Slack connect call without credentialId'),
    workspaceId: zod_1.z
        .string()
        .min(1)
        .optional()
        .describe('Slack managed setup only: the workspaceId returned by a Slack connect call without credentialId'),
    settings: zod_1.z
        .record(zod_1.z.unknown())
        .optional()
        .describe('Integration settings; required for Telegram connect operations'),
    replacesCredentialId: zod_1.z
        .string()
        .min(1)
        .optional()
        .describe('On connect, the credential of the same type this one takes over from. Swaps both in one operation instead of a separate disconnect'),
};
const callAgentRequestSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z
        .object({
        type: zod_1.z.literal('message'),
        message: zod_1.z.string().trim().min(1),
        sessionId: zod_1.z
            .string()
            .trim()
            .optional()
            .describe('Exact sessionId from an earlier call_agent result. Omit it to start a new conversation. An unknown sessionId starts a new conversation and the result has a sessionNote.'),
    })
        .strict(),
    zod_1.z
        .object({
        type: zod_1.z.literal('approval'),
        approved: zod_1.z.boolean(),
        continuation: agent_test_run_service_1.agentTestRunContinuationSchema,
    })
        .strict(),
]);
const callAgentInput = {
    ...agentIdentityShape,
    request: callAgentRequestSchema,
};
const emptyInput = {};
function integrationSetupPath(input) {
    if (input.action === 'disconnect' || input.credentialId)
        return 'credential';
    return input.managerCredentialId || input.workspaceId ? 'managed_install' : 'managed_discovery';
}
let McpAgentToolsService = class McpAgentToolsService {
    constructor(telemetry, credentialsService, agentsService, agentConfigService, agentValidationService, agentPublishService, agentSkillsService, agentTaskService, agentTestRunService, agentCustomToolsService, agentSecureRuntime, integrationPersistenceService, integrationManagementService, agentModelCatalogService, attachableWorkflowsService, mcpRegistryService, nodeTypes, oauthService, outboundHttp, urlService, projectScopeService, slackSetup, agentSkillRefs) {
        this.telemetry = telemetry;
        this.credentialsService = credentialsService;
        this.agentsService = agentsService;
        this.agentConfigService = agentConfigService;
        this.agentValidationService = agentValidationService;
        this.agentPublishService = agentPublishService;
        this.agentSkillsService = agentSkillsService;
        this.agentTaskService = agentTaskService;
        this.agentTestRunService = agentTestRunService;
        this.agentCustomToolsService = agentCustomToolsService;
        this.agentSecureRuntime = agentSecureRuntime;
        this.integrationPersistenceService = integrationPersistenceService;
        this.integrationManagementService = integrationManagementService;
        this.agentModelCatalogService = agentModelCatalogService;
        this.attachableWorkflowsService = attachableWorkflowsService;
        this.mcpRegistryService = mcpRegistryService;
        this.nodeTypes = nodeTypes;
        this.oauthService = oauthService;
        this.outboundHttp = outboundHttp;
        this.urlService = urlService;
        this.projectScopeService = projectScopeService;
        this.slackSetup = slackSetup;
        this.agentSkillRefs = agentSkillRefs;
    }
    registerTools(registerTool, registerResource, user, allowedToolNames) {
        const isCallAgentAvailable = allowedToolNames?.has(mcp_constants_1.MCP_CALL_AGENT_TOOL_NAME) ?? true;
        const registerIfAllowed = (tool) => {
            if (allowedToolNames && !allowedToolNames.has(tool.name))
                return;
            registerTool(tool);
        };
        registerIfAllowed(this.searchAgentsTool(user));
        registerIfAllowed(this.getAgentTool(user));
        registerIfAllowed(this.createAgentTool(user));
        registerIfAllowed(this.mutateAgentTool(user));
        registerIfAllowed(this.validateAgentTool(user, isCallAgentAvailable));
        registerIfAllowed(this.callAgentTool(user));
        registerIfAllowed(this.publishAgentTool(user));
        registerIfAllowed(this.unpublishAgentTool(user));
        registerIfAllowed(this.revertAgentTool(user));
        registerIfAllowed(this.listAgentVersionsTool(user));
        registerIfAllowed(this.deleteAgentTool(user));
        registerIfAllowed(this.discoverAssetsTool(user));
        registerIfAllowed(this.verifyMcpServerTool(user));
        registerIfAllowed(this.updateIntegrationTool(user));
        registerIfAllowed(this.referenceTool(user));
        if (allowedToolNames && !allowedToolNames.has('get_agent_builder_reference'))
            return;
        registerResource({
            name: 'agent-builder-reference',
            uri: agent_reference_1.AGENT_BUILDER_REFERENCE_URI,
            config: { description: 'Reference for creating and managing n8n Agents through MCP.' },
            read: () => ({
                contents: [
                    {
                        uri: agent_reference_1.AGENT_BUILDER_REFERENCE_URI,
                        mimeType: 'text/markdown',
                        text: agent_reference_1.AGENT_BUILDER_REFERENCE,
                    },
                ],
            }),
        });
    }
    searchAgentsTool(user) {
        return {
            name: 'search_agents',
            config: {
                description: 'Search Agents the current user can access. Use excludeAgentId to discover saved sub-agents. Other agent tools only operate on agents with availableInMCP: true.',
                inputSchema: searchAgentsInput,
                annotations: {
                    title: 'Search Agents',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
            },
            handler: async (input) => await this.run(user, 'search_agents', { projectId: input.projectId }, async () => {
                let projectIds;
                if (input.projectId) {
                    await this.assertScope(user, input.projectId, 'agent:list');
                    projectIds = [input.projectId];
                }
                else {
                    projectIds = await this.projectScopeService.getProjectIds(user, ['agent:list']);
                }
                const agents = await this.agentsService.findSummariesInProjects(projectIds, {
                    query: input.query?.trim() || undefined,
                    publishedOnly: input.publishedOnly,
                    excludeAgentId: input.excludeAgentId,
                    limit: input.limit,
                });
                const data = agents.map((agent) => ({
                    id: agent.id,
                    name: agent.name,
                    projectId: agent.projectId,
                    published: agent.activeVersionId !== null,
                    availableInMCP: agent.availableInMCP,
                    updatedAt: agent.updatedAt.toISOString(),
                }));
                return { ok: true, data, count: data.length };
            }),
        };
    }
    getAgentTool(user) {
        return {
            name: 'get_agent',
            config: {
                description: 'Read an Agent draft, sidecar resources, runnable state, and configHash. Call before mutate_agent. Pass versionId to inspect a published version snapshot instead of the draft.',
                inputSchema: getAgentInput,
                annotations: {
                    title: 'Get Agent',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
            },
            handler: async ({ agentId, versionId }) => await this.run(user, 'get_agent', { agentId, ...(versionId ? { versionId } : {}) }, async () => {
                const agent = await this.resolveAgent(user, agentId);
                await this.assertScope(user, agent.projectId, 'agent:read');
                const snapshot = versionId
                    ? await this.getAgentVersionSnapshot(agent.projectId, agentId, versionId)
                    : await this.getAgentSnapshot(user, agent);
                return { ok: true, ...snapshot };
            }),
        };
    }
    createAgentTool(user) {
        return {
            name: mcp_constants_1.MCP_CREATE_AGENT_TOOL_NAME,
            config: {
                description: 'Create an Agent draft, optionally with its initial model, credential, instructions, and ordinary tool configuration. Returns its n8n editor URL. Use mutate_agent afterward for skills, tasks, and custom tools.',
                inputSchema: createAgentInput,
                annotations: {
                    title: 'Create Agent',
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false,
                    openWorldHint: false,
                },
            },
            handler: async ({ projectId, name, config }) => await this.run(user, 'create_agent', { projectId }, async () => {
                await this.assertScope(user, projectId, 'agent:create');
                const initialConfig = config ? { ...config, name } : undefined;
                if (initialConfig) {
                    const validation = await this.agentConfigService.validateConfig(initialConfig);
                    if (!validation.valid) {
                        throw new n8n_workflow_1.UserError(`Invalid initial Agent config: ${validation.error}`);
                    }
                    await this.assertAccessibleCredentials(initialConfig, user, projectId);
                }
                const agent = await this.agentsService.create(projectId, name, {
                    actor: { kind: 'user', user },
                    availableInMCP: true,
                });
                let configHash;
                let versionId = agent.versionId;
                try {
                    if (initialConfig) {
                        const result = await this.agentConfigService.updateConfig(agent.id, projectId, initialConfig, user, {
                            baseConfigHash: (0, agent_config_hash_1.getAgentConfigHash)(await this.configFromEntity(agent)),
                            modifiedBy: 'mcp',
                        });
                        configHash = (0, agent_config_hash_1.getAgentConfigHash)(result.config);
                        versionId = result.versionId;
                    }
                    else {
                        configHash = await this.fetchConfigHash(projectId, agent.id);
                    }
                }
                catch (error) {
                    await this.agentsService.delete(agent.id, projectId);
                    throw error;
                }
                return {
                    ok: true,
                    agent: {
                        id: agent.id,
                        name: agent.name,
                        projectId: agent.projectId,
                        published: false,
                        versionId,
                        activeVersionId: agent.activeVersionId,
                    },
                    configHash,
                    url: this.getAgentUrl(projectId, agent.id),
                };
            }),
        };
    }
    mutateAgentTool(user) {
        return {
            name: 'mutate_agent',
            config: {
                description: 'Apply one config, skill, task, or custom-tool mutation to an Agent draft. The operation fields sit directly on the operation object (no value wrapper), e.g. { "type": "config.patch", "patch": [...] }. Returns the next configHash for subsequent mutations.',
                inputSchema: mutateAgentInput,
                annotations: {
                    title: 'Mutate Agent',
                    readOnlyHint: false,
                    destructiveHint: true,
                    idempotentHint: false,
                    openWorldHint: false,
                },
            },
            handler: async (input) => await this.run(user, 'mutate_agent', { agentId: input.agentId, type: input.operation.type }, async () => {
                const agent = await this.resolveAgent(user, input.agentId);
                const projectId = agent.projectId;
                await this.assertScope(user, projectId, 'agent:update');
                const config = await this.configFromEntity(agent);
                const configHash = (0, agent_config_hash_1.getAgentConfigHash)(config);
                if (configHash !== input.baseConfigHash) {
                    return {
                        ok: false,
                        code: 'stale_config',
                        agentId: input.agentId,
                        configHash,
                        message: 'Call get_agent before retrying the mutation.',
                    };
                }
                let mutation;
                try {
                    mutation = await this.applyMutation(user, input, config, projectId, configHash);
                }
                catch (error) {
                    if (error instanceof skill_name_taken_error_1.SkillNameTakenError) {
                        return {
                            ok: false,
                            code: 'skill_name_taken',
                            agentId: input.agentId,
                            configHash: await this.fetchConfigHash(projectId, input.agentId),
                            message: (0, skill_name_taken_error_1.skillNameTakenToolMessage)(error.skillName),
                        };
                    }
                    if (!(error instanceof errors_1.ConflictError))
                        throw error;
                    const latestConfigHash = await this.fetchConfigHash(projectId, input.agentId);
                    if (latestConfigHash === configHash)
                        throw error;
                    return {
                        ok: false,
                        code: 'stale_config',
                        agentId: input.agentId,
                        configHash: latestConfigHash,
                        message: 'Call get_agent before retrying the mutation.',
                    };
                }
                const { resource, config: newConfig } = mutation;
                return {
                    ok: true,
                    agentId: input.agentId,
                    operation: input.operation.type,
                    configHash: newConfig
                        ? (0, agent_config_hash_1.getAgentConfigHash)(newConfig)
                        : await this.fetchConfigHash(projectId, input.agentId),
                    ...(resource ? { resource } : {}),
                };
            }),
        };
    }
    validateAgentTool(user, isCallAgentAvailable) {
        return {
            name: 'validate_agent',
            config: {
                description: 'Validate an Agent draft, sidecar references, and user-accessible credentials. Returns its n8n editor URL.',
                inputSchema: agentIdentityShape,
                annotations: {
                    title: 'Validate Agent',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
            },
            handler: async ({ agentId }) => await this.run(user, 'validate_agent', { agentId }, async () => {
                const agent = await this.resolveAgent(user, agentId);
                await this.assertScope(user, agent.projectId, 'agent:read');
                const validation = await this.validateAgent(user, agent);
                const shouldSuggestCallAgent = validation.valid &&
                    isCallAgentAvailable &&
                    (await (0, check_access_1.userHasScopes)(user, ['agent:execute'], false, { projectId: agent.projectId }));
                return {
                    ok: true,
                    ...validation,
                    url: this.getAgentUrl(agent.projectId, agentId),
                    ...(shouldSuggestCallAgent
                        ? {
                            nextStep: {
                                tool: mcp_constants_1.MCP_CALL_AGENT_TOOL_NAME,
                                reason: 'Test the runnable draft before reporting it ready',
                            },
                        }
                        : {}),
                };
            }),
        };
    }
    callAgentTool(user) {
        return {
            name: mcp_constants_1.MCP_CALL_AGENT_TOOL_NAME,
            config: {
                description: 'Test an Agent draft through built-in Preview chat. Start or continue a conversation with a message request, or resume one returned approval after the human decides. This uses real tools and credentials, so external side effects are possible.',
                inputSchema: callAgentInput,
                annotations: {
                    title: 'Call Agent',
                    readOnlyHint: false,
                    destructiveHint: true,
                    idempotentHint: false,
                    openWorldHint: true,
                },
            },
            handler: async (input, extra) => {
                const abortSignal = (0, is_record_1.isRecord)(extra) && extra.signal instanceof AbortSignal ? extra.signal : undefined;
                return await this.run(user, mcp_constants_1.MCP_CALL_AGENT_TOOL_NAME, { agentId: input.agentId }, async () => {
                    const agent = await this.resolveAgent(user, input.agentId);
                    await this.assertScope(user, agent.projectId, 'agent:execute');
                    return await this.callAgent(user, agent, input.request, abortSignal);
                });
            },
        };
    }
    publishAgentTool(user) {
        return {
            name: 'publish_agent',
            config: {
                description: 'Publish a valid Agent draft and activate its tasks and integrations. Pass versionId to republish a previously published version instead. Only call after the user explicitly requests or confirms publication; completing a build does not imply approval.',
                inputSchema: publishAgentInput,
                annotations: {
                    title: 'Publish Agent',
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            handler: async ({ agentId, versionId }) => await this.run(user, 'publish_agent', { agentId, ...(versionId ? { versionId } : {}) }, async () => {
                const agent = await this.resolveAgent(user, agentId);
                const projectId = agent.projectId;
                await this.assertScope(user, projectId, 'agent:publish');
                if (!versionId) {
                    const validation = await this.validateAgent(user, agent);
                    if (!validation.valid) {
                        throw new n8n_workflow_1.UserError(`Agent is not runnable: ${[...validation.errors, ...validation.missing].join(', ')}`);
                    }
                }
                const { agent: publishedAgent } = await this.agentPublishService.publishAgent(agentId, projectId, user, { by: 'mcp', trigger: 'explicit' }, versionId);
                return {
                    ok: true,
                    agentId,
                    published: true,
                    versionId: publishedAgent.versionId,
                    activeVersionId: publishedAgent.activeVersionId,
                    url: this.getAgentUrl(projectId, agentId),
                };
            }),
        };
    }
    revertAgentTool(user) {
        return {
            name: 'revert_agent',
            config: {
                description: 'Restore an Agent draft from a published version, overwriting the draft config, skills, tasks, and custom tools. Does not publish. Inspect the version with get_agent first; the response returns the new configHash.',
                inputSchema: revertAgentInput,
                annotations: {
                    title: 'Revert Agent',
                    readOnlyHint: false,
                    destructiveHint: true,
                    idempotentHint: true,
                    openWorldHint: false,
                },
            },
            handler: async ({ agentId, versionId }) => await this.run(user, 'revert_agent', { agentId, ...(versionId ? { versionId } : {}) }, async () => {
                const { projectId } = await this.resolveAgent(user, agentId);
                await this.assertScope(user, projectId, 'agent:update');
                const agent = versionId
                    ? await this.agentPublishService.revertToVersion(agentId, projectId, versionId, user, 'mcp')
                    : await this.agentPublishService.revertToPublishedAgent(agentId, projectId, user, 'mcp');
                return {
                    ok: true,
                    agentId,
                    versionId: agent.versionId,
                    activeVersionId: agent.activeVersionId,
                    configHash: (0, agent_config_hash_1.getAgentConfigHash)(await this.configFromEntity(agent)),
                    url: this.getAgentUrl(projectId, agentId),
                };
            }),
        };
    }
    listAgentVersionsTool(user) {
        return {
            name: 'list_agent_versions',
            config: {
                description: 'List the publish history of an Agent, newest first. Pass a versionId to get_agent to inspect a version before revert_agent or publish_agent.',
                inputSchema: listAgentVersionsInput,
                annotations: {
                    title: 'List Agent Versions',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
            },
            handler: async ({ agentId, limit, offset }) => await this.run(user, 'list_agent_versions', { agentId }, async () => {
                const { projectId } = await this.resolveAgent(user, agentId);
                await this.assertScope(user, projectId, 'agent:read');
                const versions = await this.agentPublishService.listPublishHistory(agentId, projectId, limit, offset);
                return { ok: true, data: versions, count: versions.length };
            }),
        };
    }
    unpublishAgentTool(user) {
        return {
            name: 'unpublish_agent',
            config: {
                description: 'Unpublish an Agent and stop its live tasks and integrations.',
                inputSchema: agentIdentityShape,
                annotations: {
                    title: 'Unpublish Agent',
                    readOnlyHint: false,
                    destructiveHint: true,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            handler: async ({ agentId }) => await this.run(user, 'unpublish_agent', { agentId }, async () => {
                const { projectId } = await this.resolveAgent(user, agentId);
                await this.assertScope(user, projectId, 'agent:unpublish');
                const agent = await this.agentPublishService.unpublishAgent(agentId, projectId, user, 'mcp');
                return {
                    ok: true,
                    agentId,
                    published: false,
                    versionId: agent.versionId,
                    activeVersionId: agent.activeVersionId,
                };
            }),
        };
    }
    deleteAgentTool(user) {
        return {
            name: 'delete_agent',
            config: {
                description: 'Permanently delete an Agent and its associated resources.',
                inputSchema: agentIdentityShape,
                annotations: {
                    title: 'Delete Agent',
                    readOnlyHint: false,
                    destructiveHint: true,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            handler: async ({ agentId }) => await this.run(user, 'delete_agent', { agentId }, async () => {
                const { projectId } = await this.resolveAgent(user, agentId);
                await this.assertScope(user, projectId, 'agent:delete');
                const deleted = await this.agentsService.delete(agentId, projectId);
                if (!deleted)
                    throw new n8n_workflow_1.UserError(`Agent "${agentId}" not found`);
                return { ok: true, deleted: true, agentId };
            }),
        };
    }
    discoverAssetsTool(user) {
        return {
            name: 'discover_agent_assets',
            config: {
                description: 'Discover model catalogs, chat integrations, attachable workflows, saved sub-agents, or MCP registry servers.',
                inputSchema: discoverAssetsInput,
                annotations: {
                    title: 'Discover Agent Assets',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            handler: async (input) => await this.run(user, 'discover_agent_assets', { projectId: input.projectId, kind: input.kind }, async () => {
                await this.assertScope(user, input.projectId, 'agent:read');
                return {
                    ok: true,
                    kind: input.kind,
                    data: await this.discoverAssets(user, input),
                };
            }),
        };
    }
    verifyMcpServerTool(user) {
        return {
            name: 'verify_agent_mcp_server',
            config: {
                description: 'Test an MCP server with a user-accessible credential and return its available tools. Call before writing an mcpServers config entry; validate_agent performs no live MCP check.',
                inputSchema: verifyMcpServerInput,
                annotations: {
                    title: 'Verify Agent MCP Server',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            handler: async (input) => await this.run(user, 'verify_agent_mcp_server', { projectId: input.projectId, authentication: input.authentication }, async () => await this.verifyMcpServer(user, input)),
        };
    }
    updateIntegrationTool(user) {
        return {
            name: 'update_agent_integration',
            config: {
                description: "Configure or disconnect a Slack, Telegram, or Linear conversation integration. This is the only way to manage integrations; config.replace and config.patch can't change them. Configuration never publishes the Agent. If the Agent is already published, connecting starts the channel immediately. Otherwise, the channel stays inactive until publish_agent is called. For Slack, connect without credentialId first: n8n returns the workspaces where it can create a Slack app for the Agent, or the steps the user must take in n8n. Then call again with managerCredentialId and workspaceId after the user confirms the workspace.",
                inputSchema: updateIntegrationInput,
                annotations: {
                    title: 'Update Agent Integration',
                    readOnlyHint: false,
                    destructiveHint: true,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            handler: async (input) => await this.run(user, 'update_agent_integration', {
                agentId: input.agentId,
                action: input.action,
                type: input.type,
                setup: integrationSetupPath(input),
            }, async () => await this.updateIntegration(user, input)),
        };
    }
    referenceTool(user) {
        return {
            name: 'get_agent_builder_reference',
            config: {
                description: 'Return the required reference for Agent configuration and mutate_agent operations. Read before building an Agent.',
                inputSchema: emptyInput,
                annotations: {
                    title: 'Get Agent Builder Reference',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
            },
            handler: async () => await this.run(user, 'get_agent_builder_reference', {}, () => ({
                ok: true,
                uri: agent_reference_1.AGENT_BUILDER_REFERENCE_URI,
                guide: agent_reference_1.AGENT_BUILDER_GUIDE,
                configSchema: agent_reference_1.AGENT_CONFIG_JSON_SCHEMA,
            })),
        };
    }
    async getAgentSnapshot(user, agent) {
        const { id: agentId, projectId } = agent;
        const config = await this.configFromEntity(agent);
        const credentialProvider = this.credentialProvider(user, projectId);
        const [runnable, skills, tasks] = await Promise.all([
            this.agentValidationService.validateAgentIsRunnable(agentId, projectId, credentialProvider),
            this.agentSkillsService.listSkills(agentId, projectId),
            this.agentTaskService.list(agentId),
        ]);
        const outdatedSkillIds = await this.agentSkillRefs.findOutdatedSkillIds(config.skills ?? [], skills, {});
        const taskEnabled = new Map((config.tasks ?? []).map((task) => [task.id, task.enabled]));
        const { integrations: _integrations, ...editableConfig } = config;
        return {
            agent: {
                id: agent.id,
                name: agent.name,
                projectId: agent.projectId,
                published: agent.activeVersionId !== null,
                versionId: agent.versionId,
                activeVersionId: agent.activeVersionId,
                createdAt: agent.createdAt.toISOString(),
                updatedAt: agent.updatedAt.toISOString(),
            },
            config: editableConfig,
            configHash: (0, agent_config_hash_1.getAgentConfigHash)(config),
            isRunnable: runnable.missing.length === 0,
            missing: runnable.missing,
            skills,
            skillHashes: Object.fromEntries(Object.entries(skills).map(([id, skill]) => [id, (0, agent_config_hash_1.getAgentSkillHash)(skill)])),
            outdatedSkillIds,
            tasks: tasks.map((task) => ({ ...task, enabled: taskEnabled.get(task.id) ?? false })),
            customTools: Object.entries(agent.tools ?? {}).map(([id, tool]) => ({
                id,
                descriptor: tool.descriptor,
            })),
            integrations: agent.integrations ?? [],
        };
    }
    async getAgentVersionSnapshot(projectId, agentId, versionId) {
        const { agent, version, definition } = await this.agentPublishService.getVersion(agentId, projectId, versionId);
        if (!definition.schema)
            throw new n8n_workflow_1.UserError(`Version "${versionId}" has no JSON config.`);
        const { integrations: _integrations, ...editableConfig } = definition.schema;
        const enabledTasks = new Map((editableConfig.tasks ?? []).map((ref) => [ref.id, ref.enabled]));
        return {
            agent: {
                id: agent.id,
                name: agent.name,
                projectId: agent.projectId,
                published: agent.activeVersionId !== null,
                versionId: agent.versionId,
                activeVersionId: agent.activeVersionId,
            },
            version: {
                versionId: version.versionId,
                author: version.author,
                createdAt: version.createdAt.toISOString(),
                isActive: version.versionId === agent.activeVersionId,
            },
            config: editableConfig,
            skills: definition.skills,
            tasks: [...definition.tasks].map(([id, task]) => ({
                id,
                name: task.name,
                objective: task.objective,
                cronExpression: task.cronExpression,
                timezone: task.timezone,
                enabled: enabledTasks.get(id) ?? false,
            })),
            customTools: Object.entries(definition.tools).map(([id, tool]) => ({
                id,
                descriptor: tool.descriptor,
            })),
        };
    }
    async fetchConfigHash(projectId, agentId) {
        return (0, agent_config_hash_1.getAgentConfigHash)(await this.agentConfigService.getConfig(agentId, projectId));
    }
    async configFromEntity(agent) {
        const config = (0, agent_config_composition_1.composeJsonConfig)(agent, await this.agentSkillRefs.refsForDraft(agent, {}));
        if (!config)
            throw new n8n_workflow_1.UserError('Agent has no JSON config yet.');
        return config;
    }
    getAgentUrl(projectId, agentId) {
        return `${this.urlService.getInstanceBaseUrl()}/projects/${encodeURIComponent(projectId)}/agents/${encodeURIComponent(agentId)}`;
    }
    async callAgent(user, agent, request, abortSignal) {
        const { id: agentId, projectId } = agent;
        const previewUrl = `${this.getAgentUrl(projectId, agentId)}?openPreview=true`;
        try {
            let result;
            let note = {};
            if (request.type === 'message') {
                const execute = async (sessionId) => await this.agentTestRunService.executeDraftRun({
                    agentId,
                    projectId,
                    message: request.message,
                    sessionId,
                    credentialProvider: this.credentialProvider(user, projectId),
                    user,
                    source: 'mcp',
                    abortSignal,
                });
                const sessionId = request.sessionId?.trim() || undefined;
                result = await execute(sessionId);
                if (result.status === 'session_not_found' && sessionId !== undefined) {
                    result = await execute(undefined);
                    note = {
                        sessionNote: 'The sessionId you passed was not found, so this test started a new conversation. ' +
                            'To continue this conversation, pass the sessionId from this result.',
                    };
                }
            }
            else {
                result = await this.agentTestRunService.resumeDraftApproval({
                    agentId,
                    projectId,
                    continuation: request.continuation,
                    approved: request.approved,
                    user,
                    source: 'mcp',
                    abortSignal,
                });
            }
            if (result.status === 'session_not_found') {
                return {
                    ok: false,
                    status: 'error',
                    code: 'session_not_found',
                    message: 'This test session is no longer available. Send a message request without sessionId to start a new test.',
                };
            }
            if (result.status === 'agent_misconfigured') {
                return {
                    ok: false,
                    status: 'error',
                    code: 'agent_misconfigured',
                    message: "This agent isn't ready to run yet. Finish configuring it and try again.",
                    missing: result.missing,
                };
            }
            if (result.status === 'completed')
                return { ok: true, ...result, ...note };
            const approvals = (0, agent_test_run_service_1.collectStandardApprovals)(result);
            if (approvals) {
                return {
                    ok: true,
                    status: 'suspended',
                    response: result.response,
                    sessionId: result.sessionId,
                    ...(result.executionId ? { executionId: result.executionId } : {}),
                    approvals,
                    ...note,
                };
            }
            const canOpenPreview = await (0, check_access_1.userHasScopes)(user, ['project:read', 'agent:read'], false, {
                projectId,
            });
            const previewAccessNote = canOpenPreview
                ? undefined
                : 'Your access permits running this agent but not opening Preview. Ask a project administrator for project and agent read access to open your preview session.';
            const cancelled = await this.agentTestRunService.cancelSuspendedRuns({
                agentId,
                suspensions: result.suspensions,
                userId: user.id,
            });
            if (!cancelled) {
                return {
                    ok: false,
                    status: 'error',
                    code: 'cancellation_failed',
                    message: 'This test needs approval, but its suspended run could not be cancelled. Open Preview before continuing this session.',
                    sessionId: result.sessionId,
                    previewUrl,
                    ...(previewAccessNote ? { previewAccessNote } : {}),
                    ...note,
                };
            }
            return {
                ok: true,
                status: 'approval_required',
                response: result.response,
                sessionId: result.sessionId,
                ...(result.executionId ? { executionId: result.executionId } : {}),
                suspensions: result.suspensions.map(({ runId, toolCallId, toolName }) => ({
                    runId,
                    toolCallId,
                    toolName,
                })),
                previewUrl,
                ...(previewAccessNote ? { previewAccessNote } : {}),
                ...note,
            };
        }
        catch (error) {
            if (error instanceof agent_test_run_service_1.InvalidAgentTestRunCheckpointError) {
                return {
                    ok: false,
                    status: 'error',
                    code: error.code,
                    message: error.message,
                };
            }
            return {
                ok: false,
                status: 'error',
                code: 'execution_failed',
                message: error instanceof Error ? error.message : 'Agent test run failed.',
            };
        }
    }
    async applyMutation(user, input, config, projectId, baseConfigHash) {
        const { agentId, operation } = input;
        const telemetryContext = { user, modifiedBy: 'mcp' };
        switch (operation.type) {
            case 'config.replace': {
                if (operation.config.integrations !== undefined) {
                    throw new n8n_workflow_1.UserError(INTEGRATIONS_NOT_IN_CONFIG_MESSAGE);
                }
                this.assertSanitizeStable(operation.config, config);
                this.assertPassesConfigGuards(operation.config, config);
                await this.assertAccessibleCredentials(operation.config, user, projectId);
                const result = await this.agentConfigService.updateConfig(agentId, projectId, operation.config, user, { baseConfigHash, clearOmittedOptionalFields: true, modifiedBy: 'mcp' });
                return { config: result.config };
            }
            case 'config.patch': {
                const jsonpatch = (await import('fast-json-patch')).default;
                const patchError = jsonpatch.validate(operation.patch, config);
                if (patchError)
                    throw new n8n_workflow_1.UserError(patchError.message ?? 'Invalid JSON patch');
                const patched = jsonpatch.applyPatch(jsonpatch.deepClone(config), operation.patch).newDocument;
                if (integrationsChanged(config, patched)) {
                    throw new n8n_workflow_1.UserError(INTEGRATIONS_NOT_IN_CONFIG_MESSAGE);
                }
                this.assertSanitizeStable(patched, config);
                this.assertPassesConfigGuards(patched, config);
                await this.assertAccessibleCredentials(patched, user, projectId);
                const result = await this.agentConfigService.updateConfig(agentId, projectId, patched, user, {
                    baseConfigHash,
                    clearOmittedOptionalFields: true,
                    modifiedBy: 'mcp',
                });
                return { config: result.config };
            }
            case 'skill.upsert':
                if (operation.skillId) {
                    const result = await this.agentSkillsService.updateSkill(agentId, projectId, operation.skillId, operation.skill, telemetryContext, operation.baseSkillHash);
                    return { resource: { type: 'skill', id: result.id } };
                }
                else {
                    const result = await this.agentSkillsService.createAndAttachSkill(agentId, projectId, operation.skill, telemetryContext);
                    return { resource: { type: 'skill', id: result.id } };
                }
            case 'skill.delete':
                await this.agentSkillsService.deleteSkill(agentId, projectId, operation.skillId, telemetryContext);
                return { resource: { type: 'skill', id: operation.skillId } };
            case 'task.upsert':
                if (operation.taskId) {
                    const result = await this.agentTaskService.update(agentId, projectId, operation.taskId, operation.task, telemetryContext);
                    if (operation.enabled !== undefined) {
                        const updated = await this.setTaskEnabled(user, agentId, projectId, operation.taskId, operation.enabled, config, baseConfigHash);
                        return { resource: { type: 'task', id: result.id }, config: updated };
                    }
                    return { resource: { type: 'task', id: result.id } };
                }
                else {
                    const result = await this.agentTaskService.create(agentId, projectId, {
                        ...operation.task,
                        enabled: operation.enabled ?? true,
                    }, telemetryContext);
                    return { resource: { type: 'task', id: result.id } };
                }
            case 'task.delete':
                await this.agentTaskService.delete(agentId, projectId, operation.taskId, telemetryContext);
                return { resource: { type: 'task', id: operation.taskId } };
            case 'customTool.upsert': {
                const descriptor = await this.agentSecureRuntime.describeToolSecurely(operation.code);
                const isAttached = (config.tools ?? []).some((tool) => tool.type === 'custom' && tool.id === descriptor.name);
                const built = await this.agentCustomToolsService.buildCustomTool(agentId, projectId, operation.code, descriptor, telemetryContext, { recordTelemetry: isAttached });
                if (isAttached) {
                    return { resource: { type: 'customTool', id: built.id }, config };
                }
                const next = {
                    ...config,
                    tools: [...(config.tools ?? []), { type: 'custom', id: built.id }],
                };
                await this.assertAccessibleCredentials(next, user, projectId);
                const result = await this.agentConfigService.updateConfig(agentId, projectId, next, user, {
                    baseConfigHash,
                    modifiedBy: 'mcp',
                });
                return { resource: { type: 'customTool', id: built.id }, config: result.config };
            }
            case 'customTool.delete':
                await this.agentCustomToolsService.deleteCustomTool(agentId, projectId, operation.toolId, telemetryContext);
                return { resource: { type: 'customTool', id: operation.toolId } };
        }
    }
    assertSanitizeStable(config, baseConfig) {
        const sanitized = (0, api_types_1.sanitizeAgentJsonConfig)(config);
        if (JSON.stringify(sanitized) === JSON.stringify(config))
            return;
        if (!(0, is_record_1.isRecord)(config) || !(0, is_record_1.isRecord)(sanitized))
            return;
        const base = baseConfig;
        const fields = Object.keys(config).filter((key) => {
            const submitted = JSON.stringify(config[key]);
            return (submitted !== JSON.stringify(sanitized[key]) && submitted !== JSON.stringify(base[key]));
        });
        if (fields.length === 0)
            return;
        throw new n8n_workflow_1.UserError(`Config contains entries the schema does not support (in: ${fields.join(', ')}); saving would silently drop them. Compare against the config schema from get_agent_builder_reference — e.g. sub-agents belong under subAgents.agents, not tools.`);
    }
    assertPassesConfigGuards(next, baseConfig) {
        const parsed = api_types_1.AgentJsonConfigSchema.safeParse((0, api_types_1.sanitizeAgentJsonConfig)(next));
        if (!parsed.success)
            return;
        const errors = (0, agent_config_1.rejectIfEmptyInstructions)(parsed.data, MCP_AGENT_CONFIG_MESSAGES) ??
            (0, agent_config_1.rejectIfUnsupportedNativeWebSearch)(parsed.data) ??
            (0, agent_config_1.rejectIfDynamicSelectorUsesFromAi)(parsed.data, baseConfig, this.nodeTypes, MCP_AGENT_CONFIG_MESSAGES);
        if (errors) {
            throw new n8n_workflow_1.UserError(errors.map((error) => `${error.path}: ${error.message}`).join('; '));
        }
    }
    async assertAccessibleCredentials(config, user, projectId) {
        const accessibleIds = new Set((await this.credentialProvider(user, projectId).list()).map((credential) => credential.id));
        const sanitized = (0, sanitize_unknown_agent_credentials_1.sanitizeUnknownAgentCredentials)(config, accessibleIds);
        if (JSON.stringify(sanitized) === JSON.stringify(config))
            return;
        const ids = new Set();
        collectClearedCredentialIds(config, sanitized, ids);
        throw new n8n_workflow_1.UserError(`Config references credentials you cannot use in this project: ${[...ids].join(', ')}. Saving would silently clear them. Use list_credentials to find an accessible credential, or remove the reference.`);
    }
    async setTaskEnabled(user, agentId, projectId, taskId, enabled, config, baseConfigHash) {
        let found = false;
        const tasks = (config.tasks ?? []).map((task) => {
            if (task.id !== taskId)
                return task;
            found = true;
            return { ...task, enabled };
        });
        if (!found)
            throw new n8n_workflow_1.UserError(`Task "${taskId}" is not attached to the Agent`);
        const next = { ...config, tasks };
        await this.assertAccessibleCredentials(next, user, projectId);
        const result = await this.agentConfigService.updateConfig(agentId, projectId, next, user, {
            baseConfigHash,
            modifiedBy: 'mcp',
        });
        return result.config;
    }
    async validateAgent(user, agent) {
        const projectId = agent.projectId;
        const config = await this.configFromEntity(agent);
        const credentialProvider = this.credentialProvider(user, projectId);
        const [schema, configuration] = await Promise.all([
            this.agentConfigService.validateConfig(config),
            this.agentValidationService.validateLoadedAgentConfiguration(agent, projectId, credentialProvider, 'publish'),
        ]);
        const errors = schema.valid ? [] : [schema.error];
        const missing = [
            ...new Set(configuration.issues.map((issue) => issue.reason === 'not_published'
                ? `${issue.path} (workflow "${issue.capability.id}" is not published; publish it first with publish_workflow)`
                : issue.path)),
        ];
        const warnings = (configuration.warnings ?? []).flatMap((warning) => warning.code === 'similar_skill_names'
            ? [
                `Skills ${warning.names.map((name) => `"${name}"`).join(', ')} have names that are hard to tell apart. Rename one of them.`,
            ]
            : []);
        return {
            valid: errors.length === 0 && missing.length === 0,
            errors,
            missing,
            ...(warnings.length > 0 ? { warnings } : {}),
        };
    }
    async discoverAssets(user, input) {
        switch (input.kind) {
            case 'models': {
                if (input.provider) {
                    const catalog = await this.agentModelCatalogService.getProviderModels(user, input.projectId, input.provider, input.credentialId);
                    const query = input.query?.trim().toLowerCase();
                    const models = query
                        ? catalog.models.filter((model) => model.id.toLowerCase().includes(query))
                        : catalog.models;
                    const truncated = models.length > MODEL_DISCOVERY_LIMIT;
                    return {
                        ...catalog,
                        models: models.slice(0, MODEL_DISCOVERY_LIMIT),
                        truncated,
                        ...(truncated ? { hint: 'Pass query to filter models by ID.' } : {}),
                    };
                }
                const catalog = (0, model_catalog_1.filterOfferedAgentModelProviders)(await (await import('@n8n/agents')).fetchProviderCatalog());
                return {
                    providers: Object.values(catalog).map((provider) => ({
                        provider: provider.id,
                        name: provider.name,
                        modelCount: Object.keys(provider.models).length,
                    })),
                    hint: 'Pass provider (and optionally credentialId) to list the models of one provider.',
                };
            }
            case 'integrations':
                return this.integrationPersistenceService.listChatIntegrations().map((integration) => ({
                    ...integration,
                    settingsRequired: integration.type === 'telegram',
                    ...(integration.type === agent_slack_setup_1.SLACK_INTEGRATION_TYPE
                        ? {
                            setupGuidance: 'Call update_agent_integration with action=connect and no credentialId. n8n returns the workspaces where it can create a Slack app for this Agent, or the steps the user must take in n8n. A slackApi credential from another Slack app, such as one made for a Slack Trigger, does not send events to the Agent.',
                        }
                        : {}),
                    ...(integration.type === 'telegram'
                        ? {
                            settingsSchema: TELEGRAM_SETTINGS_JSON_SCHEMA,
                            settingsGuidance: 'Pass accessMode=public with allowedUsers=[], or accessMode=private with at least one Telegram user ID or username.',
                        }
                        : {}),
                }));
            case 'workflows':
                return await this.attachableWorkflowsService.list(user, input.projectId, input.query);
            case 'subagents': {
                const summaries = await this.agentsService.findSummariesInProjects([input.projectId], {
                    query: input.query?.trim() || undefined,
                    excludeAgentId: input.excludeAgentId,
                });
                return summaries.map((agent) => ({ agentId: agent.id, name: agent.name }));
            }
            case 'mcpServers':
                return input.query
                    ? await this.mcpRegistryService.search([input.query])
                    : await this.mcpRegistryService.list(MCP_SERVER_DISCOVERY_LIMIT);
        }
    }
    async verifyMcpServer(user, input) {
        await this.assertScope(user, input.projectId, 'agent:read');
        if (input.url.startsWith('=') && !input.metadata?.nodeTypeName) {
            throw new n8n_workflow_1.UserError('A templated server URL needs metadata.nodeTypeName so the registry can resolve it');
        }
        const credentialProvider = this.credentialProvider(user, input.projectId);
        if (input.authentication !== 'none') {
            if (!input.credential) {
                throw new n8n_workflow_1.UserError('credential is required when authentication is not none');
            }
            await this.requireAccessibleCredential(credentialProvider, input.credential);
        }
        try {
            const tools = await (0, mcp_client_factory_1.listMcpServerTools)({
                name: input.name,
                url: input.url,
                transport: input.transport,
                authentication: input.authentication,
                credential: input.credential,
                metadata: input.metadata,
                toolPermissions: {
                    categories: { read: 'always_allow', write: 'always_allow' },
                },
                ...(input.connectionTimeoutMs !== undefined
                    ? { connectionTimeoutMs: input.connectionTimeoutMs }
                    : {}),
            }, {
                credentialProvider,
                oauthService: this.oauthService,
                projectId: input.projectId,
                proxyFetch: (0, ai_proxy_fetch_1.createAiMcpFetch)(this.outboundHttp),
                resolveRegistryConnection: async (nodeTypeName) => await this.mcpRegistryService.getConnection(nodeTypeName),
            });
            return { ok: true, tools };
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.OperationalError) {
                return { ok: false, error: error.message };
            }
            throw error;
        }
    }
    async updateIntegration(user, input) {
        const agent = await this.resolveAgent(user, input.agentId);
        const projectId = agent.projectId;
        await this.assertScope(user, projectId, 'agent:update');
        return input.action === 'disconnect'
            ? await this.disconnectIntegration(user, input, agent)
            : await this.connectIntegration(user, input, agent);
    }
    async disconnectIntegration(user, input, agent) {
        const { credentialId } = input;
        if (!credentialId)
            throw new n8n_workflow_1.UserError('credentialId is required to disconnect');
        if (input.managerCredentialId || input.workspaceId) {
            throw new n8n_workflow_1.UserError('managerCredentialId and workspaceId apply only to connect');
        }
        const { savedAgent: saved, warning } = await this.integrationManagementService.disconnect({
            agent,
            user,
            type: input.type,
            credentialId,
            modifiedBy: 'mcp',
        });
        return {
            ok: true,
            agentId: input.agentId,
            integration: { type: input.type, credentialId },
            connected: false,
            ...(warning ? { warning } : {}),
            published: saved.activeVersionId !== null,
            activeVersionId: saved.activeVersionId,
            configHash: (0, agent_config_hash_1.getAgentConfigHash)(await this.configFromEntity(saved)),
        };
    }
    async connectIntegration(user, input, agent) {
        const managedTarget = this.managedSlackTarget(input);
        if (managedTarget)
            return await this.installManagedSlackApp(user, agent, managedTarget);
        if (!input.credentialId) {
            if (input.type !== agent_slack_setup_1.SLACK_INTEGRATION_TYPE) {
                throw new n8n_workflow_1.UserError('credentialId is required to connect this integration');
            }
            return await this.slackSetup.describeSetup(agent, user, this.getAgentUrl(agent.projectId, agent.id));
        }
        const connected = await this.connectWithCredential(user, input, agent, input.credentialId);
        if (input.type !== agent_slack_setup_1.SLACK_INTEGRATION_TYPE)
            return connected;
        return {
            ...connected,
            ...(await this.slackSetup.describeBotCredential(agent, user, input.credentialId)),
        };
    }
    managedSlackTarget(input) {
        const { managerCredentialId, workspaceId } = input;
        if (!managerCredentialId && !workspaceId)
            return undefined;
        if (input.type !== agent_slack_setup_1.SLACK_INTEGRATION_TYPE) {
            throw new n8n_workflow_1.UserError('managerCredentialId and workspaceId apply only to Slack');
        }
        if (!managerCredentialId || !workspaceId) {
            throw new n8n_workflow_1.UserError('Pass managerCredentialId and workspaceId together');
        }
        if (input.credentialId || input.replacesCredentialId || input.settings) {
            throw new n8n_workflow_1.UserError('Managed Slack setup creates its own credential. Omit credentialId, replacesCredentialId, and settings');
        }
        return { managerCredentialId, workspaceId };
    }
    async installManagedSlackApp(user, agent, target) {
        if (!(await (0, check_access_1.userHasScopes)(user, ['credential:create'], false, { projectId: agent.projectId }))) {
            throw new errors_1.ForbiddenError('You do not have permission to create credentials in this project.');
        }
        const result = await this.slackSetup.install(agent, user, target);
        if (result.status === 'manual_install_required') {
            return {
                ok: true,
                status: 'install_approval_required',
                agentId: agent.id,
                configured: false,
                appId: result.appId,
                installUrl: result.installUrl,
                nextStep: 'Give installUrl to the user. After they approve the install in Slack, n8n connects the channel. Call get_agent to confirm the Slack integration.',
            };
        }
        if (!(await this.slackSetup.isAppConfiguredForAgent(agent, user, result.credentialId))) {
            return {
                ok: false,
                code: 'slack_app_built_for_another_agent',
                agentId: agent.id,
                configured: false,
                integration: { type: agent_slack_setup_1.SLACK_INTEGRATION_TYPE, credentialId: result.credentialId },
                error: 'This Agent already uses a Slack bot credential that n8n did not build for this Agent.',
                nextStep: 'Disconnect integration.credentialId from this Agent with update_agent_integration action=disconnect. Then call the install again, and n8n builds a new Slack app for this Agent.',
            };
        }
        const installed = {
            ok: true,
            agentId: agent.id,
            integration: { type: agent_slack_setup_1.SLACK_INTEGRATION_TYPE, credentialId: result.credentialId },
            configured: true,
            appId: result.appId,
            slackApp: { configuredForAgent: true },
        };
        const saved = await this.agentsService.findByIdForUser(agent.id, user);
        if (!saved)
            return installed;
        const published = saved.activeVersionId !== null;
        return {
            ...installed,
            connected: published,
            published,
            activeVersionId: saved.activeVersionId,
            configHash: (0, agent_config_hash_1.getAgentConfigHash)(await this.configFromEntity(saved)),
        };
    }
    async connectWithCredential(user, input, agent, credentialId) {
        const candidate = {
            type: input.type,
            credentialId,
            ...(input.settings ? { settings: input.settings } : {}),
        };
        const { savedAgent: saved } = await this.integrationManagementService.connect({
            agent,
            user,
            integration: candidate,
            ...(input.replacesCredentialId
                ? { replaces: { type: input.type, credentialId: input.replacesCredentialId } }
                : {}),
            modifiedBy: 'mcp',
        });
        const result = {
            ok: true,
            agentId: input.agentId,
            integration: { type: input.type, credentialId },
            configured: true,
            published: saved.activeVersionId !== null,
            activeVersionId: saved.activeVersionId,
            configHash: (0, agent_config_hash_1.getAgentConfigHash)(await this.configFromEntity(saved)),
        };
        if (saved.activeVersionId === null)
            return { ...result, connected: false };
        return {
            ...result,
            connected: true,
        };
    }
    credentialProvider(user, projectId) {
        return (0, agent_credential_provider_1.createAgentCredentialProvider)(this.credentialsService, projectId, user);
    }
    async requireAccessibleCredential(credentialProvider, credentialId) {
        const credential = (await credentialProvider.list()).find((item) => item.id === credentialId);
        if (!credential)
            throw new n8n_workflow_1.UserError('Credential not found or not accessible');
        return credential;
    }
    async resolveAgent(user, agentId) {
        const agent = await this.agentsService.findByIdForUser(agentId, user);
        if (!agent)
            throw new n8n_workflow_1.UserError(`Agent "${agentId}" not found`);
        if (!agent.availableInMCP) {
            throw new n8n_workflow_1.UserError('Agent is not available in MCP. Enable MCP access from the agents list, or from the MCP settings page.');
        }
        return agent;
    }
    async assertScope(user, projectId, scope) {
        if (!(await (0, check_access_1.userHasScopes)(user, [scope], false, { projectId }))) {
            throw new errors_1.ForbiddenError('You do not have permission to access agents in this project.');
        }
    }
    async run(user, toolName, parameters, action) {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: toolName,
            parameters,
        };
        try {
            const data = await action();
            telemetryPayload.results = { success: data.ok !== false };
            this.telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return (0, tool_result_utils_1.toolResult)(data, data.ok === false);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            telemetryPayload.results = { success: false, error: message };
            this.telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return (0, tool_result_utils_1.toolResult)({ ok: false, code: 'agent_tool_error', error: message }, true);
        }
    }
};
exports.McpAgentToolsService = McpAgentToolsService;
exports.McpAgentToolsService = McpAgentToolsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [telemetry_1.Telemetry, credentials_service_1.CredentialsService, agents_service_1.AgentsService, agent_config_service_1.AgentConfigService, agent_validation_service_1.AgentValidationService, agent_publish_service_1.AgentPublishService, agent_skills_service_1.AgentSkillsService, agent_task_service_1.AgentTaskService, agent_test_run_service_1.AgentTestRunService, agent_custom_tools_service_1.AgentCustomToolsService, agent_secure_runtime_1.AgentSecureRuntime, agent_integration_persistence_service_1.AgentIntegrationPersistenceService, agent_integration_management_service_1.AgentIntegrationManagementService, agent_model_catalog_service_1.AgentModelCatalogService, attachable_workflows_service_1.AttachableWorkflowsService, mcp_registry_service_1.McpRegistryService, node_types_1.NodeTypes, oauth_service_1.OauthService, backend_network_1.OutboundHttp, backend_services_1.UrlService, backend_services_1.ProjectScopeService, agent_slack_setup_1.McpAgentSlackSetup, agent_skill_refs_service_1.AgentSkillRefsService])
], McpAgentToolsService);
//# sourceMappingURL=agent-tools.service.js.map