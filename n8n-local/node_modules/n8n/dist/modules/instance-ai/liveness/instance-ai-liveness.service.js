"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiLivenessService = exports.INSTANCE_AI_RUN_TIMEOUT_REASON = void 0;
const constants_1 = require("@n8n/constants");
const instance_ai_1 = require("@n8n/instance-ai");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
exports.INSTANCE_AI_RUN_TIMEOUT_REASON = 'timeout';
const RUN_TIMEOUT_MESSAGE = 'The run stopped making progress, so I cancelled it. You can retry or adjust the request.';
class InstanceAiLivenessService {
    constructor(options) {
        this.options = options;
        this.timedOutRunIds = new Map();
        this.timedOutActiveRunThreads = new Set();
        this.noticedRunIds = new Set();
    }
    get backgroundTaskIdleTimeoutMs() {
        return this.options.backgroundTaskIdleTimeoutMs;
    }
    start() {
        if (!this.options.policy.hasEnabledTimeouts())
            return;
        this.timeoutInterval = setInterval(() => {
            void this.sweepTimedOutWork();
        }, constants_1.Time.minutes.toMilliseconds);
    }
    shutdown() {
        if (this.timeoutInterval) {
            clearInterval(this.timeoutInterval);
            this.timeoutInterval = undefined;
        }
        this.timedOutRunIds.clear();
        this.timedOutActiveRunThreads.clear();
        this.noticedRunIds.clear();
    }
    clearThreadState(threadId) {
        this.timedOutActiveRunThreads.delete(threadId);
    }
    markRunTimedOut(runId, details) {
        this.timedOutRunIds.set(runId, details);
    }
    consumeRunTimedOut(runId) {
        const timedOut = this.timedOutRunIds.has(runId);
        if (timedOut)
            this.timedOutRunIds.delete(runId);
        return timedOut;
    }
    consumeRunTimeout(runId) {
        const timedOut = this.timedOutRunIds.has(runId);
        if (!timedOut)
            return { timedOut: false };
        const details = this.timedOutRunIds.get(runId);
        this.timedOutRunIds.delete(runId);
        return details ? { timedOut: true, details } : { timedOut: true };
    }
    hasTimedOutActiveRunThread(threadId) {
        return this.timedOutActiveRunThreads.has(threadId);
    }
    async sweepTimedOutWork(now = Date.now()) {
        const { activeThreadIds, suspendedThreadIds, confirmationRequestIds, activeTimeouts, suspendedTimeouts, confirmationTimeouts, } = this.options.runState.sweepTimedOut(this.options.policy, now);
        for (const threadId of activeThreadIds) {
            this.options.logger.debug('Cancelling timed-out active run', { threadId });
            this.cancelTimedOutActiveRun(threadId, activeTimeouts?.[threadId]);
        }
        for (const threadId of suspendedThreadIds) {
            this.options.logger.debug('Auto-rejecting timed-out suspended run', { threadId });
            this.cancelTimedOutSuspendedRun(threadId, suspendedTimeouts?.[threadId]);
        }
        for (const reqId of confirmationRequestIds) {
            this.options.logger.debug('Auto-rejecting timed-out sub-agent confirmation', {
                requestId: reqId,
            });
            const pending = this.options.runState.getPendingConfirmation(reqId);
            if (pending) {
                const runId = this.options.runState.getActiveRunId(pending.threadId);
                if (runId) {
                    this.markRunTimedOut(runId, confirmationTimeouts?.[reqId]);
                    this.publishRunTimeoutNotice(pending.threadId, runId);
                }
            }
            this.options.runState.rejectPendingConfirmation(reqId);
            this.options.onPendingConfirmationRejected?.(reqId);
        }
        try {
            const timedOutTasks = await this.options.backgroundTasks.timeoutTimedOutTasks(this.options.policy, now, {
                shouldSkipTask: (task) => this.options.runState.hasPendingConfirmationForThread(task.threadId),
            });
            for (const task of timedOutTasks) {
                this.options.logger.debug('Timed out background task', {
                    threadId: task.threadId,
                    taskId: task.taskId,
                    role: task.role,
                    timeoutReason: task.timeoutReason,
                });
            }
        }
        catch (error) {
            this.options.logger.warn('Failed to sweep timed-out background tasks', {
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    cancelTimedOutActiveRun(threadId, details) {
        const active = this.options.runState.cancelActiveRun(threadId);
        if (!active)
            return;
        this.markRunTimedOut(active.runId, details);
        this.timedOutActiveRunThreads.add(threadId);
        this.publishRunTimeoutNotice(threadId, active.runId);
        active.abortController.abort();
    }
    cancelTimedOutSuspendedRun(threadId, details) {
        const suspended = this.options.runState.cancelSuspendedRun(threadId);
        if (!suspended)
            return;
        this.markRunTimedOut(suspended.runId, details);
        suspended.abortController.abort();
        this.options.finalizeCancelledSuspendedRun(suspended, exports.INSTANCE_AI_RUN_TIMEOUT_REASON);
    }
    publishRunTimeoutNotice(threadId, runId) {
        if (this.noticedRunIds.has(runId))
            return;
        this.options.eventBus.publish(threadId, {
            type: 'text-delta',
            runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            responseId: `run-timeout:${runId}`,
            payload: { text: RUN_TIMEOUT_MESSAGE },
        });
        this.rememberNoticedRunId(runId);
    }
    rememberNoticedRunId(runId) {
        this.noticedRunIds.add(runId);
        if (this.noticedRunIds.size > InstanceAiLivenessService.NOTICE_DEDUPE_CACHE_SIZE) {
            const oldest = this.noticedRunIds.values().next().value;
            if (oldest !== undefined)
                this.noticedRunIds.delete(oldest);
        }
    }
}
exports.InstanceAiLivenessService = InstanceAiLivenessService;
InstanceAiLivenessService.NOTICE_DEDUPE_CACHE_SIZE = 1000;
//# sourceMappingURL=instance-ai-liveness.service.js.map