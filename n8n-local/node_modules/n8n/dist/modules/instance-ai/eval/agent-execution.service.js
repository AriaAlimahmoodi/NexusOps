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
exports.EvalAgentExecutionService = void 0;
exports.mcpUrlsMatch = mcpUrlsMatch;
exports.resolveCanonicalMcpCatalogs = resolveCanonicalMcpCatalogs;
exports.pruneConfigForEval = pruneConfigForEval;
exports.summarizeTools = summarizeTools;
const agents_1 = require("@n8n/agents");
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_service_1 = require("../../../credentials/credentials.service");
const agent_runtime_reconstruction_service_1 = require("../../../modules/agents/agent-runtime-reconstruction.service");
const agent_sandbox_principal_1 = require("../../../modules/agents/agent-sandbox-principal");
const agents_settings_service_1 = require("../../../modules/agents/agents-settings.service");
const agent_skill_refs_service_1 = require("../../../modules/agents/agent-skill-refs.service");
const agent_config_composition_1 = require("../../../modules/agents/json-config/agent-config-composition");
const agent_document_1 = require("../../../modules/agents/json-config/agent-document");
const agent_repository_1 = require("../../../modules/agents/repositories/agent.repository");
const agent_credential_provider_1 = require("../../../modules/agents/utils/agent-credential-provider");
const mcp_registry_service_1 = require("../../../modules/mcp-registry/registry/mcp-registry.service");
const check_access_1 = require("../../../permissions.ee/check-access");
const ai_proxy_fetch_1 = require("../../../utils/ai-proxy-fetch");
const agent_model_turn_recorder_1 = require("./agent-model-turn-recorder");
const agent_scenario_seed_1 = require("./agent-scenario-seed");
const eval_mocked_credentials_helper_1 = require("./eval-mocked-credentials-helper");
const ledger_snapshot_1 = require("./ledger-snapshot");
const mcp_mock_fetch_1 = require("./mcp-mock-fetch");
const mock_handler_1 = require("./mock-handler");
const request_sanitizer_1 = require("./request-sanitizer");
const web_search_mock_1 = require("./web-search-mock");
const DEFAULT_TIMEOUT_MS = 600_000;
const MAX_SCENARIO_HINT_CHARS = 2_000;
const DEFAULT_MAX_ITERATIONS = 25;
const MAX_ITERATIONS_CAP = 40;
const MAX_AUTO_APPROVALS = 20;
const MAX_RECORDED_TOOL_VALUE_CHARS = 4_000;
function mcpUrlsMatch(configUrl, remoteUrl) {
    const shorter = configUrl.length <= remoteUrl.length ? configUrl : remoteUrl;
    const longer = shorter === configUrl ? remoteUrl : configUrl;
    const base = shorter.replace(/\/+$/, '');
    return longer === shorter || longer === base || longer.startsWith(`${base}/`);
}
async function resolveCanonicalMcpCatalogs(mcpServers, moduleRegistry, logger) {
    if (mcpServers.length === 0)
        return undefined;
    const result = {};
    if (moduleRegistry.isActive('mcp-registry')) {
        try {
            const entries = await di_1.Container.get(mcp_registry_service_1.McpRegistryService).getAll();
            for (const server of mcpServers) {
                const entry = entries.find((candidate) => candidate.remotes.some((remote) => mcpUrlsMatch(server.url, remote.url)));
                if (entry && entry.tools.length > 0) {
                    result[server.name] = entry.tools.map((tool) => ({
                        name: tool.name,
                        description: tool.title ?? tool.name,
                    }));
                }
            }
        }
        catch (error) {
            logger.debug(`[EvalAgentMock] MCP registry catalog lookup failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    for (const server of mcpServers) {
        if (result[server.name])
            continue;
        const permissions = server.toolPermissions;
        if (permissions?.categories.read === 'blocked' && permissions.categories.write === 'blocked') {
            const allowedTools = Object.entries(permissions.tools ?? {})
                .filter(([, permission]) => permission !== 'blocked')
                .map(([name]) => ({ name, description: name }));
            if (allowedTools.length > 0)
                result[server.name] = allowedTools;
        }
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
let EvalAgentExecutionService = class EvalAgentExecutionService {
    constructor(logger, executionsConfig, moduleRegistry, outboundHttp, credentialsService) {
        this.logger = logger;
        this.executionsConfig = executionsConfig;
        this.moduleRegistry = moduleRegistry;
        this.outboundHttp = outboundHttp;
        this.credentialsService = credentialsService;
    }
    async executeWithLlmMock(agentId, user, options, caseInput) {
        if (this.executionsConfig.mode === 'queue') {
            return this.errorResult('Agent eval execution requires main process mode — queue mode is not supported.');
        }
        if (!this.moduleRegistry.isActive('agents')) {
            return this.errorResult('Agent eval execution requires the agents module to be active.');
        }
        if (!(await di_1.Container.get(agents_settings_service_1.AgentsSettingsService).getEnabled())) {
            return this.errorResult('Agents are disabled. Ask an instance admin to enable them in Settings > Agents.');
        }
        const { projectId } = options;
        if (!(await (0, check_access_1.userHasScopes)(user, ['agent:execute'], false, { projectId }))) {
            return this.errorResult(`Agent ${agentId} not found or not accessible`);
        }
        const agentEntity = await di_1.Container.get(agent_repository_1.AgentRepository).findByIdAndProjectId(agentId, projectId);
        if (!agentEntity) {
            return this.errorResult(`Agent ${agentId} not found or not accessible`);
        }
        if (!agentEntity.schema) {
            return this.errorResult(`Agent ${agentId} has no JSON config to run.`);
        }
        const agentSkillRefs = di_1.Container.get(agent_skill_refs_service_1.AgentSkillRefsService);
        const skillRefs = await agentSkillRefs.refsForDraft(agentEntity, {});
        const { config, skippedFeatures } = pruneConfigForEval((0, agent_document_1.toAgentDocument)(agentEntity.schema, skillRefs));
        const pruned = (0, agent_document_1.fromAgentDocument)(config);
        if ((agentEntity.integrations ?? []).length > 0) {
            skippedFeatures.push({
                feature: 'integrations',
                reason: 'Chat integrations are not attached in eval runs — the harness drives the agent directly.',
            });
        }
        agentEntity.schema = pruned.config;
        agentEntity.integrations = [];
        const toolSummaries = summarizeTools(config, agentEntity.tools ?? {}, agent_config_composition_1.sanitizeToolName);
        const scenarioSignal = options.scenarioHints ??
            (caseInput !== undefined
                ? (0, request_sanitizer_1.truncateForLlm)((0, request_sanitizer_1.redactSecretValuePatterns)(caseInput), MAX_SCENARIO_HINT_CHARS)
                : undefined);
        let seed;
        try {
            seed = await (0, agent_scenario_seed_1.generateAgentScenarioSeed)({
                agentName: config.name,
                instructions: config.instructions,
                tools: toolSummaries,
                scenarioHints: scenarioSignal,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return this.errorResult(message.startsWith('FRAMEWORK ISSUE:') ? message : `FRAMEWORK ISSUE: ${message}`);
        }
        if (caseInput !== undefined) {
            seed = { ...seed, openingMessage: caseInput };
        }
        const mockHandler = (0, mock_handler_1.createLlmMockHandler)({
            scenarioHints: scenarioSignal,
            globalContext: seed.globalContext,
            nodeHints: seed.toolHints,
        });
        const toolLedger = new Map();
        const credentialHelpers = [];
        const recorder = (0, agent_model_turn_recorder_1.createAgentModelTurnRecorder)((0, ai_proxy_fetch_1.createAiProxyFetch)(this.outboundHttp), this.logger);
        const pendingMcpCalls = new Map();
        const mcpCallIdentity = (serverName, toolName) => JSON.stringify([serverName, toolName]);
        const mcpServers = config.mcpServers ?? [];
        const knownToolsByServer = await resolveCanonicalMcpCatalogs(mcpServers, this.moduleRegistry, this.logger);
        const mcpFetch = (0, mcp_mock_fetch_1.createMcpMockFetch)({
            servers: mcpServers.map((server) => ({
                name: server.name,
                url: server.url,
                description: server.description,
            })),
            agentInstructions: config.instructions,
            scenarioHints: scenarioSignal,
            globalContext: seed.globalContext,
            serverHints: seed.toolHints,
            knownToolsByServer,
            logger: this.logger,
            onToolCall: (call) => {
                const identity = mcpCallIdentity(call.serverName, call.toolName);
                const calls = pendingMcpCalls.get(identity) ?? [];
                calls.push(call);
                pendingMcpCalls.set(identity, calls);
            },
        });
        const recordSettledMcpCall = (serverName, toolName, modelToolName) => {
            const identity = mcpCallIdentity(serverName, toolName);
            const calls = pendingMcpCalls.get(identity);
            if (!calls)
                return;
            const call = calls.shift();
            if (!call)
                return;
            if (calls.length === 0)
                pendingMcpCalls.delete(identity);
            const key = modelToolName ?? (0, agents_1.sanitizeToolName)(`${serverName}_${toolName}`);
            let entries = toolLedger.get(key);
            if (!entries) {
                entries = [];
                toolLedger.set(key, entries);
            }
            entries.push({
                url: mcpServers.find((server) => server.name === serverName)?.url ?? serverName,
                method: 'POST',
                nodeType: `mcp:${serverName}`,
                requestBody: call.args,
                mockResponse: call.result,
            });
        };
        const webSearchMock = (0, web_search_mock_1.createWebSearchMock)({
            agentInstructions: config.instructions,
            scenarioHints: scenarioSignal,
            globalContext: seed.globalContext,
            searchHint: seed.toolHints?.web_search,
            logger: this.logger,
            onSearch: (args, result) => {
                let entries = toolLedger.get('web_search');
                if (!entries) {
                    entries = [];
                    toolLedger.set('web_search', entries);
                }
                entries.push({
                    url: 'mock://web-search',
                    method: 'POST',
                    nodeType: 'web-search:fallback',
                    requestBody: args,
                    mockResponse: result,
                });
            },
        });
        const reconstruction = di_1.Container.get(agent_runtime_reconstruction_service_1.AgentRuntimeReconstructionService);
        const credentialProvider = (0, agent_credential_provider_1.createAgentCredentialProvider)(this.credentialsService, projectId, user, agentId);
        let agent;
        try {
            ({ agent } = await reconstruction.reconstructFromAgentEntity({
                agent: agentEntity,
                skillRefs: pruned.skillRefs,
                skills: await agentSkillRefs.skillsForRefs(agentEntity, pruned.skillRefs, {}),
            }, credentialProvider, 'test', undefined, user, {
                modelFetch: recorder.fetch,
                mcpFetch,
                onMcpToolCallSettled: ({ serverName, toolName, modelToolName }) => {
                    recordSettledMcpCall(serverName, toolName, modelToolName);
                },
                webSearch: webSearchMock,
                transformDelegatedAgentConfig: (childConfig, delegationContext) => {
                    const pruned = pruneConfigForEval(childConfig);
                    skippedFeatures.push(...pruned.skippedFeatures.map((skip) => ({
                        ...skip,
                        feature: `subAgent ${delegationContext.subAgentId}: ${skip.feature}`,
                    })));
                    return pruned.config;
                },
                configureToolAdditionalData: (additionalData, toolContext) => {
                    const helper = new eval_mocked_credentials_helper_1.EvalMockedCredentialsHelper(additionalData.credentialsHelper, undefined, this.logger);
                    credentialHelpers.push(helper);
                    additionalData.credentialsHelper = helper;
                    additionalData.evalLlmMockHandler = this.createRecordingMockHandler(mockHandler, toolContext.toolName, toolLedger);
                },
            }, 'manual', (0, agent_sandbox_principal_1.hashAgentSandboxPrincipal)({ type: 'n8n-user', userId: user.id })));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return this.errorResult(`Failed to build agent runtime: ${message}`, seed, skippedFeatures);
        }
        const errors = [];
        const autoApprovedToolNames = new Set();
        const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        const maxIterations = Math.min(config.config?.maxIterations ?? DEFAULT_MAX_ITERATIONS, MAX_ITERATIONS_CAP);
        let result;
        const segmentToolCalls = [];
        const collectToolCalls = (segment) => {
            for (const entry of segment.toolCalls ?? []) {
                if (!segmentToolCalls.includes(entry))
                    segmentToolCalls.push(entry);
            }
        };
        const budgetSignal = AbortSignal.timeout(timeoutMs);
        try {
            result = await agent.generate(seed.openingMessage, {
                abortSignal: budgetSignal,
                maxIterations,
            });
            collectToolCalls(result);
            let approvals = 0;
            while (approvals < MAX_AUTO_APPROVALS) {
                const pending = result.pendingSuspend?.[0];
                if (!pending)
                    break;
                autoApprovedToolNames.add(pending.toolName);
                approvals++;
                result = await agent.approve('generate', {
                    runId: pending.runId,
                    toolCallId: pending.toolCallId,
                    abortSignal: budgetSignal,
                    maxIterations,
                });
                collectToolCalls(result);
            }
            if ((result.pendingSuspend?.length ?? 0) > 0) {
                errors.push(`Run still suspended after ${MAX_AUTO_APPROVALS} auto-approvals`);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await recorder.flush();
            if (budgetSignal.aborted) {
                const seconds = Math.round(timeoutMs / 1000);
                return this.errorResult(`Agent run exceeded its ${seconds}s eval budget and was stopped`, seed, skippedFeatures, { modelTurns: recorder.turns, toolLedger, credentialHelpers });
            }
            return this.errorResult(`Agent run failed: ${message}`, seed, skippedFeatures, {
                modelTurns: recorder.turns,
                toolLedger,
                credentialHelpers,
            });
        }
        finally {
            await recorder.flush();
            try {
                await agent.close();
            }
            catch (error) {
                this.logger.warn('[EvalAgentMock] Agent runtime teardown failed', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        if (result.error !== undefined) {
            errors.push(`Model run error: ${result.error instanceof Error ? result.error.message : String(result.error)}`);
        }
        const kindByToolName = new Map(toolSummaries.map((tool) => [tool.name, tool.kind]));
        const kindForTool = (tool) => kindByToolName.get(tool) ??
            (mcpServers.some((server) => tool.startsWith((0, agents_1.sanitizeToolName)(`${server.name}_`))) ||
                (toolLedger.get(tool) ?? []).some((request) => request.nodeType?.startsWith('mcp:'))
                ? 'mcp'
                : 'other');
        const toolCalls = segmentToolCalls.map((entry) => {
            const interceptedRequests = toolLedger.get(entry.tool) ?? [];
            return {
                tool: entry.tool,
                kind: kindForTool(entry.tool),
                input: truncateRecordedValue(entry.input),
                output: truncateRecordedValue(entry.output),
                ...(entry.canceled ? { error: 'canceled' } : {}),
                mocked: interceptedRequests.length > 0,
                interceptedRequests,
                ...(autoApprovedToolNames.has(entry.tool) ? { autoApproved: true } : {}),
            };
        });
        const reportedTools = new Set(toolCalls.map((entry) => entry.tool));
        for (const [tool, interceptedRequests] of toolLedger) {
            if (reportedTools.has(tool))
                continue;
            toolCalls.push({
                tool,
                kind: kindForTool(tool),
                error: 'Not attributed to a reported tool call (a delegated sub-agent call, or an errored call) — see interceptedRequests',
                mocked: interceptedRequests.length > 0,
                interceptedRequests,
                ...(autoApprovedToolNames.has(tool) ? { autoApproved: true } : {}),
            });
        }
        return {
            runId: result.runId,
            success: errors.length === 0 && result.finishReason !== 'error',
            errors,
            finalText: extractFinalAssistantText(result),
            model: result.model,
            finishReason: result.finishReason,
            toolCalls,
            modelTurns: recorder.turns,
            ...(result.usage
                ? {
                    usage: {
                        inputTokens: result.usage.promptTokens,
                        outputTokens: result.usage.completionTokens,
                    },
                }
                : {}),
            seed,
            skippedFeatures,
            mockedCredentials: credentialHelpers.flatMap((helper) => helper.mockedCredentials),
        };
    }
    createRecordingMockHandler(mockHandler, toolName, ledger) {
        return async (requestOptions, node) => {
            const response = await mockHandler(requestOptions, node);
            let entries = ledger.get(toolName);
            if (!entries) {
                entries = [];
                ledger.set(toolName, entries);
            }
            entries.push({
                url: requestOptions.url ?? '(no URL)',
                method: requestOptions.method ?? 'GET',
                nodeType: node.type,
                requestBody: requestOptions.body,
                mockResponse: (0, ledger_snapshot_1.snapshotLedgerBody)(response?.body),
            });
            this.logger.debug(`[EvalAgentMock] Intercepted ${requestOptions.method ?? 'GET'} ${requestOptions.url} from tool "${toolName}" (${node.type})`);
            return response;
        };
    }
    errorResult(message, seed, skippedFeatures = [], partial) {
        this.logger.error(`[EvalAgentMock] ${message}`);
        return {
            runId: '',
            success: false,
            errors: [message],
            finalText: '',
            toolCalls: partial
                ? [...partial.toolLedger.entries()].map(([tool, interceptedRequests]) => ({
                    tool,
                    kind: salvagedToolKind(interceptedRequests),
                    mocked: interceptedRequests.length > 0,
                    interceptedRequests,
                }))
                : [],
            modelTurns: partial?.modelTurns ?? [],
            seed: seed ?? { openingMessage: '', globalContext: '', toolHints: {}, warnings: [] },
            skippedFeatures,
            mockedCredentials: (partial?.credentialHelpers ?? []).flatMap((helper) => helper.mockedCredentials),
        };
    }
};
exports.EvalAgentExecutionService = EvalAgentExecutionService;
exports.EvalAgentExecutionService = EvalAgentExecutionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.ExecutionsConfig, backend_common_1.ModuleRegistry, backend_network_1.OutboundHttp, credentials_service_1.CredentialsService])
], EvalAgentExecutionService);
function pruneConfigForEval(original) {
    const skippedFeatures = [];
    const config = { ...original };
    if (config.memory?.enabled) {
        skippedFeatures.push({
            feature: 'memory',
            reason: 'Observational/episodic memory worker models and embeddings are not mockable yet — memory is disabled for the run.',
        });
        config.memory = undefined;
    }
    if ((config.vectorStores?.length ?? 0) > 0) {
        skippedFeatures.push({
            feature: 'vectorStores',
            reason: 'Vector stores use native DB clients the mock layer cannot intercept.',
        });
        config.vectorStores = undefined;
    }
    const sseServers = (config.mcpServers ?? []).filter((server) => server.transport === 'sse');
    if (sseServers.length > 0) {
        skippedFeatures.push({
            feature: 'mcpServers (sse transport)',
            reason: `SSE-transport MCP servers are not mockable yet (streamable-HTTP ones are): ${sseServers.map((server) => server.name).join(', ')}.`,
        });
        const remaining = (config.mcpServers ?? []).filter((server) => server.transport !== 'sse');
        config.mcpServers = remaining.length > 0 ? remaining : undefined;
    }
    return { config, skippedFeatures };
}
function salvagedToolKind(interceptedRequests) {
    const nodeType = interceptedRequests.find((request) => request.nodeType)?.nodeType;
    if (!nodeType)
        return 'other';
    if (nodeType.startsWith('mcp:'))
        return 'mcp';
    if (nodeType === 'web-search:fallback')
        return 'other';
    return 'node';
}
function summarizeTools(config, customTools, sanitizeWorkflowToolName) {
    const summaries = [];
    for (const ref of config.tools ?? []) {
        if (ref.type === 'node') {
            summaries.push({
                name: (0, n8n_workflow_1.nodeNameToToolName)(ref.name),
                kind: 'node',
                description: ref.description,
                nodeType: ref.node.nodeType,
            });
        }
        else if (ref.type === 'workflow') {
            summaries.push({
                name: sanitizeWorkflowToolName(ref.name ?? ref.workflow),
                kind: 'workflow',
                description: ref.description,
            });
        }
        else {
            const descriptor = customTools[ref.id]?.descriptor;
            if (descriptor) {
                summaries.push({
                    name: descriptor.name,
                    kind: 'custom',
                    description: descriptor.description,
                });
            }
        }
    }
    for (const server of config.mcpServers ?? []) {
        summaries.push({
            name: server.name,
            kind: 'mcp',
            description: server.description ?? `MCP tool server at ${server.url}`,
        });
    }
    if (config.config?.webSearch?.enabled &&
        !((0, agent_config_1.isNativeWebSearchRequested)(config) && (0, agent_config_1.hasNativeWebSearchProvider)(config.model))) {
        summaries.push({
            name: 'web_search',
            kind: 'other',
            description: 'Web search returning {title, url, snippet} result lists',
        });
    }
    return summaries;
}
function truncateRecordedValue(value) {
    if (value === undefined || value === null)
        return value;
    let serialized;
    try {
        serialized = JSON.stringify(value);
    }
    catch {
        return '[unserializable value]';
    }
    if (serialized === undefined || serialized.length <= MAX_RECORDED_TOOL_VALUE_CHARS)
        return value;
    return (0, request_sanitizer_1.truncateForLlm)(serialized, MAX_RECORDED_TOOL_VALUE_CHARS);
}
function extractFinalAssistantText(result) {
    for (let i = result.messages.length - 1; i >= 0; i--) {
        const message = result.messages[i];
        if (!('role' in message) || message.role !== 'assistant')
            continue;
        const texts = message.content
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .filter((text) => text.trim().length > 0);
        if (texts.length > 0)
            return texts.join('\n');
    }
    return '';
}
//# sourceMappingURL=agent-execution.service.js.map