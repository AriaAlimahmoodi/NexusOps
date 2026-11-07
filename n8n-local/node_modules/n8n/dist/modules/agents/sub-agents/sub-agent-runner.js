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
exports.SubAgentRunner = void 0;
const agents_1 = require("@n8n/agents");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const agent_queued_message_1 = require("../types/agent-queued-message");
const execution_input_1 = require("../utils/execution-input");
const sub_agent_background_state_1 = require("../background/sub-agent-background-state");
const agent_turn_execution_service_1 = require("../agent-turn-execution.service");
const agent_tool_approval_service_1 = require("../agent-tool-approval.service");
const agent_sandbox_principal_1 = require("../agent-sandbox-principal");
const agent_telemetry_1 = require("../agent-telemetry");
const n8n_checkpoint_storage_1 = require("../integrations/n8n-checkpoint-storage");
const from_json_config_1 = require("../json-config/from-json-config");
const budget_guardrail_1 = require("../budget-guardrail");
const model_stream_stall_options_1 = require("../model-stream-stall-options");
const agent_stream_1 = require("../utils/agent-stream");
const mcp_attribution_1 = require("../utils/mcp-attribution");
const sub_agent_source_resolver_1 = require("./sub-agent-source-resolver");
let SubAgentRunner = class SubAgentRunner {
    constructor(sourceResolver, turnExecutionService, checkpointStorage, logger, aiConfig, toolApprovalService) {
        this.sourceResolver = sourceResolver;
        this.turnExecutionService = turnExecutionService;
        this.checkpointStorage = checkpointStorage;
        this.logger = logger;
        this.aiConfig = aiConfig;
        this.toolApprovalService = toolApprovalService;
    }
    async run(request, context) {
        const taskPath = request.taskPath;
        (0, agents_1.assertSubAgentTaskPath)(taskPath);
        return await this.executeForeground({ type: 'run', request, taskPath }, context);
    }
    async resumeForeground(request, context, expectedSourceAgentId = request.subAgentId) {
        (0, agents_1.assertSubAgentTaskPath)(request.taskPath);
        if (request.childThreadId === undefined || request.resumeContext === undefined) {
            throw new n8n_workflow_1.UserError('Configured sub-agent checkpoint metadata is missing or invalid');
        }
        const pinnedSource = parseResumeContext(request.resumeContext, expectedSourceAgentId);
        return await this.executeForeground({
            type: 'resume',
            request,
            taskPath: request.taskPath,
            source: pinnedSource,
            threadId: request.childThreadId,
        }, context);
    }
    async resumePaused(request, context) {
        (0, agents_1.assertSubAgentTaskPath)(request.taskPath);
        if (!request.childThreadId || request.resumeContext === undefined) {
            throw new n8n_workflow_1.UserError('Background task checkpoint metadata is missing');
        }
        return await this.executeForeground({
            type: 'resumePaused',
            request,
            taskPath: request.taskPath,
            source: parseResumeContext(request.resumeContext, request.subAgentId),
            threadId: request.childThreadId,
        }, context);
    }
    async cancelForeground(request, expectedSourceAgentId = request.subAgentId) {
        (0, agents_1.assertSubAgentTaskPath)(request.taskPath);
        if (request.resumeContext === undefined) {
            throw new n8n_workflow_1.UserError('Configured sub-agent checkpoint metadata is missing or invalid');
        }
        const pinnedSource = parseResumeContext(request.resumeContext, expectedSourceAgentId);
        await this.checkpointStorage.delete(request.childRunId, pinnedSource.agentId);
    }
    async executeForeground(operation, context) {
        const runtimeSource = await this.sourceResolver.resolveForRuntime(operation.type === 'run' ? operation.request.source : operation.source, {
            projectId: context.projectId,
            usePublishedVersion: context.runType === 'production',
            ...(context.runtimeSnapshot !== undefined
                ? { runtimeSnapshot: context.runtimeSnapshot }
                : {}),
        });
        const threadId = operation.type === 'run' ? (operation.request.childThreadId ?? (0, uuid_1.v4)()) : operation.threadId;
        const resourceId = operation.type === 'run' ? (operation.request.parentResourceId ?? threadId) : threadId;
        const sandboxPrincipalHash = await this.resolveSandboxPrincipalHash(operation, runtimeSource.source.sourceId, context.projectId);
        const reconstructionService = await getReconstructionService();
        const resolvedConfig = applyDifficultyModelOverride(runtimeSource.source.config, context.selfDelegationDifficulty);
        const childConfig = context.instrumentation?.transformDelegatedAgentConfig?.(resolvedConfig, {
            subAgentId: runtimeSource.source.sourceId,
        }) ?? resolvedConfig;
        const telemetry = (0, agents_1.deriveSubAgentTelemetry)(context.telemetry);
        const userMessage = operation.type === 'run' ? (0, agents_1.renderDelegateSubAgentPrompt)(operation.request) : null;
        const recording = {
            access: { accessScope: 'user', ownerId: null },
            threadId,
            agentId: runtimeSource.source.sourceId,
            agentName: runtimeSource.source.config.name,
            projectId: context.projectId,
            userMessage,
            resourceId,
            resumeRunId: operation.type !== 'run' ? operation.request.childRunId : undefined,
            sessionMode: operation.type !== 'run' ? 'existing' : 'new',
            source: 'subagent',
            threadMetadata: {
                parentThreadId: operation.request.parentThreadId,
                parentAgentId: context.parentAgentId,
            },
            telemetry: {
                userId: context.user?.id,
                runType: context.runType,
                configuration: (0, agent_telemetry_1.buildAgentConfigurationTelemetryFromConfig)(runtimeSource.source.config),
            },
        };
        const recorder = this.turnExecutionService.createRecorder(undefined, () => executionId, recording);
        context.abortSignal?.throwIfAborted();
        const admission = await this.turnExecutionService.startExecution(recording, recorder.startedAt);
        const { executionId } = admission;
        let executionStarted = false;
        let executionError;
        let agent;
        try {
            context.abortSignal?.throwIfAborted();
            if (operation.type !== 'run')
                await context.beforeResume?.();
            const reconstructed = await reconstructionService.reconstructFromResolvedSource({
                config: childConfig,
                memoryOwnerAgentId: runtimeSource.source.sourceId,
                projectId: context.projectId,
                credentialProvider: context.credentialProvider,
                toolDescriptors: runtimeSource.toolDescriptors,
                toolCodeByName: runtimeSource.toolCodeByName,
                skills: runtimeSource.skills,
                runtimeProfile: 'sub-agent',
                runType: context.runType,
                workflowToolExecutionMode: context.workflowToolExecutionMode,
                parentAgentIdForDelegation: context.parentAgentId,
                rootSessionId: context.rootSessionId,
                rootSessionCapUsd: context.rootSessionCapUsd,
                budgetForwarded: context.budgetForwarded,
                user: context.user,
                instrumentation: context.instrumentation,
                ...(sandboxPrincipalHash !== undefined ? { sandboxPrincipalHash } : {}),
                ...(context.parentWorkspaceHandle !== undefined
                    ? {
                        parentWorkspace: {
                            handle: context.parentWorkspaceHandle,
                            delegationThreadId: threadId,
                        },
                    }
                    : {}),
            });
            agent = reconstructed.agent;
            context.abortSignal?.throwIfAborted();
            const forwardBudgetNotice = context.onBudgetNotice
                ? (notice) => context.onBudgetNotice?.(notice.code === 'budget.session'
                    ? { code: notice.code }
                    :
                        { ...notice, agentId: notice.agentId ?? runtimeSource.source.sourceId })
                : undefined;
            const executionOptions = (0, budget_guardrail_1.withBudgetGuardrail)({
                approvalContext: await this.toolApprovalService.createContext(recording, reconstructed.toolRegistry),
                ...(context.abortSignal !== undefined ? { abortSignal: context.abortSignal } : {}),
                ...(telemetry !== undefined ? { telemetry } : {}),
                ...(0, model_stream_stall_options_1.modelStreamStallOptions)(this.aiConfig),
                executionCounter: context.executionCounter,
                shouldPause: context.shouldPause,
            }, {
                useRootSessionCap: true,
                budget: childConfig.config?.guardrails?.budget,
                sessionId: context.rootSessionId,
                agentId: runtimeSource.source.sourceId,
                rootSessionCapUsd: context.rootSessionCapUsd,
                ...(forwardBudgetNotice !== undefined ? { onNotice: forwardBudgetNotice } : {}),
            });
            context.abortSignal?.throwIfAborted();
            executionStarted = operation.type === 'run';
            let resultStream;
            if (operation.type === 'run') {
                resultStream = await agent.stream((0, execution_input_1.bindExecutionInput)(userMessage ?? '', admission.inputMessageIds), {
                    ...executionOptions,
                    persistence: {
                        resourceId,
                        threadId,
                        delegated: true,
                        hostMetadata: {
                            ...createHostMetadata(context, operation.taskPath, runtimeSource, sandboxPrincipalHash),
                            [agent_queued_message_1.EXECUTION_METADATA_KEY]: executionId,
                        },
                    },
                });
            }
            else if (operation.type === 'resumePaused') {
                resultStream = await agent.resumePaused({
                    ...executionOptions,
                    hostMetadata: { [agent_queued_message_1.EXECUTION_METADATA_KEY]: executionId },
                    runId: operation.request.childRunId,
                    onResumeClaimed: async () => {
                        await context.onResumeClaimed?.();
                        executionStarted = true;
                    },
                });
            }
            else {
                resultStream = await agent.resume('stream', operation.request.resumeData, {
                    ...executionOptions,
                    hostMetadata: { [agent_queued_message_1.EXECUTION_METADATA_KEY]: executionId },
                    runId: operation.request.childRunId,
                    toolCallId: operation.request.childToolCallId,
                    onResumeClaimed: async () => {
                        await context.onResumeClaimed?.();
                        executionStarted = true;
                        recorder.recordHitlResponse(operation.request.childToolCallId, operation.request.resumeData);
                    },
                });
            }
            const consumed = await consumeAgentStream(resultStream, recorder, (0, mcp_attribution_1.createAttributionTracker)(reconstructed.mcpServerAttributions), context.onChunk);
            executionError = consumed.executionError;
            const { result } = consumed;
            const suspended = recorder.suspended;
            let status = 'completed';
            if (result.finishReason === 'paused')
                status = 'paused';
            else if (suspended)
                status = 'suspended';
            else if (result.finishReason === 'error' || result.error !== undefined)
                status = 'failed';
            else if (result.finishReason === 'guardrail') {
                status = 'failed';
                const code = result.guardrail?.code;
                if (code === 'budget.session' || code === 'budget.monthly') {
                    forwardBudgetNotice?.({ code });
                }
            }
            return {
                taskPath: operation.taskPath,
                threadId,
                status,
                result,
                ...(suspended ? { resumeContext: createResumeContext(runtimeSource.source) } : {}),
            };
        }
        catch (error) {
            executionError = error;
            recorder.record({ type: 'error', error });
            recorder.record({ type: 'finish', finishReason: 'error' });
            throw error;
        }
        finally {
            try {
                const record = recorder.getMessageRecord();
                await this.turnExecutionService.finalizeExecution({
                    executionId,
                    executionStarted,
                    executionError,
                    params: {
                        ...recording,
                        record: context.abortSignal?.aborted
                            ? { ...record, finishReason: 'cancelled', error: null }
                            : record,
                        hitlStatus: recorder.suspended
                            ? 'suspended'
                            : operation.type === 'resume' && executionStarted
                                ? 'resumed'
                                : undefined,
                    },
                });
            }
            finally {
                await agent?.close().catch((error) => {
                    this.logger.warn(`Failed to close subagent after ${operation.type}`, {
                        taskPath: operation.taskPath,
                        error: error instanceof Error ? error.message : String(error),
                    });
                });
            }
        }
    }
    async resolveSandboxPrincipalHash(operation, childAgentId, projectId) {
        if (operation.type === 'run') {
            const value = operation.request.parentSandboxPrincipalHash;
            if (value === undefined)
                return undefined;
            if (!(0, agent_sandbox_principal_1.isAgentSandboxPrincipalHash)(value)) {
                throw new n8n_workflow_1.UserError('Configured sub-agent workspace scope is invalid');
            }
            return value;
        }
        const checkpoint = await this.checkpointStorage.load(operation.request.childRunId, childAgentId);
        const scope = (0, agent_sandbox_principal_1.decodeAgentSandboxHostMetadata)(checkpoint?.persistence?.hostMetadata);
        if (!scope)
            return undefined;
        if (scope.projectId !== projectId) {
            throw new n8n_workflow_1.UserError('Configured sub-agent workspace scope is invalid');
        }
        return scope.principalHash;
    }
};
exports.SubAgentRunner = SubAgentRunner;
exports.SubAgentRunner = SubAgentRunner = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [sub_agent_source_resolver_1.SubAgentSourceResolver, agent_turn_execution_service_1.AgentTurnExecutionService, n8n_checkpoint_storage_1.N8NCheckpointStorage, backend_common_1.Logger, config_1.AiConfig, agent_tool_approval_service_1.AgentToolApprovalService])
], SubAgentRunner);
async function getReconstructionService() {
    const { AgentRuntimeReconstructionService } = await import('../agent-runtime-reconstruction.service.js');
    return di_1.Container.get(AgentRuntimeReconstructionService);
}
async function consumeAgentStream(resultStream, recorder, attributionTracker, onChunk) {
    const pendingSuspend = [];
    let structuredOutput;
    let executionError;
    let guardrail;
    for await (const value of (0, agent_stream_1.streamAgentChunks)(resultStream.stream)) {
        recorder.record(value);
        if (value.type === 'error')
            executionError = value.error;
        for (const attributionChunk of attributionTracker.observe(value)) {
            recorder.record(attributionChunk);
            onChunk?.(attributionChunk);
        }
        onChunk?.(value);
        if (value.type === 'tool-call-suspended') {
            pendingSuspend.push({
                runId: value.runId,
                toolCallId: value.toolCallId,
                toolName: value.toolName,
                input: value.input,
                suspendPayload: value.suspendPayload,
                ...(value.resumeSchema !== undefined ? { resumeSchema: value.resumeSchema } : {}),
            });
        }
        if (value.type === 'finish') {
            if (value.structuredOutput !== undefined)
                structuredOutput = value.structuredOutput;
            if (value.guardrail !== undefined)
                guardrail = value.guardrail;
        }
    }
    const messageRecord = recorder.getMessageRecord();
    return {
        executionError,
        result: buildGenerateResultFromRecord(resultStream.runId, messageRecord, structuredOutput, () => resultStream.getState(), pendingSuspend, guardrail),
    };
}
function createHostMetadata(context, taskPath, runtimeSource, principalHash) {
    let metadata = principalHash
        ? (0, agent_sandbox_principal_1.encodeAgentSandboxHostMetadata)({ projectId: context.projectId, principalHash })
        : undefined;
    if (context.backgroundJobId) {
        metadata = {
            ...metadata,
            [sub_agent_background_state_1.BACKGROUND_SUB_AGENT_METADATA_KEY]: (0, n8n_workflow_1.jsonParse)(JSON.stringify({
                jobId: context.backgroundJobId,
                taskPath,
                resumeContext: createResumeContext(runtimeSource.source),
                runtimeSnapshot: JSON.stringify(runtimeSource),
                difficulty: context.selfDelegationDifficulty,
                sharedWorkspace: context.parentWorkspaceHandle !== undefined,
                messageContext: context.parentMessageContext ?? null,
            })),
        };
    }
    return metadata;
}
function createResumeContext(runtimeSource) {
    return {
        agentId: runtimeSource.sourceId,
        ...(runtimeSource.versionId !== undefined ? { versionId: runtimeSource.versionId } : {}),
    };
}
function applyDifficultyModelOverride(config, difficulty) {
    const modelConfig = difficulty ? config.subAgents?.modelsByDifficulty?.[difficulty] : undefined;
    if (!modelConfig)
        return config;
    const providerTools = Object.fromEntries((0, from_json_config_1.buildProviderToolsForModel)(config, modelConfig.model).map(({ name, args }) => [name, args]));
    return {
        ...config,
        model: modelConfig.model,
        credential: modelConfig.credential,
        providerTools,
    };
}
function parseResumeContext(resumeContext, expectedSourceAgentId) {
    if (!(0, is_record_1.isRecord)(resumeContext) ||
        typeof resumeContext.agentId !== 'string' ||
        resumeContext.agentId.length === 0 ||
        resumeContext.agentId !== expectedSourceAgentId) {
        throw new n8n_workflow_1.UserError('Configured sub-agent resume context is missing or invalid');
    }
    const versionId = resumeContext.versionId;
    if (versionId !== undefined && (typeof versionId !== 'string' || versionId.length === 0)) {
        throw new n8n_workflow_1.UserError('Configured sub-agent resume context is missing or invalid');
    }
    return {
        agentId: resumeContext.agentId,
        ...(versionId !== undefined ? { versionId } : {}),
    };
}
function buildGenerateResultFromRecord(runId, record, structuredOutput, getState, pendingSuspend = [], guardrail) {
    const messages = createAssistantMessages(record.assistantResponse);
    const finishReason = (0, agents_1.isFinishReason)(record.finishReason) ? record.finishReason : undefined;
    const result = {
        runId,
        messages,
        ...(record.model !== null ? { model: record.model } : {}),
        ...(finishReason !== undefined ? { finishReason } : {}),
        ...(record.usage !== null
            ? {
                usage: {
                    ...record.usage,
                    ...(record.totalCost !== null ? { cost: record.totalCost } : {}),
                },
            }
            : {}),
        ...(structuredOutput !== undefined ? { structuredOutput } : {}),
        ...(record.error !== null ? { error: record.error } : {}),
        ...(pendingSuspend.length > 0 ? { pendingSuspend } : {}),
        ...(guardrail !== undefined ? { guardrail } : {}),
        getState,
    };
    return result;
}
function createAssistantMessages(text) {
    if (!text.trim())
        return [];
    return [
        {
            role: 'assistant',
            content: [{ type: 'text', text }],
        },
    ];
}
//# sourceMappingURL=sub-agent-runner.js.map