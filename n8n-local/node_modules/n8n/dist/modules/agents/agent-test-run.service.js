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
exports.AgentTestRunService = exports.InvalidAgentTestRunCheckpointError = exports.agentTestRunContinuationSchema = void 0;
exports.parseStandardApprovalSuspension = parseStandardApprovalSuspension;
exports.collectStandardApprovals = collectStandardApprovals;
const node_crypto_1 = require("node:crypto");
const node_util_1 = require("node:util");
const tool_1 = require("@n8n/agents/tool");
const json_schema_1 = require("@n8n/ai-utilities/json-schema");
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const agent_execution_orchestrator_service_1 = require("./agent-execution-orchestrator.service");
const agent_execution_service_1 = require("./agent-execution.service");
const agent_validation_service_1 = require("./agent-validation.service");
const n8n_checkpoint_storage_1 = require("./integrations/n8n-checkpoint-storage");
const agent_memory_scope_1 = require("./utils/agent-memory-scope");
exports.agentTestRunContinuationSchema = zod_1.z
    .object({
    runId: zod_1.z.string(),
    toolCallId: zod_1.z.string(),
    sessionId: zod_1.z.string(),
    response: zod_1.z.string(),
})
    .strict();
const expectedApprovalResumeJsonSchema = (0, json_schema_1.zodToJsonSchema)(tool_1.APPROVAL_RESUME_SCHEMA);
class InvalidAgentTestRunCheckpointError extends n8n_workflow_1.UserError {
    constructor() {
        super('This test run can no longer be resumed.');
        this.code = 'invalid_checkpoint';
    }
}
exports.InvalidAgentTestRunCheckpointError = InvalidAgentTestRunCheckpointError;
function parseStandardApprovalSuspension(suspension) {
    const payload = tool_1.APPROVAL_SUSPEND_SCHEMA.safeParse(suspension.suspendPayload);
    if (!payload.success ||
        !(0, node_util_1.isDeepStrictEqual)(suspension.resumeSchema, expectedApprovalResumeJsonSchema)) {
        return undefined;
    }
    return payload.data;
}
function collectStandardApprovals(result) {
    const approvals = [];
    for (const suspension of result.suspensions) {
        const approval = parseStandardApprovalSuspension(suspension);
        if (!approval)
            return undefined;
        approvals.push({
            ...approval,
            continuation: {
                runId: suspension.runId,
                toolCallId: suspension.toolCallId,
                sessionId: result.sessionId,
                response: result.response,
            },
        });
    }
    return approvals;
}
let AgentTestRunService = class AgentTestRunService {
    constructor(agentExecutionService, agentValidationService, agentExecutionOrchestratorService, n8nCheckpointStorage) {
        this.agentExecutionService = agentExecutionService;
        this.agentValidationService = agentValidationService;
        this.agentExecutionOrchestratorService = agentExecutionOrchestratorService;
        this.n8nCheckpointStorage = n8nCheckpointStorage;
    }
    async prepareDraftRun({ agentId, projectId, user, sessionId, previewChat, newSession, credentialProvider, }) {
        const sessionMode = !sessionId || newSession ? 'new' : 'existing';
        if (sessionId) {
            if (!(await this.agentExecutionService.canUseDraftThread(sessionId, projectId, agentId, user.id, { previewChat, sessionMode }))) {
                return { status: 'session_not_found' };
            }
        }
        const { missing } = await this.agentValidationService.validateAgentIsRunnable(agentId, projectId, credentialProvider);
        if (missing.length > 0)
            return { status: 'agent_misconfigured', missing };
        return {
            status: 'ready',
            sessionId: sessionId || (0, node_crypto_1.randomUUID)(),
            sessionMode,
        };
    }
    async executePreparedDraftRun({ sessionId, errorMode, onChunk, onExecutionRecorded, ...execution }) {
        let executionId;
        const stream = this.agentExecutionOrchestratorService.executeForChat({
            ...execution,
            memory: {
                threadId: sessionId,
                resourceId: (0, agent_memory_scope_1.draftChatMemoryResourceId)(execution.user.id),
            },
            onExecutionRecorded: (id) => {
                executionId = id;
                onExecutionRecorded?.(id);
            },
        });
        return await this.collectDraftRun(stream, '', () => executionId, { errorMode, onChunk });
    }
    async resumePreparedDraftRun({ initialResponse = '', errorMode, onChunk, onExecutionRecorded, ...execution }) {
        let executionId;
        const stream = this.agentExecutionOrchestratorService.resumeForChat({
            ...execution,
            usePublishedVersion: false,
            integrationType: api_types_1.N8N_CHAT_INTEGRATION_TYPE,
            onExecutionRecorded: (id) => {
                executionId = id;
                onExecutionRecorded?.(id);
            },
        });
        return await this.collectDraftRun(stream, initialResponse, () => executionId, {
            errorMode,
            onChunk,
        });
    }
    async executeDraftRun({ credentialProvider, ...input }) {
        const prepared = await this.prepareDraftRun({ ...input, credentialProvider });
        if (prepared.status !== 'ready')
            return prepared;
        const result = await this.executePreparedDraftRun({
            ...input,
            sessionId: prepared.sessionId,
            sessionMode: prepared.sessionMode,
        });
        return { ...result, sessionId: prepared.sessionId };
    }
    async resumeDraftRun({ sessionId, response, ...input }) {
        if (!(await this.agentExecutionService.canUseDraftThread(sessionId, input.projectId, input.agentId, input.user.id, { previewChat: input.chatSurface === 'preview', sessionMode: 'existing' }))) {
            return { status: 'session_not_found' };
        }
        const result = await this.resumePreparedDraftRun({
            ...input,
            expectedMemory: {
                threadId: sessionId,
                resourceId: (0, agent_memory_scope_1.draftChatMemoryResourceId)(input.user.id),
            },
            initialResponse: response,
        });
        return { ...result, sessionId };
    }
    async resumeDraftApproval(input) {
        const continuation = exports.agentTestRunContinuationSchema.safeParse(input.continuation);
        if (!continuation.success)
            throw new InvalidAgentTestRunCheckpointError();
        await this.validateDraftApprovalCheckpoint(continuation.data, input.agentId, input.user.id);
        return await this.resumeDraftRun({
            agentId: input.agentId,
            projectId: input.projectId,
            sessionId: continuation.data.sessionId,
            runId: continuation.data.runId,
            toolCallId: continuation.data.toolCallId,
            resumeData: { approved: input.approved },
            user: input.user,
            source: input.source,
            response: continuation.data.response,
            ...(input.abortSignal ? { abortSignal: input.abortSignal } : {}),
        });
    }
    async cancelSuspendedRuns({ agentId, suspensions, userId, }) {
        const runIds = [...new Set(suspensions.map(({ runId }) => runId))];
        try {
            const cancellations = await Promise.all(runIds.map(async (runId) => await this.agentExecutionOrchestratorService.cancelChatRun({
                agentId,
                runId,
                resourceId: (0, agent_memory_scope_1.draftChatMemoryResourceId)(userId),
            })));
            return cancellations.every(Boolean);
        }
        catch {
            return false;
        }
    }
    async collectDraftRun(stream, initialResponse, getExecutionId, { errorMode = 'throw', onChunk }) {
        const state = {
            response: initialResponse,
            suspensions: [],
            maxIterations: false,
            observerFailed: false,
        };
        try {
            for await (const chunk of stream) {
                this.observeDraftChunk(chunk, onChunk, state);
                this.collectDraftChunk(chunk, errorMode, state);
            }
        }
        catch (error) {
            if (state.observerFailed)
                throw state.observerError;
            throw error;
        }
        if (state.observerFailed)
            throw state.observerError;
        if (state.errorChunk)
            throw state.errorChunk.error;
        const executionId = getExecutionId();
        if (!executionId)
            throw new n8n_workflow_1.UnexpectedError('Agent execution completed without a recorded ID');
        const metadata = {
            response: state.response,
            executionId,
            ...(state.maxIterations ? { maxIterations: true } : {}),
        };
        if (state.suspensions.length > 0) {
            return { status: 'suspended', ...metadata, suspensions: state.suspensions };
        }
        return { status: 'completed', ...metadata };
    }
    async validateDraftApprovalCheckpoint(continuation, agentId, userId) {
        let checkpoint;
        try {
            checkpoint = await this.n8nCheckpointStorage.load(continuation.runId, agentId);
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.UserError)
                throw new InvalidAgentTestRunCheckpointError();
            throw error;
        }
        const pendingToolCall = checkpoint?.pendingToolCalls[continuation.toolCallId];
        const expectedResourceId = (0, agent_memory_scope_1.draftChatMemoryResourceId)(userId);
        if (checkpoint?.status !== 'suspended' ||
            checkpoint.persistence?.delegated === true ||
            checkpoint.persistence?.threadId !== continuation.sessionId ||
            checkpoint.persistence?.resourceId !== expectedResourceId ||
            !pendingToolCall?.suspended ||
            pendingToolCall.runId !== continuation.runId ||
            !parseStandardApprovalSuspension({
                runId: pendingToolCall.runId,
                toolCallId: pendingToolCall.toolCallId,
                toolName: pendingToolCall.toolName,
                suspendPayload: pendingToolCall.suspendPayload,
                resumeSchema: pendingToolCall.resumeSchema,
            })) {
            throw new InvalidAgentTestRunCheckpointError();
        }
    }
    observeDraftChunk(chunk, onChunk, state) {
        if (state.observerFailed || !onChunk)
            return;
        try {
            onChunk(chunk);
        }
        catch (error) {
            state.observerFailed = true;
            state.observerError = error;
        }
    }
    collectDraftChunk(chunk, errorMode, state) {
        if (chunk.type === 'error' && errorMode === 'throw' && !state.observerFailed) {
            state.errorChunk ??= chunk;
            return;
        }
        if (state.errorChunk)
            return;
        if (chunk.type === 'text-delta') {
            state.response += chunk.delta;
        }
        else if (chunk.type === 'finish' && chunk.finishReason === 'max-iterations') {
            state.maxIterations = true;
        }
        else if (chunk.type === 'tool-call-suspended') {
            state.suspensions.push({
                runId: chunk.runId,
                toolCallId: chunk.toolCallId,
                toolName: chunk.toolName,
                ...(chunk.input !== undefined ? { input: chunk.input } : {}),
                ...(chunk.suspendPayload !== undefined ? { suspendPayload: chunk.suspendPayload } : {}),
                ...(chunk.resumeSchema !== undefined ? { resumeSchema: chunk.resumeSchema } : {}),
            });
        }
    }
};
exports.AgentTestRunService = AgentTestRunService;
exports.AgentTestRunService = AgentTestRunService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_execution_service_1.AgentExecutionService, agent_validation_service_1.AgentValidationService, agent_execution_orchestrator_service_1.AgentExecutionOrchestratorService, n8n_checkpoint_storage_1.N8NCheckpointStorage])
], AgentTestRunService);
//# sourceMappingURL=agent-test-run.service.js.map