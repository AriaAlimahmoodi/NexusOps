"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiTerminalOutcomeService = void 0;
const instance_ai_1 = require("@n8n/instance-ai");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const n8n_workflow_1 = require("n8n-workflow");
function getBackgroundOutcomeResponseId(outcome) {
    return `background-outcome:${outcome.id}`;
}
class InstanceAiTerminalOutcomeService {
    constructor(options) {
        this.pendingTerminalOutcomes = new Map();
        this.eventBus = options.eventBus;
        this.agentMemory = options.agentMemory;
        this.telemetry = options.telemetry;
        this.errorReporter = options.errorReporter;
        this.logger = options.logger;
        this.runState = options.runState;
        this.suspendedThreads = options.suspendedThreads;
        this.tracing = options.tracing;
        this.publishRunFinish = options.publishRunFinish;
    }
    async evaluateTerminalResponse(threadId, runId, status, options = {}) {
        const guard = new instance_ai_1.InstanceAiTerminalResponseGuard({
            runId,
            rootAgentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            messageGroupId: options.messageGroupId,
            correlationId: options.correlationId,
        });
        const decision = guard.evaluateTerminal(await this.getTerminalGuardEvents(threadId, runId, options.messageGroupId), status, {
            workSummary: options.workSummary,
            errorMessage: options.errorMessage,
            errorCode: options.errorCode,
            suppressCompletedFallback: options.suppressCompletedFallback,
        });
        this.handleTerminalResponseDecision(threadId, runId, decision, options.messageGroupId);
        return decision;
    }
    async evaluateWaitingResponse(threadId, runId, confirmationEvent, options = {}) {
        const guard = new instance_ai_1.InstanceAiTerminalResponseGuard({
            runId,
            rootAgentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            messageGroupId: options.messageGroupId,
            correlationId: options.correlationId,
        });
        const decision = guard.evaluateWaiting(await this.getTerminalGuardEvents(threadId, runId, options.messageGroupId), confirmationEvent);
        this.handleTerminalResponseDecision(threadId, runId, decision, options.messageGroupId);
        return decision;
    }
    async getTerminalGuardEvents(threadId, runId, messageGroupId) {
        if (!messageGroupId)
            return await this.eventBus.getEventsForRun(threadId, runId);
        const groupRunIds = this.runState.getRunIdsForMessageGroup(messageGroupId);
        return groupRunIds.length > 0
            ? await this.eventBus.getEventsForRuns(threadId, groupRunIds)
            : await this.eventBus.getEventsForRun(threadId, runId);
    }
    handleTerminalResponseDecision(threadId, runId, decision, messageGroupId) {
        this.telemetry.track('instance_ai_terminal_response_decision', {
            thread_id: threadId,
            run_id: runId,
            message_group_id: messageGroupId,
            source: 'terminal_guard',
            status: decision.status,
            action: decision.action,
            reason: decision.reason,
            visibility_source: decision.visibilitySource,
        });
        if (decision.reason === 'completed-after-error') {
            this.logger.warn('completed_after_error_event', {
                threadId,
                runId,
                messageGroupId,
            });
        }
        if (decision.reason === 'completed-silent') {
            this.errorReporter.report(new n8n_workflow_1.OperationalError('Instance AI run completed without a final response'), {
                component: 'instance-ai-terminal-guard',
                severity: 'warning',
                threadId,
                runId,
                messageGroupId,
            });
        }
        if (decision.reason === 'confirmation-invalid') {
            this.logger.warn('invalid_confirmation_payload', {
                threadId,
                runId,
                messageGroupId,
            });
        }
        if (decision.action === 'emit' && decision.event) {
            this.eventBus.publish(threadId, decision.event);
        }
    }
    createTerminalOutcomeStorage() {
        this.terminalOutcomeStorage ??= new instance_ai_1.TerminalOutcomeStorage(this.agentMemory);
        return this.terminalOutcomeStorage;
    }
    async finishInvalidConfirmationRun(args) {
        this.runState.cancelThread(args.threadId);
        void this.suspendedThreads.dropPendingConfirmationsForThread(args.threadId);
        args.abortController.abort();
        await this.tracing.finalizeRunTracing(args.runId, args.tracing, {
            status: 'error',
            reason: 'invalid_confirmation_payload',
        });
        this.publishRunFinish(args.threadId, args.runId, 'errored', 'I need your input to continue, but I could not display the prompt. Please try again.', args.promptVersion);
        return {
            status: 'error',
            reason: 'invalid_confirmation_payload',
            metadata: await this.tracing.buildMessageTraceMetadata(args.threadId, args.runId, {
                status: 'error',
            }),
        };
    }
    buildBackgroundTerminalOutcome(task) {
        const status = task.status === 'failed' ? 'failed' : task.status === 'cancelled' ? 'cancelled' : 'completed';
        const userFacingMessage = status === 'completed'
            ? `The background ${task.role} task finished.`
            : status === 'cancelled'
                ? `The background ${task.role} task was cancelled.`
                : `The background ${task.role} task failed before I could complete that part.`;
        return {
            id: `${task.messageGroupId ?? task.runId}:${task.taskId}:${status}`,
            threadId: task.threadId,
            runId: task.runId,
            messageGroupId: task.messageGroupId,
            correlationId: task.messageGroupId,
            taskId: task.taskId,
            agentId: task.agentId,
            status,
            userFacingMessage,
            createdAt: new Date().toISOString(),
        };
    }
    async replayUndeliveredTerminalOutcomes(threadId) {
        const storage = this.createTerminalOutcomeStorage();
        const noOutcomes = [];
        const persistedOutcomes = await storage.getUndelivered(threadId).catch((error) => {
            this.logger.warn('Failed to load undelivered Instance AI terminal outcomes', {
                threadId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
            return noOutcomes;
        });
        const inMemoryOutcomes = [...this.pendingTerminalOutcomes.values()].filter((outcome) => outcome.threadId === threadId);
        const outcomes = new Map();
        for (const outcome of [...persistedOutcomes, ...inMemoryOutcomes]) {
            outcomes.set(outcome.id, outcome);
        }
        const persistedOutcomeIds = new Set(persistedOutcomes.map((outcome) => outcome.id));
        for (const outcome of outcomes.values()) {
            const responseId = getBackgroundOutcomeResponseId(outcome);
            let delivery = 'dropped';
            try {
                delivery = await this.publishTerminalOutcomeLine(outcome, responseId);
            }
            catch (error) {
                this.logger.warn('Failed to replay Instance AI terminal outcome', {
                    threadId,
                    runId: outcome.runId,
                    taskId: outcome.taskId,
                    error: (0, get_error_message_1.getErrorMessage)(error),
                });
            }
            if (delivery === 'dropped')
                continue;
            const action = delivery === 'published' ? 'replay_event' : 'already-emitted';
            if (persistedOutcomeIds.has(outcome.id)) {
                await storage
                    .markDelivered(threadId, outcome.id, new Date().toISOString())
                    .catch((error) => {
                    this.logger.warn('Failed to mark Instance AI terminal outcome as delivered', {
                        threadId,
                        runId: outcome.runId,
                        taskId: outcome.taskId,
                        error: (0, get_error_message_1.getErrorMessage)(error),
                    });
                });
            }
            this.pendingTerminalOutcomes.delete(outcome.id);
            this.telemetry.track('instance_ai_terminal_response_decision', {
                thread_id: threadId,
                run_id: outcome.runId,
                message_group_id: outcome.messageGroupId,
                task_id: outcome.taskId,
                source: 'terminal_outcome_replay',
                status: outcome.status,
                action,
                visibility_source: 'background-outcome',
            });
        }
    }
    async publishTerminalOutcomeLine(outcome, responseId) {
        const isOutcomeLine = (event) => event.responseId === responseId;
        const alreadyPublished = (await this.eventBus.getEventsForRun(outcome.threadId, outcome.runId)).some(isOutcomeLine);
        if (alreadyPublished)
            return 'already-emitted';
        this.eventBus.publish(outcome.threadId, {
            type: 'text-block',
            runId: outcome.runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(outcome.runId),
            responseId,
            payload: { text: outcome.userFacingMessage },
        });
        const durable = (await this.eventBus.getEventsForRun(outcome.threadId, outcome.runId)).some(isOutcomeLine);
        return durable ? 'published' : 'dropped';
    }
    async recordBackgroundTerminalOutcome(task) {
        const outcome = this.buildBackgroundTerminalOutcome(task);
        let persisted = false;
        try {
            await this.createTerminalOutcomeStorage().upsert(task.threadId, outcome);
            persisted = true;
        }
        catch (error) {
            this.pendingTerminalOutcomes.set(outcome.id, outcome);
            this.logger.warn('Failed to persist Instance AI terminal outcome', {
                threadId: task.threadId,
                runId: task.runId,
                taskId: task.taskId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
            this.telemetry.track('instance_ai_terminal_outcome_persistence_failure', {
                thread_id: task.threadId,
                run_id: task.runId,
                task_id: task.taskId,
                status: outcome.status,
                phase: 'metadata',
            });
        }
        const responseId = getBackgroundOutcomeResponseId(outcome);
        let delivery = 'dropped';
        try {
            delivery = await this.publishTerminalOutcomeLine(outcome, responseId);
        }
        catch (error) {
            this.logger.warn('Failed to publish Instance AI terminal outcome line', {
                threadId: task.threadId,
                runId: task.runId,
                taskId: task.taskId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
        if (delivery === 'dropped') {
            this.telemetry.track('instance_ai_terminal_outcome_persistence_failure', {
                thread_id: task.threadId,
                run_id: task.runId,
                task_id: task.taskId,
                status: outcome.status,
                phase: 'event',
            });
            return;
        }
        this.telemetry.track('instance_ai_terminal_response_decision', {
            thread_id: task.threadId,
            run_id: task.runId,
            message_group_id: task.messageGroupId,
            task_id: task.taskId,
            source: 'background_outcome',
            status: outcome.status,
            action: delivery === 'published' ? 'emit' : 'already-emitted',
            visibility_source: 'background-outcome',
        });
        if (!persisted)
            return;
        try {
            await this.createTerminalOutcomeStorage().markDelivered(task.threadId, outcome.id, new Date().toISOString());
            this.pendingTerminalOutcomes.delete(outcome.id);
        }
        catch (error) {
            this.logger.warn('Failed to mark Instance AI terminal outcome as delivered', {
                threadId: task.threadId,
                runId: task.runId,
                taskId: task.taskId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
}
exports.InstanceAiTerminalOutcomeService = InstanceAiTerminalOutcomeService;
//# sourceMappingURL=instance-ai-terminal-outcome.service.js.map