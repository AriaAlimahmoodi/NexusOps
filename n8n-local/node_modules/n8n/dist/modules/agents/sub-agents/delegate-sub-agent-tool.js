"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createN8nDelegateSubAgentTool = createN8nDelegateSubAgentTool;
const agents_1 = require("@n8n/agents");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const agent_execution_recording_error_1 = require("../agent-execution-recording.error");
const agent_sandbox_principal_1 = require("../agent-sandbox-principal");
const format_sub_agent_tool_output_1 = require("./format-sub-agent-tool-output");
function createN8nDelegateSubAgentTool(options) {
    const { runner, sourcesById, availableSubAgents, policy, inlineSubAgentModelsByDifficulty, resolveInlineSubAgentProviderTools, runBackgroundSubAgent, parentBudget, ...runContext } = options;
    return (0, agents_1.createDelegateSubAgentTool)({
        ...(availableSubAgents !== undefined ? { availableSubAgents } : {}),
        ...(policy !== undefined ? { policy } : {}),
        ...(inlineSubAgentModelsByDifficulty !== undefined ? { inlineSubAgentModelsByDifficulty } : {}),
        ...(resolveInlineSubAgentProviderTools !== undefined
            ? { resolveInlineSubAgentProviderTools }
            : {}),
        shouldRetrySubAgentResumeError,
        runBackgroundSubAgent,
        runSubAgent: async (request, helpers) => {
            const isSelfDelegation = request.subAgentId === agents_1.INLINE_SUB_AGENT_ID;
            const selectedSource = selectSubAgentSource({
                sourcesById,
                subAgentId: request.subAgentId,
                parentAgentId: runContext.parentAgentId,
            });
            if (!selectedSource) {
                return {
                    status: 'failed',
                    taskPath: request.taskPath,
                    answer: '',
                    error: `No configured subagent matched "${request.subAgentId}". Use "inline" for an inline sub-agent, or pass one of the configured subagent IDs.`,
                };
            }
            const parentSandboxScope = (0, agent_sandbox_principal_1.decodeAgentSandboxHostMetadata)(request.parentHostMetadata);
            const result = await runner.run({
                goal: request.goal,
                source: selectedSource,
                ...(request.context !== undefined ? { context: request.context } : {}),
                ...(request.expectedOutput !== undefined
                    ? { expectedOutput: request.expectedOutput }
                    : {}),
                ...(policy !== undefined ? { policy } : {}),
                ...(request.parentThreadId !== undefined
                    ? { parentThreadId: request.parentThreadId }
                    : {}),
                ...(request.parentResourceId !== undefined
                    ? { parentResourceId: request.parentResourceId }
                    : {}),
                ...(parentSandboxScope?.projectId === runContext.projectId
                    ? { parentSandboxPrincipalHash: parentSandboxScope.principalHash }
                    : {}),
                taskPath: request.taskPath,
            }, {
                ...runContext,
                ...rootBudgetSession(runContext, parentBudget, request.parentThreadId),
                ...(request.parentExecutionCounter !== undefined
                    ? { executionCounter: request.parentExecutionCounter }
                    : {}),
                ...(request.parentAbortSignal !== undefined
                    ? { abortSignal: request.parentAbortSignal }
                    : {}),
                ...(request.parentTelemetry !== undefined ? { telemetry: request.parentTelemetry } : {}),
                onChunk: helpers.emitChunk,
                ...(isSelfDelegation && request.difficulty !== undefined
                    ? { selfDelegationDifficulty: request.difficulty }
                    : {}),
                ...(request.parentOnGuardrailNotice !== undefined
                    ? { onBudgetNotice: request.parentOnGuardrailNotice }
                    : {}),
            });
            return (0, format_sub_agent_tool_output_1.formatSubAgentToolOutput)(result);
        },
        resumeSubAgent: async (request, helpers) => {
            if (request.childThreadId === undefined || request.resumeContext === undefined) {
                return {
                    status: 'failed',
                    taskPath: request.taskPath,
                    answer: '',
                    error: 'Configured sub-agent checkpoint metadata is missing or invalid.',
                };
            }
            const context = {
                ...runContext,
                ...rootBudgetSession(runContext, parentBudget, request.parentThreadId),
                ...(request.parentExecutionCounter !== undefined
                    ? { executionCounter: request.parentExecutionCounter }
                    : {}),
                ...(request.parentAbortSignal !== undefined
                    ? { abortSignal: request.parentAbortSignal }
                    : {}),
                ...(request.parentTelemetry !== undefined ? { telemetry: request.parentTelemetry } : {}),
                onChunk: helpers.emitChunk,
                ...(request.subAgentId === agents_1.INLINE_SUB_AGENT_ID && request.difficulty !== undefined
                    ? { selfDelegationDifficulty: request.difficulty }
                    : {}),
                ...(request.parentOnGuardrailNotice !== undefined
                    ? { onBudgetNotice: request.parentOnGuardrailNotice }
                    : {}),
            };
            const result = request.subAgentId === agents_1.INLINE_SUB_AGENT_ID
                ? await runner.resumeForeground(request, context, resolveExpectedSourceAgentId(request.subAgentId, runContext.parentAgentId))
                : await runner.resumeForeground(request, context);
            return (0, format_sub_agent_tool_output_1.formatSubAgentToolOutput)(result);
        },
        cancelSubAgent: async (request) => {
            if (request.resumeContext === undefined) {
                throw new Error('Configured sub-agent checkpoint metadata is missing or invalid.');
            }
            if (request.subAgentId === agents_1.INLINE_SUB_AGENT_ID) {
                await runner.cancelForeground(request, resolveExpectedSourceAgentId(request.subAgentId, runContext.parentAgentId));
                return;
            }
            await runner.cancelForeground(request);
        },
    });
}
function shouldRetrySubAgentResumeError(error) {
    if (error instanceof agent_execution_recording_error_1.AgentExecutionRecordingError && error.phase === 'finalize')
        return false;
    if (error instanceof n8n_workflow_1.OperationalError)
        return true;
    if (!(error instanceof errors_1.ResponseError))
        return false;
    return [408, 425, 429, 502, 503, 504].includes(error.httpStatusCode);
}
function positiveSessionCap(budget) {
    const cap = budget?.enabled ? budget.sessionCostCapUsd : undefined;
    if (cap === undefined || !(cap > 0))
        return undefined;
    return cap;
}
function rootBudgetSession(runContext, parentBudget, parentThreadId) {
    if (runContext.budgetForwarded) {
        const cap = runContext.rootSessionCapUsd;
        return {
            rootSessionId: runContext.rootSessionId,
            rootSessionCapUsd: cap !== undefined && cap > 0 ? cap : undefined,
            budgetForwarded: true,
        };
    }
    return {
        rootSessionId: parentThreadId,
        rootSessionCapUsd: positiveSessionCap(parentBudget),
        budgetForwarded: true,
    };
}
function selectSubAgentSource(options) {
    const { sourcesById, subAgentId, parentAgentId } = options;
    if (subAgentId === agents_1.INLINE_SUB_AGENT_ID) {
        return { agentId: resolveExpectedSourceAgentId(subAgentId, parentAgentId) };
    }
    return sourcesById?.[subAgentId];
}
function resolveExpectedSourceAgentId(subAgentId, parentAgentId) {
    if (subAgentId !== agents_1.INLINE_SUB_AGENT_ID)
        return subAgentId;
    if (!parentAgentId) {
        throw new n8n_workflow_1.UserError('Inline sub-agent parent Agent identity is missing');
    }
    return parentAgentId;
}
//# sourceMappingURL=delegate-sub-agent-tool.js.map