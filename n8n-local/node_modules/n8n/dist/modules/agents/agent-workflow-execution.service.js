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
exports.AgentWorkflowExecutionService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const api_1 = require("@opentelemetry/api");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_service_1 = require("../../credentials/credentials.service");
const execution_level_tracer_1 = require("../../modules/otel/execution-level-tracer");
const telemetry_1 = require("../../telemetry");
const agent_run_tracing_service_1 = require("./agent-run-tracing.service");
const agent_runtime_reconstruction_service_1 = require("./agent-runtime-reconstruction.service");
const agents_settings_service_1 = require("./agents-settings.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_sandbox_principal_1 = require("./agent-sandbox-principal");
const agent_telemetry_1 = require("./agent-telemetry");
const agent_turn_execution_service_1 = require("./agent-turn-execution.service");
const budget_guardrail_1 = require("./budget-guardrail");
const integration_message_context_1 = require("./integrations/integration-message-context");
const integration_message_context_service_1 = require("./integrations/integration-message-context.service");
const agent_document_1 = require("./json-config/agent-document");
const node_tool_ai_gateway_service_1 = require("./json-config/node-tool-ai-gateway.service");
const model_stream_stall_options_1 = require("./model-stream-stall-options");
const agent_repository_1 = require("./repositories/agent.repository");
const input_data_tool_1 = require("./tools/input-data-tool");
const workflow_context_tool_1 = require("./tools/workflow-context-tool");
const agent_credential_provider_1 = require("./utils/agent-credential-provider");
const agent_execution_counter_1 = require("./utils/agent-execution-counter");
const agent_published_snapshot_1 = require("./utils/agent-published-snapshot");
const agent_stream_1 = require("./utils/agent-stream");
const node_tool_validation_1 = require("./utils/node-tool-validation");
const structured_output_error_1 = require("./utils/structured-output-error");
const agent_queued_message_1 = require("./types/agent-queued-message");
const execution_input_1 = require("./utils/execution-input");
const workflow_agent_stream_1 = require("./workflow-agent-stream");
function getFinalWorkflowResponse(messageRecord) {
    let lastToolCallIndex = -1;
    for (let index = messageRecord.timeline.length - 1; index >= 0; index--) {
        if (messageRecord.timeline[index]?.type === 'tool-call') {
            lastToolCallIndex = index;
            break;
        }
    }
    if (lastToolCallIndex === -1)
        return messageRecord.assistantResponse;
    return messageRecord.timeline
        .slice(lastToolCallIndex + 1)
        .filter((event) => event.type === 'text')
        .map((event) => event.content)
        .join('');
}
function createWorkflowAgentExecutionError(message, cause) {
    return new n8n_workflow_1.OperationalError(message, {
        description: message,
        ...(cause ? { cause } : {}),
    });
}
const WORKFLOW_AGENT_CLOSE_TIMEOUT_MS = 10_000;
let AgentWorkflowExecutionService = class AgentWorkflowExecutionService {
    constructor(logger, agentRepository, turnExecutionService, telemetry, credentialsService, agentRuntimeReconstructionService, agentRunTracingService, executionLevelTracer, nodeToolAiGatewayService, aiConfig, integrationMessageContextService, settingsService, agentSkillRefs) {
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.turnExecutionService = turnExecutionService;
        this.telemetry = telemetry;
        this.credentialsService = credentialsService;
        this.agentRuntimeReconstructionService = agentRuntimeReconstructionService;
        this.agentRunTracingService = agentRunTracingService;
        this.executionLevelTracer = executionLevelTracer;
        this.nodeToolAiGatewayService = nodeToolAiGatewayService;
        this.aiConfig = aiConfig;
        this.integrationMessageContextService = integrationMessageContextService;
        this.settingsService = settingsService;
        this.agentSkillRefs = agentSkillRefs;
    }
    normalizeWorkflowStreamError(error, outputSchema) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        if (!outputSchema || normalizedError instanceof n8n_workflow_1.OperationalError) {
            if ('description' in normalizedError && typeof normalizedError.description === 'string') {
                return normalizedError;
            }
            return createWorkflowAgentExecutionError(normalizedError.message, normalizedError);
        }
        const structuredOutputError = (0, structured_output_error_1.describeStructuredOutputError)(normalizedError.message);
        if (!structuredOutputError) {
            return createWorkflowAgentExecutionError(normalizedError.message, normalizedError);
        }
        return createWorkflowAgentExecutionError(structuredOutputError, normalizedError);
    }
    applyPerCallAgentExtras(reconstructed, outputSchema, extraTools) {
        if (outputSchema) {
            reconstructed.structuredOutput(outputSchema);
        }
        if (extraTools?.length) {
            const declared = new Set(reconstructed.declaredTools.map((t) => t.name));
            const collisions = extraTools.filter((t) => declared.has(t.name)).map((t) => t.name);
            if (collisions.length) {
                const names = collisions.map((n) => `"${n}"`).join(', ');
                const plural = collisions.length > 1;
                return {
                    ok: false,
                    error: `Agent declares ${plural ? 'tools' : 'a tool'} named ${names}, ` +
                        `which ${plural ? 'are' : 'is'} reserved by n8n for workflow data access. ` +
                        `Rename the agent ${plural ? 'tools' : 'tool'} to avoid the collision.`,
                };
            }
            reconstructed.tool(extraTools);
        }
        return { ok: true, agent: reconstructed };
    }
    async compileIsolated(runSource, credentialProvider, runType, outputSchema, extraTools, sandboxPrincipalHash, instrumentation) {
        if (!runSource.agent.schema) {
            return { ok: false, error: 'Agent has no JSON config. Create a config first.' };
        }
        try {
            const reconstructed = await this.agentRuntimeReconstructionService.reconstructFromAgentEntity(runSource, credentialProvider, runType, undefined, undefined, instrumentation, 'manual', sandboxPrincipalHash, { supportsHitl: false, allowPlanTools: false });
            const applied = this.applyPerCallAgentExtras(reconstructed.agent, outputSchema, extraTools);
            if (!applied.ok)
                return applied;
            return { ...applied, budget: reconstructed.budget };
        }
        catch (e) {
            return {
                ok: false,
                error: e instanceof Error ? e.message : 'Unknown compilation error',
            };
        }
    }
    async compileIsolatedFromSource(config, skills, syntheticAgentId, projectId, credentialProvider, runType, outputSchema, extraTools, instrumentation) {
        try {
            const reconstructed = await this.agentRuntimeReconstructionService.reconstructFromResolvedSource({
                config,
                memoryOwnerAgentId: syntheticAgentId,
                projectId,
                credentialProvider,
                toolDescriptors: {},
                toolCodeByName: {},
                skills,
                runtimeProfile: 'inline',
                runType,
                ...(instrumentation ? { instrumentation } : {}),
            });
            const applied = this.applyPerCallAgentExtras(reconstructed.agent, outputSchema, extraTools);
            if (!applied.ok)
                return applied;
            return { ...applied, budget: reconstructed.budget };
        }
        catch (e) {
            return {
                ok: false,
                error: e instanceof Error ? e.message : 'Unknown compilation error',
            };
        }
    }
    buildWorkflowExtraTools(workflowContext) {
        if (!workflowContext)
            return undefined;
        const extraTools = [(0, input_data_tool_1.createInputDataTool)(workflowContext)];
        if (workflowContext.exposeWorkflowData) {
            extraTools.push((0, workflow_context_tool_1.createWorkflowContextTool)(workflowContext));
        }
        return extraTools;
    }
    async consumeWorkflowAgentStream(params, recorder, streamAdapter) {
        const state = {
            structuredOutput: null,
            toolCalls: [],
            toolInputs: new Map(),
            streamError: undefined,
            executionError: undefined,
            executionStarted: false,
        };
        try {
            const { tracing } = params;
            const parentCtx = tracing.executionId
                ? this.executionLevelTracer.getActiveContext(tracing.executionId, tracing.nodeName)
                : undefined;
            const run = async () => await this.runWorkflowAgentStream(params, recorder, streamAdapter, state, parentCtx !== undefined);
            if (parentCtx) {
                await api_1.context.with(parentCtx, run);
            }
            else {
                await run();
            }
        }
        catch (error) {
            state.executionError = error;
            const normalizedError = this.normalizeWorkflowStreamError(error, params.outputSchema);
            recorder.record({ type: 'error', error: normalizedError });
            recorder.record({ type: 'finish', finishReason: 'error' });
            state.streamError = normalizedError;
            streamAdapter.fail();
        }
        return state;
    }
    async runWorkflowAgentStream(params, recorder, streamAdapter, state, hasParentContext) {
        const options = await this.getWorkflowStreamOptions(params, hasParentContext);
        state.executionStarted = true;
        const resultStream = await params.agentInstance.stream((0, execution_input_1.bindExecutionInput)(params.message, params.admission?.inputMessageIds ?? []), options);
        for await (const value of (0, agent_stream_1.streamAgentChunks)(resultStream.stream)) {
            this.recordWorkflowChunk(value, params.outputSchema, recorder, state);
            await streamAdapter.observe(value);
            this.collectWorkflowChunk(value, state);
        }
    }
    async getWorkflowStreamOptions(params, hasParentContext) {
        const { telemetryAgentId, savedAgentId, telemetryUserId, runType, tracing, threadId, recordingParams, sandboxScope, budget, } = params;
        const telemetry = await this.agentRunTracingService.build({
            agentId: telemetryAgentId,
            projectId: tracing.projectId,
            threadId,
            userId: telemetryUserId,
            source: 'workflow',
            executionId: tracing.executionId,
            workflowId: tracing.workflowId,
            nodeId: tracing.nodeId,
            hasParentContext,
        });
        const messageContext = recordingParams
            ? await this.integrationMessageContextService.getLatest(threadId)
            : null;
        return (0, budget_guardrail_1.withBudgetGuardrail)({
            persistence: {
                resourceId: threadId,
                threadId,
                hostMetadata: {
                    ...(params.admission && { [agent_queued_message_1.EXECUTION_METADATA_KEY]: params.admission.executionId }),
                    ...(sandboxScope ? (0, agent_sandbox_principal_1.encodeAgentSandboxHostMetadata)(sandboxScope) : {}),
                    ...(0, integration_message_context_1.encodeIntegrationMessageContext)(messageContext),
                },
            },
            executionCounter: (0, agent_execution_counter_1.createAgentExecutionCounter)(this.telemetry, {
                agentId: telemetryAgentId,
                userId: telemetryUserId,
                runType,
                source: api_types_1.AGENT_WORKFLOW_TRIGGER_TYPE,
            }),
            ...(0, model_stream_stall_options_1.modelStreamStallOptions)(this.aiConfig),
            ...(telemetry ? { telemetry } : {}),
        }, {
            budget,
            sessionId: threadId,
            agentId: telemetryAgentId,
            ...(savedAgentId ? { alertAgentId: savedAgentId } : {}),
        });
    }
    recordWorkflowChunk(value, outputSchema, recorder, state) {
        if (value.type === 'error') {
            state.executionError = value.error;
            if (outputSchema)
                state.streamError = this.normalizeWorkflowStreamError(value.error, outputSchema);
        }
        recorder.record(value.type === 'error' && state.streamError ? { ...value, error: state.streamError } : value);
    }
    collectWorkflowChunk(value, state) {
        switch (value.type) {
            case 'tool-call':
                state.toolInputs.set(value.toolCallId, { toolName: value.toolName, input: value.input });
                break;
            case 'tool-result':
                state.toolCalls.push({
                    toolName: value.toolName,
                    input: state.toolInputs.get(value.toolCallId)?.input ?? null,
                    result: value.output,
                });
                state.toolInputs.delete(value.toolCallId);
                break;
            case 'finish':
                if (value.structuredOutput !== undefined)
                    state.structuredOutput = value.structuredOutput;
        }
    }
    async streamWorkflowAgent(params) {
        await this.settingsService.assertEnabled();
        const { recordingParams } = params;
        const streamAdapter = new workflow_agent_stream_1.WorkflowAgentStreamAdapter(params.streamObserver);
        let agentExecutionId;
        let admission;
        const recorder = this.turnExecutionService.createRecorder(undefined, () => agentExecutionId, recordingParams);
        if (recordingParams) {
            admission = await this.turnExecutionService.startExecution(recordingParams, recorder.startedAt);
            agentExecutionId = admission.executionId;
        }
        const { structuredOutput, toolCalls, streamError, executionError, executionStarted } = await this.consumeWorkflowAgentStream({ ...params, admission }, recorder, streamAdapter);
        const messageRecord = recorder.getMessageRecord();
        if (recordingParams && agentExecutionId) {
            await this.turnExecutionService.finalizeExecution({
                executionId: agentExecutionId,
                executionStarted,
                executionError,
                params: { ...recordingParams, record: messageRecord },
            });
        }
        return {
            recorder,
            messageRecord: {
                ...messageRecord,
                assistantResponse: getFinalWorkflowResponse(messageRecord),
            },
            structuredOutput,
            toolCalls,
            streamError,
        };
    }
    buildWorkflowResult(params) {
        const { run, session, outputSchema } = params;
        this.assertWorkflowRunSucceeded(run, outputSchema);
        const { messageRecord, structuredOutput, toolCalls } = run;
        return {
            response: messageRecord.assistantResponse,
            structuredOutput: structuredOutput ?? null,
            usage: messageRecord.usage
                ? {
                    promptTokens: messageRecord.usage.promptTokens,
                    completionTokens: messageRecord.usage.completionTokens,
                    totalTokens: messageRecord.usage.totalTokens,
                }
                : null,
            toolCalls,
            finishReason: messageRecord.finishReason,
            session,
        };
    }
    assertWorkflowRunSucceeded(run, outputSchema) {
        const { recorder, messageRecord, streamError } = run;
        if (streamError !== undefined) {
            throw streamError;
        }
        if (recorder.suspended) {
            throw createWorkflowAgentExecutionError('Agent execution suspended waiting for tool approval. ' +
                'Suspend/resume is not supported in workflow execution context.');
        }
        if (messageRecord.error) {
            throw createWorkflowAgentExecutionError(this.workflowFailureMessage(messageRecord.error, outputSchema));
        }
        if (messageRecord.finishReason === 'error') {
            throw createWorkflowAgentExecutionError(outputSchema
                ? 'Agent execution finished with an error while producing structured output. ' +
                    "The agent's model or provider may not support JSON Schema structured output."
                : 'Agent execution finished with an error.');
        }
    }
    workflowFailureMessage(message, outputSchema) {
        if (outputSchema) {
            const structuredOutputError = (0, structured_output_error_1.describeStructuredOutputError)(message);
            if (structuredOutputError)
                return structuredOutputError;
        }
        return `Agent execution failed: ${message}`;
    }
    async executeForWorkflow(agentId, message, executionId, threadId, projectId, telemetryUserId, useDraftVersion, outputSchema, workflowContext, sandboxScope, { streamObserver, prepareForEval } = {}) {
        return await this.executeForWorkflowInternal({
            agentId,
            message,
            executionId,
            threadId,
            projectId,
            telemetryUserId,
            useDraftVersion,
            outputSchema,
            workflowContext,
            sandboxScope,
            streamObserver,
            prepareForEval,
        });
    }
    async closeAgentQuietly(agent) {
        const close = agent.close();
        void close.catch(() => { });
        let timeoutId;
        const timeout = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error(`Agent close timed out after ${WORKFLOW_AGENT_CLOSE_TIMEOUT_MS}ms`));
            }, WORKFLOW_AGENT_CLOSE_TIMEOUT_MS);
        });
        try {
            await Promise.race([close, timeout]);
        }
        catch (error) {
            this.logger.warn('Failed to close workflow agent after execution', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    async executeForWorkflowInternal(params) {
        const { agentId, projectId, threadId, outputSchema, sandboxScope } = params;
        const { agentInstance, recordingParams, runType, budget } = await this.prepareStoredWorkflowRun(params);
        try {
            const run = await this.streamCompiledWorkflowAgent(agentInstance, params, {
                telemetryAgentId: agentId,
                savedAgentId: agentId,
                runType,
                budget,
                recordingParams: { ...recordingParams, agentName: agentInstance.name },
                ...(sandboxScope
                    ? { sandboxScope: { projectId, principalHash: sandboxScope.principalHash } }
                    : {}),
            });
            return this.buildWorkflowResult({
                run,
                session: { agentId, projectId, sessionId: threadId, threadId },
                outputSchema,
            });
        }
        finally {
            await this.closeAgentQuietly(agentInstance);
        }
    }
    async prepareStoredWorkflowRun(params) {
        await this.settingsService.assertEnabled();
        const { agentId, projectId, threadId, message, telemetryUserId, useDraftVersion, outputSchema, workflowContext, sandboxScope, prepareForEval, } = params;
        const sessionMode = await this.turnExecutionService.getSessionMode(threadId);
        const loaded = await this.loadWorkflowAgent(params);
        const { credentialProvider } = loaded;
        const { runSource, instrumentation } = await this.applyEvalSetup(loaded.runSource, prepareForEval);
        const agentData = runSource.agent;
        const telemetryConfiguration = (0, agent_telemetry_1.buildAgentConfigurationTelemetry)(runSource);
        const runType = useDraftVersion ? 'test' : 'production';
        const recordingParams = {
            access: { accessScope: 'project', ownerId: null },
            threadId,
            agentId,
            agentName: agentData.schema?.name ?? agentData.name,
            projectId,
            userMessage: message,
            resourceId: threadId,
            sessionMode,
            source: api_types_1.AGENT_WORKFLOW_TRIGGER_TYPE,
            telemetry: { userId: telemetryUserId, runType, configuration: telemetryConfiguration },
        };
        const extraTools = this.buildWorkflowExtraTools(workflowContext);
        const compiled = await this.compileIsolated(runSource, credentialProvider, runType, outputSchema, extraTools?.length ? extraTools : undefined, sandboxScope?.principalHash, instrumentation);
        if (!compiled.ok || !compiled.agent) {
            const error = new n8n_workflow_1.OperationalError(`Failed to compile agent: ${compiled.error ?? 'unknown error'}`);
            await this.turnExecutionService.recordFailedStart(recordingParams, error);
            throw error;
        }
        return { agentInstance: compiled.agent, recordingParams, runType, budget: compiled.budget };
    }
    async loadWorkflowAgent(params) {
        const { agentId, projectId, useDraftVersion } = params;
        const agentEntity = await this.agentRepository.findByIdAndProjectId(agentId, projectId);
        if (!agentEntity) {
            throw new n8n_workflow_1.OperationalError('Agent not found or not accessible.');
        }
        const credentialProvider = (0, agent_credential_provider_1.createAgentCredentialProvider)(this.credentialsService, projectId, undefined, agentId);
        const runSource = await (0, agent_published_snapshot_1.resolveAgentRunSource)(agentEntity, !useDraftVersion, this.agentSkillRefs, {});
        return { runSource, credentialProvider };
    }
    async applyEvalSetup(runSource, prepareForEval) {
        const { agent } = runSource;
        if (!prepareForEval || !agent.schema)
            return { runSource };
        const { config, instrumentation } = await prepareForEval((0, agent_document_1.toAgentDocument)(agent.schema, runSource.skillRefs), { hasChatIntegrations: (agent.integrations ?? []).length > 0 });
        const prepared = (0, agent_document_1.fromAgentDocument)(config);
        agent.schema = prepared.config;
        agent.integrations = [];
        return { runSource: { ...runSource, agent, skillRefs: prepared.skillRefs }, instrumentation };
    }
    async streamCompiledWorkflowAgent(agentInstance, params, run) {
        const { message, threadId, telemetryUserId, outputSchema, projectId, executionId, workflowContext, streamObserver, } = params;
        return await this.streamWorkflowAgent({
            agentInstance,
            message,
            threadId,
            telemetryUserId,
            outputSchema,
            ...run,
            tracing: {
                projectId,
                executionId,
                workflowId: workflowContext?.workflowId,
                nodeId: workflowContext?.callingNodeId,
                nodeName: workflowContext?.callingNodeName,
            },
            streamObserver,
        });
    }
    async executeInlineForWorkflow(inlineAgent, message, executionId, threadId, projectId, telemetryUserId, runType = 'production', outputSchema, workflowContext, { streamObserver, prepareForEval } = {}) {
        await this.settingsService.assertEnabled();
        const { runtimeConfig, skills, credentialProvider } = await this.prepareInlineRuntime(inlineAgent, projectId, workflowContext);
        const prepared = prepareForEval ? await prepareForEval(runtimeConfig) : undefined;
        const syntheticAgentId = `inline:${workflowContext?.workflowId ?? 'unknown'}:${workflowContext?.callingNodeName ?? 'unknown'}`;
        const extraTools = this.buildWorkflowExtraTools(workflowContext);
        const compiled = await this.compileIsolatedFromSource(prepared?.config ?? runtimeConfig, skills, syntheticAgentId, projectId, credentialProvider, runType, outputSchema, extraTools?.length ? extraTools : undefined, prepared?.instrumentation);
        if (!compiled.ok || !compiled.agent) {
            throw new n8n_workflow_1.OperationalError(`Failed to compile agent: ${compiled.error ?? 'unknown error'}`);
        }
        const params = {
            message,
            executionId,
            threadId,
            projectId,
            telemetryUserId,
            outputSchema,
            workflowContext,
            streamObserver,
        };
        const agentInstance = compiled.agent;
        try {
            const run = await this.streamCompiledWorkflowAgent(agentInstance, params, {
                telemetryAgentId: syntheticAgentId,
                runType,
                budget: compiled.budget,
            });
            this.trackInlineRun(params, syntheticAgentId, runType, runtimeConfig, run);
            return this.buildWorkflowResult({ run, session: null, outputSchema });
        }
        finally {
            await this.closeAgentQuietly(agentInstance);
        }
    }
    async prepareInlineRuntime(inlineAgent, projectId, workflowContext) {
        const { config, skills } = await this.validateInlineAgentConfig(inlineAgent);
        const persistMemory = workflowContext?.hasCallerSessionId === true;
        const runtimeConfig = persistMemory
            ? {
                ...config,
                memory: {
                    enabled: true,
                    storage: 'n8n',
                    observationalMemory: { enabled: false },
                    episodicMemory: { enabled: false },
                },
            }
            : config;
        const credentialProvider = (0, agent_credential_provider_1.createAgentCredentialProvider)(this.credentialsService, projectId);
        const accessibleCredentials = await credentialProvider.list();
        await this.nodeToolAiGatewayService.assignManagedCredentials(runtimeConfig.tools, new Set(accessibleCredentials.map((credential) => credential.type)));
        return { runtimeConfig, skills, credentialProvider };
    }
    trackInlineRun(params, syntheticAgentId, runType, runtimeConfig, run) {
        const { telemetryUserId, threadId } = params;
        try {
            this.telemetry.trackAgentTurnFinished({
                agent_id: syntheticAgentId,
                user_id: telemetryUserId,
                thread_id: threadId,
                run_type: runType,
                source: api_types_1.AGENT_WORKFLOW_TRIGGER_TYPE,
                agent_type: 'inline',
                turn_status: run.messageRecord.error !== null || run.messageRecord.finishReason === 'error'
                    ? 'failed'
                    : 'succeeded',
                configuration: (0, agent_telemetry_1.buildAgentConfigurationTelemetryFromConfig)(runtimeConfig),
                ...(0, agent_telemetry_1.buildAgentTurnMetrics)(run.messageRecord),
            });
        }
        catch (error) {
            this.logger.warn('Failed to track inline agent execution telemetry', {
                threadId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async validateInlineAgentConfig(payload) {
        const parsed = api_types_1.RunnableInlineAgentConfigSchema.safeParse({
            config: (0, api_types_1.sanitizeAgentJsonConfig)(payload.config),
            ...(payload.skills !== undefined ? { skills: (0, api_types_1.sanitizeAgentSkillBodies)(payload.skills) } : {}),
        });
        if (!parsed.success) {
            throw new n8n_workflow_1.UserError(`Invalid inline agent configuration: ${(0, api_types_1.formatAgentConfigZodError)(parsed.error)}`);
        }
        const config = parsed.data.config;
        try {
            (0, node_tool_validation_1.validateNodeToolExpressions)(config.tools);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new n8n_workflow_1.UserError(`Invalid $fromAI expression in node tool config: ${message}`);
        }
        const nodeError = await (0, node_tool_validation_1.validateNodeToolConfigs)(config.tools);
        if (nodeError) {
            throw new n8n_workflow_1.UserError(`Invalid inline agent configuration: ${nodeError}`);
        }
        return { config, skills: parsed.data.skills ?? {} };
    }
};
exports.AgentWorkflowExecutionService = AgentWorkflowExecutionService;
exports.AgentWorkflowExecutionService = AgentWorkflowExecutionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository, agent_turn_execution_service_1.AgentTurnExecutionService, telemetry_1.Telemetry, credentials_service_1.CredentialsService, agent_runtime_reconstruction_service_1.AgentRuntimeReconstructionService, agent_run_tracing_service_1.AgentRunTracingService, execution_level_tracer_1.ExecutionLevelTracer, node_tool_ai_gateway_service_1.NodeToolAiGatewayService, config_1.AiConfig, integration_message_context_service_1.IntegrationMessageContextService, agents_settings_service_1.AgentsSettingsService, agent_skill_refs_service_1.AgentSkillRefsService])
], AgentWorkflowExecutionService);
//# sourceMappingURL=agent-workflow-execution.service.js.map