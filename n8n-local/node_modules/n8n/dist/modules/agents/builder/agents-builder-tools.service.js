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
exports.AgentsBuilderToolsService = void 0;
const is_record_1 = require("@n8n/utils/is-record");
const agents_1 = require("@n8n/agents");
const tool_1 = require("@n8n/agents/tool");
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const telemetry_1 = require("@n8n/telemetry");
const zod_1 = require("zod");
const credential_types_1 = require("../../../credential-types");
const collaboration_service_1 = require("../../../collaboration/collaboration.service");
const errors_1 = require("@n8n/errors");
const mcp_registry_service_1 = require("../../../modules/mcp-registry/registry/mcp-registry.service");
const node_types_1 = require("../../../node-types");
const oauth_service_1 = require("../../../oauth/oauth.service");
const check_access_1 = require("../../../permissions.ee/check-access");
const ai_gateway_service_1 = require("../../../services/ai-gateway.service");
const ai_service_1 = require("../../../services/ai.service");
const dynamic_node_parameters_service_1 = require("../../../services/dynamic-node-parameters.service");
const free_ai_credits_service_1 = require("../../../services/free-ai-credits.service");
const telemetry_2 = require("../../../telemetry");
const ai_proxy_fetch_1 = require("../../../utils/ai-proxy-fetch");
const agent_config_service_1 = require("../agent-config.service");
const agent_custom_tools_service_1 = require("../agent-custom-tools.service");
const agent_integration_persistence_service_1 = require("../agent-integration-persistence.service");
const instance_ai_agent_context_adapter_1 = require("../instance-ai-agent-context.adapter");
const agent_publish_service_1 = require("../agent-publish.service");
const agent_skills_service_1 = require("../agent-skills.service");
const agent_task_service_1 = require("../agent-task.service");
const agent_test_run_service_1 = require("../agent-test-run.service");
const agents_tools_service_1 = require("../agents-tools.service");
const agents_service_1 = require("../agents.service");
const agent_builder_preview_path_1 = require("./agent-builder-preview-path");
const call_agent_failure_1 = require("./call-agent-failure");
const builder_model_live_lookup_service_1 = require("./builder-model-live-lookup.service");
const builder_tool_names_1 = require("./builder-tool-names");
const get_resource_locator_options_tool_1 = require("./get-resource-locator-options.tool");
const interactive_1 = require("./interactive");
const skill_body_template_1 = require("./skill-body-template");
const task_objective_template_1 = require("./task-objective-template");
const verify_mcp_server_tool_1 = require("./verify-mcp-server.tool");
const agent_skill_refs_service_1 = require("../agent-skill-refs.service");
const agent_config_composition_1 = require("../json-config/agent-config-composition");
const reconcile_node_tool_gateway_credentials_1 = require("../json-config/reconcile-node-tool-gateway-credentials");
const agent_secure_runtime_1 = require("../runtime/agent-secure-runtime");
const agent_config_hash_1 = require("../utils/agent-config-hash");
const skill_name_taken_error_1 = require("../skills/skill-name-taken.error");
const STALE_CONFIG_ERROR = {
    path: '(root)',
    message: 'Agent config changed elsewhere. This result carries the current config and configHash: ' +
        're-apply your change to that config and retry once with that configHash.',
};
const BASE_CONFIG_HASH_RULE = 'Requires baseConfigHash: the configHash from the latest agent-context with type "config" result, ' +
    'or from the latest builder result that returned one (agent_builder_write_config, agent_builder_patch_config, agent_builder_create_skills, ' +
    'agent_builder_create_tasks, agent_builder_finish_setup, agent_builder_configure_channel, agent_builder_verify_mcp_server with credentialApplied: true, ' +
    'or a stale failure), whichever came last. ';
const BASE_CONFIG_HASH_FIELD_DESCRIPTION = 'Latest configHash from agent-context with type "config" or from the latest builder result that ' +
    'returned one; null only if no config exists';
const CONFIG_WRITE_RESULT_RULE = 'Returns { ok: true, configMutated: true, agentId, configHash } on success. The result also carries ' +
    '`config` when the saved config differs from what you sent (for example applied defaults or kept ' +
    'omitted fields); treat that `config` as the current state. On failure returns { ok: false, stage, ' +
    'errors } and nothing is saved, so on a parse, patch, or schema error fix the payload and retry with ' +
    'the same baseConfigHash. On stage: "stale", the result carries the current config and configHash: ' +
    're-apply your change to it and retry once. ';
function configuredTriggerTypes(config) {
    return new Set((config?.integrations ?? [])
        .filter((integration) => typeof integration.credentialId === 'string' && !(0, api_types_1.isDraftIntegration)(integration))
        .map((integration) => integration.type));
}
function trackRemovedTriggers(track, previous, next) {
    const remaining = configuredTriggerTypes(next);
    const triggers = [...remaining].sort();
    for (const type of configuredTriggerTypes(previous)) {
        if (remaining.has(type))
            continue;
        track(telemetry_1.TELEMETRY_EVENT.AGENTS.BUILDER_REMOVED_TRIGGER, { trigger_type: type, triggers });
    }
}
function parseJsonStringInput(value) {
    if (typeof value !== 'string')
        return value;
    const parsed = (0, api_types_1.tryParseConfigJson)(value);
    return parsed.ok ? parsed.data : value;
}
function readStructuredToolInput(value) {
    return typeof value === 'string' ? (0, api_types_1.tryParseConfigJson)(value) : { ok: true, data: value };
}
function mergeOmittedTopLevelFields(submitted, stored) {
    if (!stored || !(0, is_record_1.isRecord)(submitted))
        return submitted;
    return { ...stored, ...submitted };
}
function renameLegacyWriteConfigKey(value) {
    if (!(0, is_record_1.isRecord)(value) || value.config !== undefined || value.json === undefined)
        return value;
    const { json, ...rest } = value;
    return { ...rest, config: json };
}
const jsonPatchOperationSchema = zod_1.z.object({
    op: zod_1.z.enum(['add', 'remove', 'replace', 'move', 'copy', 'test']),
    path: zod_1.z.string().describe('JSON Pointer, e.g. "/instructions" or "/tools/-"'),
    from: zod_1.z.string().optional().describe('Source JSON Pointer for move and copy'),
    value: zod_1.z.unknown().optional().describe('New value for add, replace, and test'),
});
const AGENT_LOCKED_BY_EDITOR_ERROR = {
    path: '(root)',
    message: 'The agent is being edited by a user in the n8n builder right now, so it cannot be modified. ' +
        'Stop editing and tell the user to finish or close their editing session, then retry.',
};
const STALE_SKILL_ERROR_MESSAGE = 'Skill changed. Call agent-context with type "skill", then retry with its skill and skillHash.';
function updateSkillErrorMessage(error, message) {
    if (error instanceof skill_name_taken_error_1.SkillNameTakenError)
        return (0, skill_name_taken_error_1.skillNameTakenToolMessage)(error.skillName);
    return error instanceof errors_1.ConflictError ? STALE_SKILL_ERROR_MESSAGE : message;
}
function isEmptyConfigValue(value) {
    return value === undefined || value === null || (typeof value === 'string' && !value.trim());
}
const CLI_AGENT_CONFIG_MESSAGES = {
    emptyInstructionsFollowUp: 'saving the config again.',
    dynamicSelectorFollowUp: 'Load skill agent-builder-resource-locators, resolve a credential if missing, then call ' +
        'agent_builder_get_resource_locator_options and write the returned parameterValue into nodeParameters.',
};
const createSkillInputSchema = zod_1.z
    .object({
    name: api_types_1.agentSkillSchema.shape.name.describe('Human-readable skill name. It must be unique in the project: no other skill of this ' +
        'project may have a name like it (case, spaces, hyphens and underscores do not count).'),
    description: api_types_1.agentSkillSchema.shape.description.describe(skill_body_template_1.SKILL_DESCRIPTION_RULE),
    instructions: api_types_1.agentSkillSchema.shape.instructions.describe(skill_body_template_1.SKILL_BODY_GUIDANCE),
    references: api_types_1.agentSkillSchema.shape.references
        .optional()
        .describe('Markdown-only supporting files under references/... paths. References are not automatically loaded; instructions must say exactly when to load each reference by path.'),
})
    .strict();
