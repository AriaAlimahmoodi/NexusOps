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
exports.AgentTurnExecutionService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const agent_execution_recording_error_1 = require("./agent-execution-recording.error");
const agent_turn_already_running_error_1 = require("./agent-turn-already-running.error");
const agent_chat_execution_service_1 = require("./agent-chat-execution.service");
const agent_message_queue_service_1 = require("./agent-message-queue.service");
const agent_message_steering_service_1 = require("./agent-message-steering.service");
const agent_tool_approval_service_1 = require("./agent-tool-approval.service");
const agent_queued_message_1 = require("./types/agent-queued-message");
const agent_execution_service_1 = require("./agent-execution.service");
const execution_recorder_1 = require("./execution-recorder");
const agent_stream_1 = require("./utils/agent-stream");
const fatal_session_outcome_1 = require("./utils/fatal-session-outcome");
const mcp_attribution_1 = require("./utils/mcp-attribution");
const execution_input_1 = require("./utils/execution-input");
function getMaxIterationsChunks() {
    const id = crypto.randomUUID();
    return [
        { type: 'text-start', id },
        {
            type: 'text-delta',
            id,
            delta: fatal_session_outcome_1.MAX_ITERATIONS_STOPPED_MESSAGE,
        },
        { type: 'text-end', id },
    ];
}
let AgentTurnExecutionService = class AgentTurnExecutionService {
    constructor(logger, agentExecutionService, chatExecutionService, messageQueue, steering, toolApprovalService) {
        this.logger = logger;
        this.agentExecutionService = agentExecutionService;
        this.chatExecutionService = chatExecutionService;
        this.messageQueue = messageQueue;
        this.steering = steering;
        this.toolApprovalService = toolApprovalService;
    }
    async getSessionMode(threadId) {
        return await this.agentExecutionService.getSessionMode(threadId);
    }
    async *execute(config) {
        let turn;
        let chatControl;
        const state = {
            steeredMessages: new Map(),
            executionStarted: false,
            receivedFinish: false,
            executionId: config.admittedExecution?.executionId,
        };
        const recorder = this.createRecorder(config.toolRegistry, () => state.executionId, config.context, config.backgroundJobSignal, config.admittedExecution?.startedAt);
        try {
            turn = await config.prepare();
            const preparedTurn = turn;
            if (config.chatSurface !== undefined) {
                chatControl = this.createChatExecutionControl(preparedTurn, config.chatSurface);
                preparedTurn.options.abortSignal = chatControl.controller.signal;
            }
            const stream = await this.admitTurn(preparedTurn, config, recorder, state, chatControl);
            yield* this.streamTurn(stream, preparedTurn, config, recorder, state);
        }
        catch (error) {
            state.executionError = error;
            recorder.record({ type: 'error', error });
            recorder.record({ type: 'finish', finishReason: 'error' });
            throw error;
        }
        finally {
            chatControl?.detachRequest();
            if (turn && state.executionId) {
                try {
                    await this.settleTurn(turn, config, recorder, state.executionId, state, chatControl);
                    await config.onSettled?.(recorder.suspended);
                }
                finally {
                    await this.messageQueue.settle(config.context.threadId, state.executionId);
                }
            }
        }
    }
    createChatExecutionControl(turn, surface) {
        const userId = turn.recording.access.ownerId;
        if (turn.recording.access.accessScope !== 'user' || !userId) {
            throw new n8n_workflow_1.UnexpectedError('A preview execution must have an owning user.');
        }
        const requestSignal = turn.options.abortSignal;
        const controller = new AbortController();
        const abort = () => controller.abort(requestSignal?.reason);
        if (requestSignal?.aborted)
            abort();
        else
            requestSignal?.addEventListener('abort', abort, { once: true });
        return {
            controller,
            userId,
            surface,
            detachRequest: () => requestSignal?.removeEventListener('abort', abort),
        };
    }
    async startTurn(turn, config, recorder, state) {
        turn.options.approvalContext = await this.toolApprovalService.createContext(turn.recording, config.toolRegistry);
        turn.options.abortSignal?.throwIfAborted();
        if (turn.type === 'start') {
            state.executionStarted = true;
            return (await config.agentInstance.stream(turn.input, turn.options)).stream;
        }
        const { options, resumeData } = turn;
        return (await config.agentInstance.resume('stream', resumeData, {
            ...options,
            onResumeClaimed: async () => {
                state.executionStarted = true;
                recorder.recordHitlResponse(options.toolCallId, resumeData);
                await options.onResumeClaimed?.();
            },
        })).stream;
    }
    async *streamTurn(stream, turn, config, recorder, state) {
        const attributionTracker = (0, mcp_attribution_1.createAttributionTracker)(config.mcpServerAttributions);
        for await (const chunk of (0, agent_stream_1.streamAgentChunks)(stream)) {
            if (chunk.type === 'input-boundary') {
                chunk.acknowledge();
                continue;
            }
            if (chunk.type === 'input') {
                const event = state.steeredMessages.get(chunk.message.id);
                if (event) {
                    state.steeredMessages.delete(chunk.message.id);
                    yield event;
                }
                continue;
            }
            recorder.record(chunk);
            if (chunk.type === 'tool-call-suspended')
                state.suspendedRunId = chunk.runId;
            if (chunk.type === 'error')
                state.executionError = chunk.error;
            if (chunk.type === 'finish')
                state.receivedFinish = true;
            if (turn.type === 'start') {
                yield* this.streamStartTurnNotices(chunk, config.context.agentId, recorder);
            }
            for (const attributionChunk of attributionTracker.observe(chunk)) {
                recorder.record(attributionChunk);
                yield attributionChunk;
            }
            yield chunk;
        }
    }
    async settleTurn(turn, config, recorder, executionId, state, chatControl) {
        const finalize = async () => await this.finalizeTurn(turn, config, recorder, executionId, state);
        if (chatControl) {
            await this.chatExecutionService.settle(executionId, finalize, state.suspendedRunId);
        }
        else {
            await finalize();
        }
    }
    async finalizeTurn(turn, config, recorder, executionId, state) {
        const record = recorder.getMessageRecord();
        const cancelled = turn.options.abortSignal?.aborted ||
            (!state.receivedFinish && !recorder.suspended && record.error === null);
        let hitlStatus;
        if (recorder.suspended)
            hitlStatus = 'suspended';
        else if (turn.type === 'resume' && state.executionStarted)
            hitlStatus = 'resumed';
        await this.finalizeExecution({
            executionId,
            executionStarted: state.executionStarted,
            executionError: state.executionError,
            onExecutionRecorded: config.onExecutionRecorded,
            params: {
                ...turn.recording,
                record: cancelled ? { ...record, finishReason: 'cancelled', error: null } : record,
                hitlStatus,
            },
        });
    }
    createRecorder(toolRegistry, getExecutionId = () => undefined, context, backgroundJobSignal, startedAt) {
        return new execution_recorder_1.ExecutionRecorder(toolRegistry, (timeline) => {
            const executionId = getExecutionId();
            if (executionId && context) {
                this.agentExecutionService.recordTimelineSnapshot({
                    projectId: context.projectId,
                    agentId: context.agentId,
                    threadId: context.threadId,
                    executionId,
                    timeline,
                });
            }
        }, backgroundJobSignal, startedAt);
    }
    async startExecution(params, startedAt, executionError) {
        try {
            return await this.agentExecutionService.startExecutionRecording(params, startedAt);
        }
        catch (cause) {
            if (cause instanceof agent_turn_already_running_error_1.AgentTurnAlreadyRunningError)
                throw cause;
            throw new agent_execution_recording_error_1.AgentExecutionRecordingError({ phase: 'create', cause, executionError });
        }
    }
    async finalizeExecution(args) {
        const { executionId, executionStarted, executionError, onExecutionRecorded, params } = args;
        let recordedId;
        try {
            recordedId = await this.agentExecutionService.finalizeExecution(executionId, params);
        }
        catch (cause) {
            throw new agent_execution_recording_error_1.AgentExecutionRecordingError({
                phase: 'finalize',
                executionId,
                executionStarted,
                executionError,
                cause,
            });
        }
        onExecutionRecorded?.(recordedId);
    }
    async recordFailedAdmission(admission, params, executionError) {
        const recorder = this.createRecorder(undefined, undefined, undefined, undefined, admission.startedAt);
        recorder.record({ type: 'error', error: executionError });
        recorder.record({ type: 'finish', finishReason: 'error' });
        await this.finalizeExecution({
            executionId: admission.executionId,
            executionStarted: false,
            executionError,
            params: { ...params, record: recorder.getMessageRecord() },
        });
    }
    async recordFailedStart(params, executionError, onExecutionRecorded, options = {}) {
        const recorder = this.createRecorder();
        recorder.record({ type: 'error', error: executionError });
        recorder.record({ type: 'finish', finishReason: 'error' });
        const recordStart = async () => await this.startExecution({
            ...params,
            resumeRunId: params.resumeRunId ?? options.automaticContinuationRunId,
            allowSuspendedPredecessor: Boolean(options.automaticContinuationRunId),
        }, recorder.startedAt, executionError);
        const recordFailure = async (executionId) => {
            await this.finalizeExecution({
                executionId,
                executionStarted: false,
                executionError,
                onExecutionRecorded,
                params: { ...params, record: recorder.getMessageRecord() },
            });
        };
        const { executionId } = await recordStart();
        try {
            await recordFailure(executionId);
        }
        finally {
            await this.messageQueue.settle(params.threadId, executionId);
        }
    }
    async admitTurn(turn, config, recorder, state, chatControl) {
        const admission = config.admittedExecution ??
            (await this.recordTurnStart(turn, config, recorder, state, chatControl));
        state.executionId = admission.executionId;
        return await this.startAcceptedTurn(admission, turn, config, recorder, state, chatControl);
    }
    async recordTurnStart(turn, config, recorder, state, chatControl) {
        turn.options.abortSignal?.throwIfAborted();
        const admission = await this.startExecution({
            ...turn.recording,
            previewChat: config.chatSurface === 'preview' ? true : undefined,
            acceptsSteering: chatControl !== undefined,
            resumeRunId: turn.type === 'resume' ? turn.options.runId : undefined,
            allowSuspendedPredecessor: config.automaticPreviewContinuation,
            ...(config.backgroundJobSignal
                ? { initialTimeline: structuredClone(recorder.getMessageRecord().timeline) }
                : {}),
        }, recorder.startedAt);
        state.executionId = admission.executionId;
        turn.options.abortSignal?.throwIfAborted();
        return admission;
    }
    async startAcceptedTurn(admission, turn, config, recorder, state, chatControl) {
        const { executionId, inputMessageIds } = admission;
        if (turn.type === 'start')
            turn.input = (0, execution_input_1.bindExecutionInput)(turn.input, inputMessageIds);
        const executionSignal = this.agentExecutionService.getAbortSignal(executionId);
        turn.options.abortSignal = turn.options.abortSignal
            ? AbortSignal.any([turn.options.abortSignal, executionSignal])
            : executionSignal;
        if (turn.type === 'start' && turn.options.persistence) {
            turn.options.persistence.hostMetadata = {
                ...turn.options.persistence.hostMetadata,
                [agent_queued_message_1.EXECUTION_METADATA_KEY]: executionId,
            };
        }
        else if (turn.type === 'resume') {
            turn.options.hostMetadata = {
                ...turn.options.hostMetadata,
                [agent_queued_message_1.EXECUTION_METADATA_KEY]: executionId,
            };
        }
        if (chatControl) {
            turn.options.onInputBoundary = async (boundary) => {
                const result = await this.steering.consume({ ...config.context, executionId, resourceId: turn.recording.resourceId }, boundary, recorder, turn.options.abortSignal);
                if (result.stopped)
                    chatControl.controller.abort();
                for (const event of result.events)
                    state.steeredMessages.set(event.message.id, event);
                return result.messages;
            };
            this.chatExecutionService.register({
                ...config.context,
                userId: chatControl.userId,
                executionId,
                surface: chatControl.surface,
            }, chatControl.controller);
            if (!config.isWakeRun)
                chatControl.detachRequest();
        }
        config.onExecutionStarted?.(executionId, config.context.threadId, inputMessageIds);
        turn.options.abortSignal?.throwIfAborted();
        await config.onAdmitted?.();
        turn.options.abortSignal?.throwIfAborted();
        const threadId = config.context.threadId;
        turn.options.onSideCallUsage = (report) => {
            void this.agentExecutionService.recordSideCallUsage(executionId, threadId, report);
        };
        return await this.startTurn(turn, config, recorder, state);
    }
    *streamStartTurnNotices(chunk, agentId, recorder) {
        if (chunk.type === 'tool-call-suspended') {
            this.logger.info('Chat: tool-call-suspended chunk received', {
                agentId,
                toolCallId: chunk.toolCallId,
                toolName: chunk.toolName,
            });
        }
        if (chunk.type !== 'finish' || chunk.finishReason !== 'max-iterations')
            return;
        for (const notice of getMaxIterationsChunks()) {
            recorder.record(notice);
            yield notice;
        }
    }
};
exports.AgentTurnExecutionService = AgentTurnExecutionService;
exports.AgentTurnExecutionService = AgentTurnExecutionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_execution_service_1.AgentExecutionService, agent_chat_execution_service_1.AgentChatExecutionService, agent_message_queue_service_1.AgentMessageQueueService, agent_message_steering_service_1.AgentMessageSteeringService, agent_tool_approval_service_1.AgentToolApprovalService])
], AgentTurnExecutionService);
//# sourceMappingURL=agent-turn-execution.service.js.map