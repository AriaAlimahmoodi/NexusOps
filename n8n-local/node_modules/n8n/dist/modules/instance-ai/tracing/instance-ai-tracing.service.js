"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiTracingService = void 0;
const instance_ai_1 = require("@n8n/instance-ai");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const nanoid_1 = require("nanoid");
const uuid_1 = require("uuid");
const constants_1 = require("../../../constants");
const proxy_token_manager_1 = require("../../../services/proxy-token-manager");
const run_trace_metadata_1 = require("../run-trace-metadata");
const trace_replay_state_1 = require("../trace-replay-state");
const INSTANCE_AI_FEEDBACK_NAMESPACE = 'c5be4c87-5b6e-49ed-afe1-9c5c1f99a5c0';
class InstanceAiTracingService {
    constructor(options) {
        this.traceContextsByRunId = new Map();
        this.traceReplay = new trace_replay_state_1.TraceReplayState();
        this.logger = options.logger;
        this.eventReader = options.eventReader;
        this.runState = options.runState;
        this.eventLog = options.eventLog;
        this.aiService = options.aiService;
    }
    storeTraceContext(runId, threadId, tracing, messageGroupId) {
        const existing = this.traceContextsByRunId.get(runId);
        if (existing?.tracing.traceWriter &&
            existing.traceSlug &&
            existing.tracing.traceWriter !== tracing.traceWriter) {
            this.traceReplay.preserveWriterEvents(existing.traceSlug, existing.tracing.traceWriter.getEvents());
        }
        this.traceContextsByRunId.set(runId, {
            threadId,
            messageGroupId,
            tracing,
            traceSlug: this.traceReplay.getActiveSlug(),
        });
    }
    getTraceContext(runId) {
        return this.traceContextsByRunId.get(runId)?.tracing;
    }
    getMessageGroupId(runId) {
        return this.traceContextsByRunId.get(runId)?.messageGroupId;
    }
    getTrackedThreadIds() {
        return [...this.traceContextsByRunId.values()].map((entry) => entry.threadId);
    }
    clear() {
        this.traceContextsByRunId.clear();
    }
    getTraceContextForContinuation(threadId, messageGroupId) {
        const entries = [...this.traceContextsByRunId.values()].reverse();
        const sameGroup = messageGroupId === undefined
            ? undefined
            : entries.find((entry) => entry.threadId === threadId && entry.messageGroupId === messageGroupId)?.tracing;
        return sameGroup ?? entries.find((entry) => entry.threadId === threadId)?.tracing;
    }
    registerTraceContext(runId, threadId, tracing, messageGroupId) {
        this.storeTraceContext(runId, threadId, tracing, messageGroupId);
        this.runState.attachTracing(threadId, tracing);
    }
    async createOrchestratorResumeTraceContext(options) {
        const baseTracing = options.baseTracing ??
            this.getTraceContextForContinuation(options.threadId, options.messageGroupId);
        if (!baseTracing)
            return undefined;
        const tracing = await (0, instance_ai_1.continueInstanceAiTraceContext)(baseTracing, {
            threadId: options.threadId,
            messageId: options.messageId,
            messageGroupId: options.messageGroupId,
            runId: options.runId,
            userId: options.userId,
            modelId: options.modelId,
            input: options.input,
            proxyConfig: options.proxyConfig ?? baseTracing?.proxyConfig,
            metadata: {
                resume_reason: options.resumeReason,
                agent_id: (0, instance_ai_1.orchestratorAgentId)(options.runId),
                ...options.metadata,
            },
            n8nVersion: constants_1.N8N_VERSION,
            workflowSdkVersion: constants_1.WORKFLOW_SDK_VERSION,
            browserExtension: options.browserExtension,
        });
        if (tracing) {
            await this.configureTraceReplayMode(tracing);
            if (options.register !== false) {
                this.registerTraceContext(options.runId, options.threadId, tracing, options.messageGroupId);
            }
        }
        return tracing;
    }
    async configureTraceReplayMode(tracing) {
        await this.traceReplay.configureReplayMode(tracing);
    }
    async finalizeMessageTraceRoot(runId, tracing, options) {
        if (tracing.rootRun.endTime)
            return;
        const outputs = options.outputs ?? {
            status: options.status,
            runId,
            ...(options.outputText ? { response: options.outputText } : {}),
            ...(options.reason ? { reason: options.reason } : {}),
        };
        const metadata = {
            final_status: options.status,
            ...(options.modelId !== undefined ? { model_id: options.modelId } : {}),
            ...options.metadata,
        };
        try {
            await tracing.finishRun(tracing.rootRun, {
                outputs,
                metadata,
                ...(options.error
                    ? { error: options.error }
                    : options.status === 'error' && options.reason
                        ? { error: options.reason }
                        : {}),
            });
        }
        catch (error) {
            this.logger.warn('Failed to finalize Instance AI message trace root', {
                runId,
                threadId: tracing.rootRun.metadata?.thread_id,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
        finally {
            (0, instance_ai_1.releaseTraceClient)(tracing.rootRun.traceId);
        }
    }
    async maybeFinalizeRunTraceRoot(runId, options) {
        const tracing = this.getTraceContext(runId);
        if (!tracing)
            return;
        await this.finalizeMessageTraceRoot(runId, tracing, options);
    }
    async buildMessageTraceMetadata(threadId, runId, options) {
        const traceOptions = {
            status: options.status,
            ...(options.cancellationReason !== undefined
                ? { cancellationReason: options.cancellationReason }
                : {}),
            ...(options.runTimeout !== undefined ? { runTimeout: options.runTimeout } : {}),
        };
        let events = [];
        let eventsUnavailable = false;
        try {
            events = await this.eventReader.getEventsForRun(threadId, runId);
        }
        catch (error) {
            eventsUnavailable = true;
            this.logger.warn('Failed to read run events for Instance AI trace metadata', {
                runId,
                threadId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
        return {
            completion_source: 'orchestrator',
            ...(0, run_trace_metadata_1.buildInstanceAiRunTraceMetadata)(events, traceOptions),
            ...(eventsUnavailable ? { first_visible_state_unavailable: true } : {}),
        };
    }
    async finalizeRemainingMessageTraceRoots(threadId, options) {
        const finalizedMessageRuns = new Set();
        for (const [runId, entry] of this.traceContextsByRunId) {
            if (entry.threadId !== threadId)
                continue;
            if (finalizedMessageRuns.has(entry.tracing.rootRun.id))
                continue;
            finalizedMessageRuns.add(entry.tracing.rootRun.id);
            await this.finalizeMessageTraceRoot(runId, entry.tracing, options);
        }
    }
    deleteTraceContextsForThread(threadId) {
        for (const [runId, entry] of this.traceContextsByRunId) {
            if (entry.threadId === threadId) {
                (0, instance_ai_1.releaseTraceClient)(entry.tracing.rootRun.traceId);
                if (entry.tracing.traceWriter && entry.traceSlug) {
                    this.traceReplay.preserveWriterEvents(entry.traceSlug, entry.tracing.traceWriter.getEvents());
                }
                this.traceContextsByRunId.delete(runId);
            }
        }
    }
    deleteTraceContextsForSlug(slug) {
        for (const [runId, entry] of this.traceContextsByRunId) {
            if (entry.traceSlug === slug) {
                (0, instance_ai_1.releaseTraceClient)(entry.tracing.rootRun.traceId);
                this.traceContextsByRunId.delete(runId);
            }
        }
    }
    clearTraceContextsForTest() {
        for (const entry of this.traceContextsByRunId.values()) {
            (0, instance_ai_1.releaseTraceClient)(entry.tracing.rootRun.traceId);
        }
        this.traceContextsByRunId.clear();
    }
    async finalizeDetachedTraceRun(taskId, traceContext, options) {
        if (!traceContext)
            return;
        try {
            if (traceContext.actorRun.id !== traceContext.rootRun.id &&
                traceContext.actorRun.endTime === undefined) {
                await traceContext.finishRun(traceContext.actorRun, {
                    outputs: {
                        status: options.status,
                        ...options.outputs,
                    },
                    metadata: {
                        final_status: options.status,
                        ...options.metadata,
                    },
                    ...(options.error ? { error: options.error } : {}),
                });
            }
            await traceContext.finishRun(traceContext.rootRun, {
                outputs: {
                    status: options.status,
                    ...options.outputs,
                },
                metadata: {
                    final_status: options.status,
                    ...options.metadata,
                },
                ...(options.error ? { error: options.error } : {}),
            });
        }
        catch (error) {
            this.logger.warn('Failed to finalize Instance AI detached trace run', {
                taskId,
                traceRunId: traceContext.rootRun.id,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
        finally {
            (0, instance_ai_1.releaseTraceClient)(traceContext.rootRun.traceId);
        }
    }
    async finalizeRunTracing(runId, tracing, options) {
        if (!tracing)
            return;
        if (tracing.actorRun.endTime)
            return;
        const outputs = options.outputs ?? {
            status: options.status,
            runId,
            ...(options.outputText ? { response: options.outputText } : {}),
            ...(options.reason ? { reason: options.reason } : {}),
        };
        const metadata = {
            final_status: options.status,
            ...(options.modelId !== undefined ? { model_id: options.modelId } : {}),
            ...options.metadata,
        };
        try {
            await tracing.finishRun(tracing.actorRun, {
                outputs,
                metadata,
                ...(options.status === 'error' && options.reason ? { error: options.reason } : {}),
            });
        }
        catch (error) {
            this.logger.warn('Failed to finalize Instance AI run tracing', {
                runId,
                threadId: tracing.actorRun.metadata?.thread_id,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    async finalizeBackgroundTaskTracing(task, status) {
        await this.finalizeDetachedTraceRun(task.taskId, task.traceContext, {
            status,
            outputs: {
                taskId: task.taskId,
                agentId: task.agentId,
                role: task.role,
                ...(task.result ? { result: task.result } : {}),
            },
            ...(status === 'failed' && task.error ? { error: task.error } : {}),
            metadata: {
                ...(task.plannedTaskId ? { planned_task_id: task.plannedTaskId } : {}),
                ...(task.workItemId ? { work_item_id: task.workItemId } : {}),
            },
        });
    }
    async submitLangsmithFeedback(user, threadId, responseId, payload) {
        const anchor = await this.eventLog.findLangsmithAnchor(threadId, responseId);
        if (!anchor) {
            this.logger.debug('No LangSmith anchor for feedback; skipping annotation', {
                threadId,
                responseId,
            });
            return;
        }
        let tracingProxyConfig;
        if (this.aiService.isProxyEnabled()) {
            try {
                const client = await this.aiService.getClient();
                const baseUrl = client.getApiProxyBaseUrl();
                const manager = new proxy_token_manager_1.ProxyTokenManager(async () => await client.getInstanceAiApiProxyToken({ id: user.id }, { userMessageId: (0, nanoid_1.nanoid)() }));
                tracingProxyConfig = {
                    apiUrl: baseUrl + '/langsmith',
                    getAuthHeaders: async () => await manager.getAuthHeaders(),
                };
            }
            catch (error) {
                this.logger.warn('Failed to build LangSmith proxy config for feedback', {
                    threadId,
                    responseId,
                    error: (0, get_error_message_1.getErrorMessage)(error),
                });
                return;
            }
        }
        const key = 'user_score';
        const feedbackId = (0, uuid_1.v5)(`${key}:${responseId}`, INSTANCE_AI_FEEDBACK_NAMESPACE);
        try {
            await (0, instance_ai_1.submitLangsmithUserFeedback)({
                langsmithRunId: anchor.langsmithRunId,
                langsmithTraceId: anchor.langsmithTraceId,
                key,
                score: payload.rating === 'up' ? 1 : 0,
                value: payload.rating,
                comment: payload.comment,
                feedbackId,
                sourceInfo: {
                    thread_id: threadId,
                    response_id: responseId,
                    user_id: user.id,
                    rating: payload.rating,
                },
                proxyConfig: tracingProxyConfig,
            });
        }
        catch (error) {
            this.logger.warn('Failed to submit LangSmith feedback', {
                threadId,
                responseId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    loadTraceEvents(slug, events) {
        this.traceReplay.loadEvents(slug, events);
    }
    getTraceEvents(slug) {
        return this.traceReplay.getEventsWithWriterFallback(slug, this.traceContextsByRunId.values());
    }
    activateTraceSlug(slug) {
        this.traceReplay.activateSlug(slug);
    }
    clearTraceEvents(slug) {
        this.deleteTraceContextsForSlug(slug);
        this.traceReplay.clearEvents(slug);
    }
}
exports.InstanceAiTracingService = InstanceAiTracingService;
//# sourceMappingURL=instance-ai-tracing.service.js.map