const updateSkillFieldsSchema = zod_1.z
    .object({
    name: api_types_1.agentSkillSchema.shape.name.optional(),
    description: api_types_1.agentSkillSchema.shape.description.optional(),
    instructions: api_types_1.agentSkillSchema.shape.instructions
        .optional()
        .describe('Complete replacement body. Use only for a rewrite of most of the body.'),
    instructionEdits: zod_1.z
        .array(zod_1.z
        .object({
        oldText: zod_1.z
            .string()
            .min(1)
            .describe('Exact text from the current instructions. It must match exactly one place.'),
        newText: zod_1.z.string().describe('Replacement text. Use an empty string to delete.'),
    })
        .strict())
        .min(1)
        .max(20)
        .optional()
        .describe('Targeted replacements in the current instructions, applied in order. Prefer this to ' +
        '`instructions` for a partial change. Do not pass both.'),
    references: api_types_1.agentSkillSchema.shape.references
        .unwrap()
        .refine((references) => references.length > 0, 'Pass null to clear references.')
        .nullable()
        .optional(),
})
    .strict()
    .refine((updates) => Object.keys(updates).length > 0, {
    message: 'At least one skill field must be supplied.',
})
    .refine((updates) => !(updates.instructions && updates.instructionEdits), {
    message: 'Pass either instructions or instructionEdits, not both.',
});
const updateSkillInputSchema = zod_1.z
    .object({
    skillId: zod_1.z.string().min(1).describe('Persisted target-agent skill id to update.'),
    baseSkillHash: zod_1.z
        .string()
        .min(1)
        .describe('skillHash from the immediately preceding agent-context with type "skill" result for this skill.'),
    updates: updateSkillFieldsSchema.describe('Only the fields to change. Pass null for references to remove them; an empty array is invalid.'),
})
    .strict();
const updateTaskFieldsSchema = zod_1.z
    .object({
    name: api_types_1.agentTaskSchema.shape.name.optional(),
    objective: api_types_1.agentTaskSchema.shape.objective.optional().describe(task_objective_template_1.TASK_OBJECTIVE_GUIDANCE),
    cronExpression: api_types_1.agentTaskSchema.shape.cronExpression.optional(),
    timezone: api_types_1.agentTaskSchema.shape.timezone.describe('IANA zone the cron runs in. Pass null to move the task back to the instance timezone.'),
})
    .strict()
    .refine((updates) => Object.keys(updates).length > 0, {
    message: 'At least one task field must be supplied.',
});
const updateTaskInputSchema = zod_1.z
    .object({
    taskId: zod_1.z.string().min(1).describe('Persisted target-agent task id to update.'),
    updates: updateTaskFieldsSchema.describe('Only the task fields to change.'),
})
    .strict();
const notedContinuationSchema = zod_1.z.object({ run: zod_1.z.unknown(), sessionNote: zod_1.z.string() }).strict();
const UNRESOLVED_TARGET_AGENT_ID = '';
const pinnedTargetContinuationSchema = zod_1.z
    .object({
    builderTargetAgentId: zod_1.z.string().min(1),
    inner: zod_1.z.custom().optional(),
})
    .strict();
function isInterruptibleContext(ctx) {
    return 'suspend' in ctx && typeof ctx.suspend === 'function';
}
function withPinnedTarget(ctx, agentId, innerContinuation) {
    return {
        ...ctx,
        continuation: innerContinuation,
        suspend: async (payload, options) => {
            const inner = options && Object.prototype.hasOwnProperty.call(options, 'continuation')
                ? options.continuation
                : innerContinuation;
            return await ctx.suspend(payload, {
                ...options,
                continuation: {
                    builderTargetAgentId: agentId,
                    ...(inner !== undefined ? { inner } : {}),
                },
            });
        },
    };
}
function snapshotFromConfig(config) {
    return {
        config,
        configHash: (0, agent_config_hash_1.getAgentConfigHash)(config),
    };
}
function parseBuilderWriteConfig(incoming, currentConfig) {
    const sanitized = (0, api_types_1.sanitizeAgentJsonConfig)(incoming);
    if (!(0, api_types_1.isDraftAgentConfig)(currentConfig) &&
        (0, api_types_1.isDraftAgentConfig)(sanitized)) {
        return {
            success: false,
            error: new zod_1.z.ZodError([
                {
                    code: zod_1.z.ZodIssueCode.custom,
                    path: ['model'],
                    message: 'Model cannot be cleared once set',
                },
            ]),
        };
    }
    return api_types_1.AgentJsonConfigSchema.safeParse(sanitized);
}
function applyPromptCachingBuilderDefaults(config) {
    const providerPrefix = (0, agent_config_1.getProviderPrefix)(config.model);
    const capability = api_types_1.PROVIDER_CAPABILITIES[providerPrefix]?.promptCaching ?? false;
    const resolved = (0, api_types_1.resolvePromptCaching)(config.config?.promptCaching, capability);
    if (!resolved) {
        if (!config.config || !('promptCaching' in config.config))
            return config;
        const { promptCaching: _promptCaching, ...restConfig } = config.config;
        const { config: _config, ...restAgentConfig } = config;
        return {
            ...restAgentConfig,
            ...(Object.keys(restConfig).length > 0 ? { config: restConfig } : {}),
        };
    }
    return {
        ...config,
        config: {
            ...(config.config ?? {}),
            promptCaching: resolved,
        },
    };
}
let AgentsBuilderToolsService = class AgentsBuilderToolsService {
    constructor(logger, agentsService, agentConfigService, agentCustomToolsService, agentIntegrationPersistenceService, agentSkillsService, secureRuntime, agentsToolsService, builderModelLiveLookupService, mcpRegistryService, oauthService, credentialTypes, agentTaskService, agentPublishService, agentTestRunService, aiService, aiGatewayService, outboundHttp, dynamicNodeParametersService, nodeTypes, freeAiCreditsService, telemetry, agentContextAdapter, collaborationService, agentSkillRefs) {
        this.logger = logger;
        this.agentsService = agentsService;
        this.agentConfigService = agentConfigService;
        this.agentCustomToolsService = agentCustomToolsService;
        this.agentIntegrationPersistenceService = agentIntegrationPersistenceService;
        this.agentSkillsService = agentSkillsService;
        this.secureRuntime = secureRuntime;
        this.agentsToolsService = agentsToolsService;
        this.builderModelLiveLookupService = builderModelLiveLookupService;
        this.mcpRegistryService = mcpRegistryService;
        this.oauthService = oauthService;
        this.credentialTypes = credentialTypes;
        this.agentTaskService = agentTaskService;
        this.agentPublishService = agentPublishService;
        this.agentTestRunService = agentTestRunService;
        this.aiService = aiService;
        this.aiGatewayService = aiGatewayService;
        this.outboundHttp = outboundHttp;
        this.dynamicNodeParametersService = dynamicNodeParametersService;
        this.nodeTypes = nodeTypes;
        this.freeAiCreditsService = freeAiCreditsService;
        this.telemetry = telemetry;
        this.agentContextAdapter = agentContextAdapter;
        this.collaborationService = collaborationService;
        this.agentSkillRefs = agentSkillRefs;
    }
    withConfigMutationMarker(tool, agentId) {
        const handler = tool.handler;
        if (!handler)
            return tool;
        return {
            ...tool,
            handler: async (input, ctx) => {
                const result = await handler(input, ctx);
                if (typeof result === 'object' &&
                    result !== null &&
                    (('ok' in result && result.ok === true) ||
                        ('configured' in result && result.configured === true) ||
                        ('completed' in result && result.completed === true)) &&
                    (!('changed' in result) || result.changed !== false)) {
                    return { ...result, configMutated: true, agentId };
                }
                return result;
            },
        };
    }
    withConfigSnapshotOnResume(tool, agentId, projectId, isFinal) {
        const handler = tool.handler;
        if (!handler)
            return tool;
        return {
            ...tool,
            handler: async (input, ctx) => {
                const result = await handler(input, ctx);
                const resumed = 'resumeData' in ctx && ctx.resumeData !== undefined && ctx.resumeData !== null;
                if (!resumed || !(0, is_record_1.isRecord)(result) || !isFinal(result))
                    return result;
                const snapshot = await this.getConfigSnapshot(agentId, projectId).catch(() => null);
                return snapshot ? { ...result, ...snapshot } : result;
            },
        };
    }
    async getEditorLockFailure(agentId) {
        try {
            await this.collaborationService.ensureAgentEditable(agentId);
            return null;
        }
        catch (error) {
            if (error instanceof errors_1.LockedError) {
                return { ok: false, errors: [AGENT_LOCKED_BY_EDITOR_ERROR] };
            }
            throw error;
        }
    }
    getTools(agentId, projectId, credentialProvider, credentialService, user, options) {
        return {
            json: this.getJsonTools(agentId, projectId, credentialProvider, credentialService, user, options),
            shared: this.getSharedTools(agentId, projectId, credentialProvider, user),
        };
    }
    getToolsForResolvedTarget(resolveTargetAgentId, projectId, credentialProviderFor, credentialService, user, options = {}) {
        const excluded = new Set(options.excludeToolNames ?? []);
        const buildToolSet = (agentId) => {
            const { json, shared } = this.getTools(agentId, projectId, credentialProviderFor(agentId), credentialService, user, options);
            return [...json, ...shared].filter((tool) => !excluded.has(tool.name));
        };
        const toolSetsByAgentId = new Map();
        const toolFor = (agentId, toolName) => {
            let toolSet = toolSetsByAgentId.get(agentId);
            if (!toolSet) {
                toolSet = new Map(buildToolSet(agentId).map((tool) => [tool.name, tool]));
                toolSetsByAgentId.set(agentId, toolSet);
            }
            return toolSet.get(toolName);
        };
        return buildToolSet(UNRESOLVED_TARGET_AGENT_ID).map((template) => ({
            ...template,
            handler: async (input, ctx) => {
                const pinned = isInterruptibleContext(ctx)
                    ? pinnedTargetContinuationSchema.safeParse(ctx.continuation)
                    : undefined;
                const pinnedTarget = pinned?.success ? pinned.data : undefined;
                const agentId = await resolveTargetAgentId(pinnedTarget?.builderTargetAgentId);
                const handler = toolFor(agentId, template.name)?.handler;
                if (!handler)
                    throw new errors_1.UnexpectedError(`Builder tool "${template.name}" has no handler`);
                if (!isInterruptibleContext(ctx))
                    return await handler(input, ctx);
                const innerContinuation = pinnedTarget ? pinnedTarget.inner : ctx.continuation;
                return await handler(input, withPinnedTarget(ctx, agentId, innerContinuation));
            },
        }));
    }
    getJsonTools(agentId, projectId, credentialProvider, credentialService, user, options) {
        const track = (entry, properties) => this.telemetry.track(entry, {
            agent_id: agentId,
            user_id: user.id,
            ...(options?.threadId ? { thread_id: options.threadId } : {}),
            ...(options?.runId ? { run_id: options.runId } : {}),
            ...properties,
        });
        const writeConfigTool = this.buildWriteConfigTool(agentId, projectId, user, track);
        const patchConfigTool = this.buildPatchConfigTool(agentId, projectId, user, track);
        const publishAgentTool = this.buildPublishAgentTool(user, projectId, agentId);
        const unpublishAgentTool = this.buildUnpublishAgentTool(user, projectId, agentId);
        const callAgentTool = this.buildCallAgentTool(user, projectId, agentId, credentialProvider);
        const modelLookup = this.createModelLookup(user, projectId, options);
        const tools = [
            this.withConfigMutationMarker(writeConfigTool, agentId),
            this.withConfigMutationMarker(patchConfigTool, agentId),
            this.withConfigMutationMarker(publishAgentTool, agentId),
            this.withConfigMutationMarker(unpublishAgentTool, agentId),
            callAgentTool,
            this.createLlmTool(credentialProvider, modelLookup, user, projectId),
            this.createCredentialTool(credentialService, projectId, agentId, track),
            this.createEmbeddingCredentialTool(credentialService, projectId, track),
            (0, interactive_1.buildAskQuestionsTool)({ track }),
            this.withConfigMutationMarker(this.withConfigSnapshotOnResume(this.createConfigureChannelTool(agentId, projectId, user, track), agentId, projectId, (result) => typeof result.configured === 'boolean'), agentId),
            this.withConfigMutationMarker(this.withConfigSnapshotOnResume(this.createFinishSetupTool(credentialService, agentId, projectId, user, track), agentId, projectId, (result) => result.completed === true), agentId),
            this.createVerifyMcpServerTool(agentId, credentialProvider, projectId, user),
        ];
        return tools;
    }
    createVerifyMcpServerTool(agentId, credentialProvider, projectId, user) {
        return (0, verify_mcp_server_tool_1.buildVerifyMcpServerTool)({
            agentId,
            credentialProvider,
            oauthService: this.oauthService,
            projectId,
            proxyFetch: (0, ai_proxy_fetch_1.createAiMcpFetch)(this.outboundHttp),
            resolveRegistryConnection: async (nodeTypeName) => await this.mcpRegistryService.getConnection(nodeTypeName),
            applyCredentialToMcpServer: async (serverName, credentialId) => await this.applyCredentialToMcpServer(agentId, projectId, serverName, credentialId, user),
        });
    }
    createFinishSetupTool(credentialService, agentId, projectId, user, track) {
        return (0, interactive_1.buildFinishSetupTool)({
            credentialService,
            agentId,
            projectId,
            track,
            applySetupToConfig: async (writes) => await this.applyFinishSetupToConfig(agentId, projectId, user, writes),
            isCredentialTypeKnown: (credentialType) => this.credentialTypes.recognizes(credentialType),
            listIntegrationCredentialIds: async () => {
                const agent = await this.agentsService.findById(agentId, projectId);
                return (agent?.integrations ?? [])
                    .filter((integration) => (0, api_types_1.isCredentialAgentIntegration)(integration) && !(0, api_types_1.isDraftIntegration)(integration))
                    .map((integration) => integration.credentialId);
            },
            listChatIntegrationTypes: async () => (await this.agentIntegrationPersistenceService.listBuilderChatIntegrations(user)).map((integration) => integration.type),
            listAiGatewayManagedCredentialTypes: async () => {
                const agent = await this.agentsService.findById(agentId, projectId);
                return (0, reconcile_node_tool_gateway_credentials_1.listAiGatewayManagedCredentialTypes)(agent?.schema?.tools, this.nodeTypes);
            },
        });
    }
    createConfigureChannelTool(agentId, projectId, user, track) {
        return (0, interactive_1.buildConfigureChannelTool)({
            agentId,
            projectId,
            listChatIntegrationTypes: async () => (await this.agentIntegrationPersistenceService.listBuilderChatIntegrations(user)).map((integration) => integration.type),
            track,
        });
    }
    createEmbeddingCredentialTool(credentialService, projectId, track) {
        return (0, interactive_1.buildAskEmbeddingCredentialTool)({
            credentialService,
            projectId,
            isCredentialTypeKnown: (credentialType) => this.credentialTypes.recognizes(credentialType),
            isAssistantProxyEnabled: () => this.aiService.isProxyEnabled(),
            track,
        });
    }
    createCredentialTool(credentialService, projectId, agentId, track) {
        return (0, interactive_1.buildAskCredentialTool)({
            credentialService,
            projectId,
            isCredentialTypeKnown: (credentialType) => this.credentialTypes.recognizes(credentialType),
            listIntegrationCredentialIds: async () => {
                const agent = await this.agentsService.findById(agentId, projectId);
                return (agent?.integrations ?? [])
                    .filter((integration) => (0, api_types_1.isCredentialAgentIntegration)(integration) && !(0, api_types_1.isDraftIntegration)(integration))
                    .map((integration) => integration.credentialId);
            },
            track,
        });
    }
    createLlmTool(credentialProvider, modelLookup, user, projectId) {
        return (0, interactive_1.buildResolveLlmTool)({
            credentialProvider,
            modelLookup,
            isProviderServedByGateway: async (provider) => {
                try {
                    return (await this.aiGatewayService.getCredentialTypeForProvider(provider)) !== undefined;
                }
                catch {
                    return false;
                }
            },
            freeCredits: {
                isEligible: () => this.freeAiCreditsService.isEligible(user),
                claim: async () => {
                    const credential = await this.freeAiCreditsService.claim(user, projectId);
                    this.telemetry.track('User claimed OpenAI credits', {
                        user_id: user.id,
                        source: 'agentBuilderResolveLlm',
                    });
                    return { credentialId: credential.id, credentialName: credential.name };
                },
            },
        });
    }
    buildCallAgentTool(user, projectId, agentId, credentialProvider) {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.CALL_AGENT)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.CALL_AGENT))
            .description('Tests the draft agent through built-in Preview chat. It does not test configured channel integrations, including their triggers, platform context, message delivery, or replies. ' +
            'Omit sessionId to start a new conversation. To continue one, pass the exact sessionId from an earlier agent_builder_call_agent result; never make one up. ' +
            'If the sessionId is not found, the test starts a new conversation and the result has a sessionNote. ' +
            'The draft uses its real configured tools and credentials, so external side effects are possible. ' +
            'Standard tool approvals pause this test until the user approves or rejects them in chat. ' +
            'Unsupported interactive requests return approval_required with a Preview path.')
            .input(zod_1.z.object({
            message: zod_1.z.string().trim().min(1).describe('Message to send to the target agent'),
            sessionId: zod_1.z
                .string()
                .trim()
                .optional()
                .describe('Exact sessionId from an earlier agent_builder_call_agent result. Omit it to start a new conversation.'),
        }))
            .suspend(tool_1.APPROVAL_SUSPEND_SCHEMA)
            .resume(tool_1.APPROVAL_RESUME_SCHEMA)
            .handler(async ({ message, sessionId }, ctx) => {
            if (!(await (0, check_access_1.userHasScopes)(user, ['agent:execute'], false, { projectId }))) {
                return {
                    status: 'error',
                    code: 'forbidden',
                    message: 'You do not have permission to run agents in this project.',
                };
            }
            const previewPath = (0, agent_builder_preview_path_1.buildAgentPreviewPath)(projectId, agentId);
            try {
                const { result, sessionNote } = await this.runDraftTest(ctx, agentId, projectId, message, sessionId || undefined, credentialProvider, user);
                return await this.formatDraftTestResult(result, ctx, agentId, user, previewPath, sessionNote);
            }
            catch (error) {
                if (ctx.abortSignal ? ctx.abortSignal.aborted : (0, agents_1.isAbortError)(error))
                    throw error;
                if (error instanceof agent_test_run_service_1.InvalidAgentTestRunCheckpointError) {
                    return {
                        status: 'error',
                        code: error.code,
                        message: error.message,
                    };
                }
                const { code, message } = (0, call_agent_failure_1.describeCallAgentFailure)(error instanceof Error ? error.message : 'Agent test run failed.');
                return { status: 'error', code, message };
            }
        })
            .build();
    }
    async runDraftTest(ctx, agentId, projectId, message, sessionId, credentialProvider, user) {
        if (ctx.resumeData === undefined) {
            const execute = async (id) => await this.agentTestRunService.executeDraftRun({
                agentId,
                projectId,
                message,
                sessionId: id,
                credentialProvider,
                user,
                source: 'instance-ai',
                ...(ctx.abortSignal ? { abortSignal: ctx.abortSignal } : {}),
            });
            const result = await execute(sessionId);
            if (result.status !== 'session_not_found' || sessionId === undefined)
                return { result };
            return {
                result: await execute(undefined),
                sessionNote: 'The sessionId you passed was not found, so this test started a new conversation. ' +
                    'To continue this conversation, pass the sessionId from this result.',
            };
        }
        const noted = notedContinuationSchema.safeParse(ctx.continuation);
        return {
            result: await this.agentTestRunService.resumeDraftApproval({
                agentId,
                projectId,
                continuation: noted.success ? noted.data.run : ctx.continuation,
                approved: ctx.resumeData.approved,
                user,
                source: 'instance-ai',
                ...(ctx.abortSignal ? { abortSignal: ctx.abortSignal } : {}),
            }),
            ...(noted.success ? { sessionNote: noted.data.sessionNote } : {}),
        };
    }
    buildUnpublishAgentTool(user, projectId, agentId) {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.UNPUBLISH_AGENT)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.UNPUBLISH_AGENT))
            .description('Unpublish this target agent: clears the live version while preserving the draft, disconnects chat ' +
            'integrations, and stops scheduled tasks. Call when the user asks to unpublish or take the agent offline. ' +
            'Returns { ok: true, configMutated: true, agentId, activeVersionId: null } or { ok: false, errors }.')
            .input(zod_1.z.object({}))
            .handler(async () => {
            if (!(await (0, check_access_1.userHasScopes)(user, ['agent:unpublish'], false, { projectId }))) {
                return {
                    ok: false,
                    errors: [
                        { message: 'You do not have permission to unpublish agents in this project.' },
                    ],
                };
            }
            const editorLock = await this.getEditorLockFailure(agentId);
            if (editorLock)
                return editorLock;
            try {
                await this.agentPublishService.unpublishAgent(agentId, projectId, user, 'builder');
                return { ok: true, agentId, activeVersionId: null };
            }
            catch (e) {
                return {
                    ok: false,
                    errors: [{ message: e instanceof Error ? e.message : String(e) }],
                };
            }
        })
            .build();
    }
    buildPublishAgentTool(user, projectId, agentId) {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.PUBLISH_AGENT)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.PUBLISH_AGENT))
            .description('Publish this target agent so it becomes live: integrations sync and scheduled tasks start running. ' +
            'Idempotent when the draft is already the active published version. Pass optional `versionId` to ' +
            'activate an existing history row instead of publishing the current draft. Call only when the user ' +
            'asks to publish, activate, or make the agent live/usable — never tell them to click Publish in the editor. ' +
            'Returns { ok: true, configMutated: true, agentId, activeVersionId, versionId } or { ok: false, errors }.')
            .input(zod_1.z.object({
            versionId: zod_1.z
                .string()
                .min(1)
                .optional()
                .describe('Optional history version ID to activate. Omit to publish the current draft.'),
        }))
            .handler(async ({ versionId }) => {
            if (!(await (0, check_access_1.userHasScopes)(user, ['agent:publish'], false, { projectId }))) {
                return {
                    ok: false,
                    errors: [{ message: 'You do not have permission to publish agents in this project.' }],
                };
            }
            const editorLock = await this.getEditorLockFailure(agentId);
            if (editorLock)
                return editorLock;
            try {
                const before = await this.agentsService.findById(agentId, projectId);
                const beforeActiveVersionId = before?.activeVersionId;
                const beforeVersionId = before?.versionId;
                const { agent } = await this.agentPublishService.publishAgent(agentId, projectId, user, { by: 'builder', trigger: 'explicit' }, versionId);
                return {
                    ok: true,
                    agentId,
                    activeVersionId: agent.activeVersionId,
                    versionId: agent.versionId,
                    ...(beforeActiveVersionId === agent.activeVersionId &&
                        beforeVersionId === agent.versionId
                        ? { changed: false }
                        : {}),
                };
            }
            catch (e) {
                return {
                    ok: false,
                    errors: [{ message: e instanceof Error ? e.message : String(e) }],
                };
            }
        })
            .build();
    }
    buildPatchConfigTool(agentId, projectId, user, track) {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.PATCH_CONFIG)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.PATCH_CONFIG))
            .description('Apply RFC 6902 JSON Patch operations to the current agent configuration. ' +
            'Pass the patch operations as an array of objects, not as a JSON string. ' +
            BASE_CONFIG_HASH_RULE +
            'Supported ops: add, remove, replace, move, copy, test. ' +
            CONFIG_WRITE_RESULT_RULE +
            'stage is "locked", "parse", "stale", "patch", or "schema". On stage: "locked", stop and tell the user to close ' +
            'their editing session in the n8n builder.')
            .input(zod_1.z.object({
            operations: zod_1.z
                .preprocess(parseJsonStringInput, zod_1.z.array(jsonPatchOperationSchema))
                .describe('RFC 6902 JSON Patch operations'),
            baseConfigHash: zod_1.z.string().nullable().describe(BASE_CONFIG_HASH_FIELD_DESCRIPTION),
        }))
            .handler(async ({ operations, baseConfigHash, }) => await this.patchBuilderConfig(agentId, projectId, user, operations, baseConfigHash, track))
            .build();
    }
    buildWriteConfigTool(agentId, projectId, user, track) {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.WRITE_CONFIG)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.WRITE_CONFIG))
            .description('Create or update the agent configuration. Pass the config as an object, not as a JSON string. ' +
            'Send only the top-level fields you set or change: every top-level field you omit ' +
            '(including model and credential) keeps its stored value, and a field you send replaces ' +
            'the stored field whole. A fresh agent with no stored config needs name, model, and instructions. ' +
            BASE_CONFIG_HASH_RULE +
            CONFIG_WRITE_RESULT_RULE +
            'Failure errors carry path, message, expected, and received fields.')
            .input(zod_1.z.preprocess(renameLegacyWriteConfigKey, zod_1.z.object({
            config: zod_1.z
                .preprocess(parseJsonStringInput, zod_1.z.record(zod_1.z.unknown()))
                .describe('Agent configuration object with the top-level fields to set'),
            baseConfigHash: zod_1.z.string().nullable().describe(BASE_CONFIG_HASH_FIELD_DESCRIPTION),
        })))
            .handler(async ({ config, baseConfigHash }) => await this.writeBuilderConfig(agentId, projectId, user, config, baseConfigHash, track))
            .build();
    }
    getSharedTools(agentId, projectId, credentialProvider, user) {
        const buildCustomToolTool = this.buildCustomToolTool(agentId, projectId, user);
        const createSkillsTool = this.buildCreateSkillsTool(agentId, projectId, user);
        const updateSkillTool = this.buildUpdateSkillTool(agentId, projectId, user);
        const updateTaskTool = this.buildUpdateTaskTool(agentId, projectId, user);
        const createTasksTool = this.buildCreateTasksTool(agentId, projectId, user);
        return [
            (0, instance_ai_1.createAgentContextTool)({
                reader: this.agentContextAdapter.createReader(user, projectId),
                resolveDefaultAgentId: async () => agentId,
                logger: this.logger,
            }),
            this.withConfigMutationMarker(buildCustomToolTool, agentId),
            this.withConfigMutationMarker(createSkillsTool, agentId),
            this.withConfigMutationMarker(updateSkillTool, agentId),
            this.withConfigMutationMarker(createTasksTool, agentId),
            this.withConfigMutationMarker(updateTaskTool, agentId),
            (0, get_resource_locator_options_tool_1.buildGetResourceLocatorOptionsTool)({
                dynamicNodeParametersService: this.dynamicNodeParametersService,
                nodeTypes: this.nodeTypes,
                user,
                projectId,
            }),
            ...this.agentsToolsService.getSharedTools(credentialProvider, 'Read-only inspection of available credentials. Use agent_builder_ask_credential to let the user ' +
                'pick the credential to wire into a node tool — never copy ids from this list directly ' +
                'into the config.'),
        ];
    }
    buildCreateTasksTool(agentId, projectId, user) {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.CREATE_TASKS)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.CREATE_TASKS))
            .description('Create one or more recurring scheduled tasks for the target agent (name + objective + cron ' +
            'schedule per task) in a single call. Pass every task you currently know how to write in one ' +
            "`tasks` array — do not spread multiple fully-specified tasks across separate calls; each task's " +
            'objective field carries its own structured template. The whole batch is all-or-nothing: an ' +
            'invalid cron or objective rejects every task in the call. This adds a `{ type: "task", id, ' +
            'enabled }` ref per task to the agent config (config.tasks) and each task starts running once ' +
            'the agent is (re)published via `agent_builder_publish_agent`. Returns { ok: true, configMutated: true, agentId, ' +
            'configHash, tasks: [{ id, name, enabled }, ...] } (same order as input, objectives and crons are ' +
            'not echoed back) or { ok: false, errors }. Use the returned configHash as baseConfigHash for your ' +
            'next config write.')
            .systemInstruction('Never create a task with a vague, broad, or placeholder objective, an objective missing any ' +
            'required section, or an unclear schedule. Each objective must follow the required structured ' +
            'Markdown template (Objective, Context, Steps, Output, Constraints, Success criteria) with every ' +
            'section filled in with concrete, run-specific content. Agent Instructions still apply and ' +
            'configured Skills remain available during scheduled runs, so never repeat universal rules or ' +
            "copy reusable procedures into an objective. If anything is ambiguous, derive it from the user's goal as " +
            'stated assumptions listed in your summary; ask the user clarifying questions with agent_builder_ask_questions ' +
            'only when even a reasonable assumption is impossible, before calling ' +
            'agent_builder_create_tasks. A task can only use tools the agent already has: if any step in an objective ' +
            'requires a tool, integration, or web search the agent is missing, you MUST add it to the agent ' +
            'config (agent_builder_patch_config/agent_builder_write_config) BEFORE calling agent_builder_create_tasks — otherwise the task will fail at ' +
            'runtime. Batch every task you currently know how to write into one call.')
            .input(zod_1.z.object({
            tasks: zod_1.z
                .array(zod_1.z.object({
                name: api_types_1.agentTaskSchema.shape.name.describe('Short, human-readable task name.'),
                objective: api_types_1.agentTaskSchema.shape.objective.describe(task_objective_template_1.TASK_OBJECTIVE_GUIDANCE),
                cronExpression: api_types_1.agentTaskSchema.shape.cronExpression.describe('A 5-field cron expression for when the task runs, e.g. "0 9 * * 1-5" = weekdays at 09:00.'),
                timezone: api_types_1.agentTaskSchema.shape.timezone.describe('IANA timezone the cron runs in, e.g. "Europe/London". Set it when the user names a timezone or a location; omit it to use the instance timezone.'),
            }))
                .min(1)
                .max(20)
                .describe('Every task to create, in the order they should be created.'),
        }))
            .handler(async ({ tasks, }) => {
            const editorLock = await this.getEditorLockFailure(agentId);
            if (editorLock)
                return editorLock;
            let created;
            try {
                created = await this.agentTaskService.createTasks(agentId, projectId, tasks.map((task) => ({ ...task, enabled: true })), { user, modifiedBy: 'builder' });
            }
            catch (e) {
                return {
                    ok: false,
                    errors: [{ message: e instanceof Error ? e.message : String(e) }],
                };
            }
            return {
                ok: true,
                configHash: created.configHash,
                tasks: created.tasks.map(({ id, name }) => ({ id, name, enabled: true })),
            };
        })
            .build();
    }
    buildUpdateTaskTool(agentId, projectId, user) {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.UPDATE_TASK)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.UPDATE_TASK))
            .description('Update selected body fields of an existing target-agent scheduled task in place, preserving ' +
            'its id and config reference. Returns { ok: true, id, name, configMutated: true, agentId } ' +
            'or { ok: false, errors }.')
            .input(updateTaskInputSchema)
            .handler(async ({ taskId, updates }) => {
            const editorLock = await this.getEditorLockFailure(agentId);
            if (editorLock)
                return editorLock;
            try {
                const { task, changed } = await this.agentTaskService.updateWithChange(agentId, projectId, taskId, updates, {
                    user,
                    modifiedBy: 'builder',
                });
                return { ok: true, id: task.id, name: task.name, ...(changed ? {} : { changed }) };
            }
            catch (e) {
                return {
                    ok: false,
                    errors: [{ message: e instanceof Error ? e.message : String(e) }],
                };
            }
        })
            .build();
    }
    buildUpdateSkillTool(agentId, projectId, user) {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.UPDATE_SKILL)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.UPDATE_SKILL))
            .description('Update selected fields of an existing target-agent skill in place, preserving its id and ' +
            'agent config reference. Requires baseSkillHash from the immediately preceding agent-context with type "skill" ' +
            'result. To change part of the body, pass instructionEdits with oldText/newText pairs ' +
            'instead of rewriting instructions. Pass null for references to remove all references; an ' +
            'empty array is invalid. The skill is shared: the update saves its next version, and every ' +
            'agent draft that follows the latest version runs that version. Published versions keep ' +
            'the version they pinned. Returns ' +
            '{ ok: true, id, name, configMutated: true, agentId } or { ok: false, errors }. A failed edit ' +
            'saves nothing: fix oldText so it matches exactly one place and retry with the same ' +
            'baseSkillHash. On a stale skill error, ' +
            'call agent-context with type "skill" and retry once with its fresh skillHash.')
            .input(updateSkillInputSchema)
            .handler(async ({ skillId, baseSkillHash, updates }) => {
            const editorLock = await this.getEditorLockFailure(agentId);
            if (editorLock)
                return editorLock;
            const { references, instructionEdits, ...requiredUpdates } = updates;
            const normalizedUpdates = {
                ...requiredUpdates,
                ...(references !== undefined ? { references: references ?? undefined } : {}),
            };
            try {
                const updated = await this.agentSkillsService.updateSkill(agentId, projectId, skillId, normalizedUpdates, { user, modifiedBy: 'builder' }, baseSkillHash, instructionEdits);
                return {
                    ok: true,
                    id: updated.id,
                    name: updated.skill.name,
                    ...(updated.skillHash === baseSkillHash ? { changed: false } : {}),
                };
            }
            catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                return { ok: false, errors: [{ message: updateSkillErrorMessage(e, message) }] };
            }
        })
            .build();
    }
    buildCreateSkillsTool(agentId, projectId, user) {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.CREATE_SKILLS)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.CREATE_SKILLS))
            .description('Create and store one or more agent skills (reusable, load-on-demand capabilities) in a ' +
            'single call. Pass every skill you currently know how to write in one `skills` array — do ' +
            "not spread multiple fully-specified skills across separate calls; each skill's instructions " +
            'field carries its own structured template. The whole batch is all-or-nothing: an invalid or ' +
            'duplicate-named skill rejects every skill in the call. It also attaches a `{ type: "skill", id }` ' +
            'ref per skill to the agent config (config.skills), so do not patch them in yourself; the agent ' +
            'config must already exist. Returns { ok: true, configMutated: true, agentId, configHash, skills: ' +
            '[{ id, name }, ...] } (same order as input, bodies are not echoed back) or { ok: false, errors }. ' +
            'Use the returned configHash as baseConfigHash for your next config write.')
            .systemInstruction('Never create a vague or placeholder skill. The description field is the routing contract the ' +
            'runtime uses to decide when to load the skill; the instructions must follow the required ' +
            'structured Markdown template (Overview, Inputs, Steps, Rules, Example, Gotchas) with each ' +
            'applicable section filled in with concrete, specific content. If you do not have enough domain ' +
            "detail to write a genuinely useful skill, derive it from the user's goal as stated assumptions " +
            'listed in your summary; ask the user clarifying questions only when even a reasonable ' +
            'assumption is impossible. Use references ' +
            'only for markdown supporting files under the references/ directory — references are not ' +
            'automatically loaded, so instructions must say exactly when to load each one by path; scripts and ' +
            'non-markdown linked files are not supported. Do not invent tool names or reference paths. Batch ' +
            'every skill you currently know how to write into one call.')
            .input(zod_1.z.object({
            skills: zod_1.z
                .array(createSkillInputSchema)
                .min(1)
                .max(20)
                .describe('Every skill to create, in the order they should be created.'),
        }))
            .handler(async ({ skills }) => {
            const editorLock = await this.getEditorLockFailure(agentId);
            if (editorLock)
                return editorLock;
            try {
                const created = await this.agentSkillsService.createAndAttachSkills(agentId, projectId, skills, { user, modifiedBy: 'builder' });
                return {
                    ok: true,
                    configHash: created.configHash,
                    skills: created.skills.map(({ id, skill }) => ({ id, name: skill.name })),
                };
            }
            catch (e) {
                const message = e instanceof skill_name_taken_error_1.SkillNameTakenError
                    ? `${(0, skill_name_taken_error_1.skillNameTakenToolMessage)(e.skillName)} The batch is all-or-nothing, so send every skill again.`
                    : e instanceof Error
                        ? e.message
                        : String(e);
                return { ok: false, errors: [{ message }] };
            }
        })
            .build();
    }
    buildCustomToolTool(agentId, projectId, user) {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.BUILD_CUSTOM_TOOL)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.BUILD_CUSTOM_TOOL))
            .description('Compile and store a custom tool. Pass the complete TypeScript source ' +
            'using `export default new Tool(...)` builder chain. The code is validated in a ' +
            'sandbox and saved against the agent. The returned `id` equals the tool name ' +
            'declared in the code (e.g. `new Tool("my_tool")` → id `"my_tool"`). ' +
            'This does NOT register the tool in the agent config — follow up with ' +
            'agent_builder_patch_config (or agent_builder_write_config) to add `{ type: "custom", id: "<tool name>" }` ' +
            'to `tools`.' +
            'Returns { ok: true, id, name } or { ok: false, errors }.')
            .input(zod_1.z.object({
            code: zod_1.z
                .string()
                .describe('Complete TypeScript source using export default new Tool(...)'),
        }))
            .handler(async ({ code }, ctx) => {
            const editorLock = await this.getEditorLockFailure(agentId);
            if (editorLock)
                return editorLock;
            try {
                const descriptor = await this.secureRuntime.describeToolSecurely(code);
                const built = await this.agentCustomToolsService.buildCustomTool(agentId, projectId, code, descriptor, { user, modifiedBy: 'builder' });
                return { ok: true, id: built.id, name: descriptor.name, changed: built.changed };
            }
            catch (e) {
                if (ctx.abortSignal ? ctx.abortSignal.aborted : (0, agents_1.isAbortError)(e))
                    throw e;
                return {
                    ok: false,
                    errors: [{ message: e instanceof Error ? e.message : String(e) }],
                };
            }
        })
            .build();
    }
    async getConfigSnapshot(agentId, projectId) {
        const agent = await this.agentsService.findById(agentId, projectId);
        if (!agent)
            throw new Error('Agent not found');
        const config = (0, agent_config_composition_1.composeJsonConfig)(agent, await this.agentSkillRefs.refsForDraft(agent, {}));
        return snapshotFromConfig(config);
    }
    async applyCredentialToMcpServer(agentId, projectId, serverName, credentialId, user) {
        if (await this.getEditorLockFailure(agentId)) {
            return { applied: false };
        }
        const snapshot = await this.getConfigSnapshot(agentId, projectId);
        const config = snapshot.config;
        const servers = config?.mcpServers;
        if (!config || !servers) {
            return { applied: false };
        }
        const serverIndex = servers.findIndex((server) => server.name === serverName);
        if (serverIndex === -1) {
            return { applied: false };
        }
        if (servers[serverIndex]?.credential === credentialId) {
            return { applied: false };
        }
        const patched = {
            ...config,
            mcpServers: servers.map((server, index) => index === serverIndex ? { ...server, credential: credentialId } : server),
        };
        const zodResult = parseBuilderWriteConfig(patched, snapshot.config);
        if (!zodResult.success) {
            throw new Error((0, api_types_1.formatZodErrors)(zodResult.error)[0]?.message ?? 'Invalid MCP server config');
        }
        const configWithDefaults = applyPromptCachingBuilderDefaults((0, agent_config_1.applyNativeWebSearchDefaultOn)(zodResult.data));
        const saved = await this.agentConfigService.updateConfig(agentId, projectId, configWithDefaults, user, { baseConfigHash: snapshot.configHash, modifiedBy: 'builder' });
        return { applied: true, config: saved.config, configHash: saved.configHash };
    }
    async applyFinishSetupToConfig(agentId, projectId, user, writes) {
        const empty = { credentialTypes: [], paths: [] };
        const editorLock = await this.getEditorLockFailure(agentId);
        if (editorLock)
            return { ...empty, errors: editorLock.errors };
        const snapshot = await this.getConfigSnapshot(agentId, projectId);
        if (!snapshot.config) {
            return { ...empty, errors: [{ path: '(root)', message: 'Agent has no JSON config yet.' }] };
        }
        const jsonpatch = (await import('fast-json-patch')).default;
        let next = jsonpatch.deepClone(snapshot.config);
        const credentialTypes = [];
        for (const credential of writes.credentials) {
            const filled = (0, reconcile_node_tool_gateway_credentials_1.assignCredentialToNodeTools)(next.tools, this.nodeTypes, credential.credentialType, {
                id: credential.id,
                name: credential.name,
            });
            if (filled > 0)
                credentialTypes.push(credential.credentialType);
        }
        const paths = [];
        const errors = [];
        for (const { path, value } of writes.values) {
            const op = { op: 'add', path, value };
            const invalid = jsonpatch.validate([op], next);
            if (invalid) {
                errors.push({ path, message: invalid.message ?? 'Config path does not resolve' });
                continue;
            }
            if (!isEmptyConfigValue(jsonpatch.getValueByPointer(next, path))) {
                errors.push({
                    path,
                    message: 'Config path already has a value. Patch it explicitly if it must change.',
                });
                continue;
            }
            next = jsonpatch.applyPatch(next, [op]).newDocument;
            paths.push(path);
        }
        if (credentialTypes.length === 0 && paths.length === 0) {
            return { ...empty, ...(errors.length ? { errors } : {}) };
        }
        const validated = this.validateBuilderConfig(next, snapshot.config);
        if (!validated.ok)
            return { ...empty, errors: validated.errors };
        const saved = await this.saveBuilderConfig(agentId, projectId, user, validated.config, snapshot.configHash, next, true);
        if (!saved.ok)
            return { ...empty, errors: saved.errors };
        return {
            credentialTypes,
            paths,
            configHash: saved.configHash,
            ...(errors.length ? { errors } : {}),
        };
    }
    async getFreshConfigSnapshot(agentId, projectId, baseConfigHash) {
        try {
            const snapshot = await this.getConfigSnapshot(agentId, projectId);
            if (baseConfigHash !== snapshot.configHash) {
                return { ok: false, stage: 'stale', errors: [STALE_CONFIG_ERROR], ...snapshot };
            }
            return { ok: true, snapshot };
        }
        catch (e) {
            return {
                ok: false,
                stage: 'stale',
                errors: [{ path: '(root)', message: e instanceof Error ? e.message : String(e) }],
            };
        }
    }
    validateBuilderConfig(incoming, currentConfig) {
        const parsed = parseBuilderWriteConfig(incoming, currentConfig);
        if (!parsed.success)
            return { ok: false, errors: (0, api_types_1.formatZodErrors)(parsed.error) };
        const emptyInstructions = (0, agent_config_1.rejectIfEmptyInstructions)(parsed.data, CLI_AGENT_CONFIG_MESSAGES);
        if (emptyInstructions)
            return { ok: false, errors: emptyInstructions };
        const unsupportedWebSearch = (0, agent_config_1.rejectIfUnsupportedNativeWebSearch)(parsed.data);
        if (unsupportedWebSearch)
            return { ok: false, errors: unsupportedWebSearch };
        const dynamicSelectorFromAi = (0, agent_config_1.rejectIfDynamicSelectorUsesFromAi)(parsed.data, currentConfig, this.nodeTypes, CLI_AGENT_CONFIG_MESSAGES);
        if (dynamicSelectorFromAi)
            return { ok: false, errors: dynamicSelectorFromAi };
        const config = applyPromptCachingBuilderDefaults((0, agent_config_1.applyNativeWebSearchDefaultOn)(parsed.data));
        return { ok: true, config };
    }
    async saveBuilderConfig(agentId, projectId, user, config, baseConfigHash, submitted, clearOmittedOptionalFields = false) {
        try {
            const saved = await this.agentConfigService.updateConfig(agentId, projectId, config, user, {
                baseConfigHash,
                clearOmittedOptionalFields,
                modifiedBy: 'builder',
            });
            return {
                ok: true,
                configHash: saved.configHash,
                ...((0, agent_config_hash_1.isSameAgentConfig)(saved.config, submitted) ? {} : { config: saved.config }),
            };
        }
        catch (e) {
            const errors = [{ path: '(root)', message: e instanceof Error ? e.message : String(e) }];
            if (!(e instanceof errors_1.ConflictError))
                return { ok: false, stage: 'schema', errors };
            const current = await this.getConfigSnapshot(agentId, projectId).catch(() => null);
            return {
                ok: false,
                stage: 'stale',
                errors: current ? [STALE_CONFIG_ERROR] : errors,
                ...(current ?? {}),
            };
        }
    }
    async writeBuilderConfig(agentId, projectId, user, input, baseConfigHash, track) {
        const editorLock = await this.getEditorLockFailure(agentId);
        if (editorLock)
            return editorLock;
        const parsed = readStructuredToolInput(input);
        if (!parsed.ok)
            return { ok: false, errors: parsed.errors };
        const fresh = await this.getFreshConfigSnapshot(agentId, projectId, baseConfigHash);
        if (!fresh.ok)
            return fresh;
        const merged = mergeOmittedTopLevelFields(parsed.data, fresh.snapshot.config);
        const validated = this.validateBuilderConfig(merged, fresh.snapshot.config);
        if (!validated.ok)
            return validated;
        const saved = await this.saveBuilderConfig(agentId, projectId, user, validated.config, fresh.snapshot.configHash, merged);
        if (saved.ok)
            trackRemovedTriggers(track, fresh.snapshot.config, validated.config);
        return saved;
    }
    async patchBuilderConfig(agentId, projectId, user, operations, baseConfigHash, track) {
        const editorLock = await this.getEditorLockFailure(agentId);
        if (editorLock)
            return { ...editorLock, stage: 'locked' };
        const parsed = readStructuredToolInput(operations);
        if (!parsed.ok)
            return { ok: false, stage: 'parse', errors: parsed.errors };
        const fresh = await this.getFreshConfigSnapshot(agentId, projectId, baseConfigHash);
        if (!fresh.ok)
            return fresh;
        if (!fresh.snapshot.config) {
            return {
                ok: false,
                stage: 'patch',
                errors: [{ path: '(root)', message: 'Agent has no JSON config yet.' }],
            };
        }
        const patched = await this.applyConfigPatch(parsed.data, fresh.snapshot.config);
        if (!patched.ok)
            return patched;
        const validated = this.validateBuilderConfig(patched.config, fresh.snapshot.config);
        if (!validated.ok)
            return { ...validated, stage: 'schema' };
        const saved = await this.saveBuilderConfig(agentId, projectId, user, validated.config, fresh.snapshot.configHash, patched.config, true);
        if (saved.ok)
            trackRemovedTriggers(track, fresh.snapshot.config, validated.config);
        return saved;
    }
    async applyConfigPatch(operations, config) {
        const jsonpatch = (await import('fast-json-patch')).default;
        const ops = operations;
        const patchError = jsonpatch.validate(ops, config);
        if (patchError) {
            const opPath = patchError.operation?.path ?? '(root)';
            return {
                ok: false,
                stage: 'patch',
                errors: [{ path: opPath, message: patchError.message ?? 'Invalid patch operation' }],
            };
        }
        return { ok: true, config: jsonpatch.applyPatch(jsonpatch.deepClone(config), ops).newDocument };
    }
    async formatDraftTestResult(result, ctx, agentId, user, previewPath, sessionNote) {
        if (result.status === 'session_not_found') {
            return {
                status: 'error',
                code: 'session_not_found',
                message: 'This test session is no longer available. Call agent_builder_call_agent again without sessionId to start a new test.',
            };
        }
        const note = sessionNote ? { sessionNote } : {};
        if (result.status === 'agent_misconfigured') {
            return {
                status: 'error',
                code: 'agent_misconfigured',
                message: "This agent isn't ready to run yet. Finish configuring it and try again.",
                missing: result.missing,
            };
        }
        if (result.status === 'completed' && result.maxIterations) {
            return {
                status: 'error',
                code: 'max_iterations',
                message: 'The agent stopped on its iteration cap before it answered. It did not complete the task. ' +
                    'A repeat of the same test gives the same result. Common causes: a tool that returns too much data, ' +
                    'so the agent re-queries it; instructions that loop; or a task that needs more steps than the cap allows. ' +
                    'Report this to the user and ask before you change the agent.',
                sessionId: result.sessionId,
                response: result.response,
                ...(result.executionId ? { executionId: result.executionId } : {}),
                ...note,
            };
        }
        if (result.status === 'completed')
            return { ...result, ...note };
        const approvals = (0, agent_test_run_service_1.collectStandardApprovals)(result);
        const firstApproval = approvals?.[0];
        if (firstApproval) {
            const { continuation, ...approval } = firstApproval;
            return await ctx.suspend(approval, {
                continuation: sessionNote ? { run: continuation, sessionNote } : continuation,
            });
        }
        return {
            ...(await this.cancelUnsupportedDraftTest(result, agentId, user, previewPath)),
            ...note,
        };
    }
    async cancelUnsupportedDraftTest(result, agentId, user, previewPath) {
        const cancelled = await this.agentTestRunService.cancelSuspendedRuns({
            agentId,
            suspensions: result.suspensions,
            userId: user.id,
        });
        if (!cancelled) {
            return {
                status: 'error',
                code: 'cancellation_failed',
                message: 'This test needs approval, but its suspended run could not be cancelled. Open Preview before continuing this session.',
                sessionId: result.sessionId,
                previewPath,
            };
        }
        return {
            status: 'approval_required',
            response: result.response,
            sessionId: result.sessionId,
            ...(result.executionId ? { executionId: result.executionId } : {}),
            suspensions: result.suspensions.map(({ runId, toolCallId, toolName }) => ({
                runId,
                toolCallId,
                toolName,
            })),
            previewPath,
        };
    }
    createModelLookup(user, projectId, options) {
        return {
            list: async (credentialId, credentialType, provider) => await this.builderModelLiveLookupService.list(user, projectId, credentialId, credentialType, provider, { useEvalModelCatalog: options?.useEvalModelCatalog === true }),
        };
    }
};
exports.AgentsBuilderToolsService = AgentsBuilderToolsService;
exports.AgentsBuilderToolsService = AgentsBuilderToolsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agents_service_1.AgentsService, agent_config_service_1.AgentConfigService, agent_custom_tools_service_1.AgentCustomToolsService, agent_integration_persistence_service_1.AgentIntegrationPersistenceService, agent_skills_service_1.AgentSkillsService, agent_secure_runtime_1.AgentSecureRuntime, agents_tools_service_1.AgentsToolsService, builder_model_live_lookup_service_1.BuilderModelLiveLookupService, mcp_registry_service_1.McpRegistryService, oauth_service_1.OauthService, credential_types_1.CredentialTypes, agent_task_service_1.AgentTaskService, agent_publish_service_1.AgentPublishService, agent_test_run_service_1.AgentTestRunService, ai_service_1.AiService, ai_gateway_service_1.AiGatewayService, backend_network_1.OutboundHttp, dynamic_node_parameters_service_1.DynamicNodeParametersService, node_types_1.NodeTypes, free_ai_credits_service_1.FreeAiCreditsService, telemetry_2.Telemetry, instance_ai_agent_context_adapter_1.InstanceAiAgentContextAdapterService, collaboration_service_1.CollaborationService, agent_skill_refs_service_1.AgentSkillRefsService])
], AgentsBuilderToolsService);
//# sourceMappingURL=agents-builder-tools.service.js.map