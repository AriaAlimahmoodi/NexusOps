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
exports.PollTriggerTaskHandler = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const scheduler_1 = require("@n8n/scheduler");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_util_1 = require("node:util");
const poll_backoff_service_1 = require("../../workflows/triggers/poll-backoff.service");
const trigger_execution_context_factory_1 = require("../../workflows/triggers/trigger-execution-context.factory");
const resolve_task_trigger_node_1 = require("../resolve-task-trigger-node");
const poll_trigger_task_1 = require("./poll-trigger-task");
class PollTimeoutError extends n8n_workflow_1.OperationalError {
    constructor() {
        super('Poll exceeded its timeout and was abandoned');
        this.failure = { cause: 'temporarily-unavailable' };
    }
}
let PollTriggerTaskHandler = class PollTriggerTaskHandler {
    constructor(logger, triggerExecutionContextFactory, triggersAndPollers, workflowRepository, errorReporter, pollBackoffService, eventService) {
        this.logger = logger;
        this.triggerExecutionContextFactory = triggerExecutionContextFactory;
        this.triggersAndPollers = triggersAndPollers;
        this.workflowRepository = workflowRepository;
        this.errorReporter = errorReporter;
        this.pollBackoffService = pollBackoffService;
        this.eventService = eventService;
        this.taskType = poll_trigger_task_1.POLL_TRIGGER_TASK_TYPE;
        this.logger = this.logger.scoped('scheduler');
    }
    async execute(task, report, { signal: leaseSignal, remainingMs }) {
        const { workflowId, nodeId } = this.parsePayload(task);
        const logContext = { taskId: task.id, jobId: task.jobId, workflowId, nodeId };
        const now = new Date();
        const state = await this.pollBackoffService.getState(workflowId, nodeId).catch(() => null);
        if (this.pollBackoffService.isBackingOff(state, now)) {
            this.logger.debug('Poll is backing off; skipping this occurrence', {
                ...logContext,
                backoffUntil: state?.backoffUntil,
            });
            return report.notDispatched();
        }
        const workflowData = await this.triggerExecutionContextFactory.findPublishedWorkflowData(workflowId, { bypassCache: true });
        if (workflowData === null) {
            this.logger.debug('Workflow has no published version. Skipping the occurrence.', logContext);
            return report.notDispatched();
        }
        if (!this.hasHealthyNodeIds(workflowData)) {
            this.logger.debug('Published version has duplicate or missing node ids; skipping the occurrence until it is healed', logContext);
            return report.notDispatched();
        }
        const node = (0, resolve_task_trigger_node_1.resolveTaskTriggerNode)(workflowData, nodeId, task, 'Poll-trigger task points to a node that is missing or disabled in the published workflow');
        const { workflow, pollFunctions } = await this.triggerExecutionContextFactory.createPollExecutionContext(workflowData, node, {
            fence: { taskId: task.id, leaseEpoch: task.leaseEpoch },
            timeoutSeconds: task.timeoutSeconds,
            remainingMs,
        }, state?.cursor);
        return await (0, n8n_core_1.runPollInStagingScope)(pollFunctions, async () => {
            await workflow.expression.acquireIsolate();
            let polled = false;
            try {
                leaseSignal.throwIfAborted();
                const poll = this.triggersAndPollers.runPollFunction(workflow, node, pollFunctions);
                await Promise.race([poll, (0, node_util_1.aborted)(leaseSignal, pollFunctions)]);
                if (leaseSignal.reason instanceof scheduler_1.TaskTimeoutError) {
                    await this.recordPollTimeout(logContext, node.type, state);
                    return report.notDispatched();
                }
                leaseSignal.throwIfAborted();
                const pollResponse = await poll;
                polled = true;
                await this.pollBackoffService.recordSuccess({ workflowId, nodeId, state });
                leaseSignal.throwIfAborted();
                if (pollResponse !== null) {
                    const isActive = await this.workflowRepository.isActive(workflowId);
                    leaseSignal.throwIfAborted();
                    if (!isActive) {
                        this.logger.debug('Workflow deactivated during poll; discarding the result', logContext);
                        return report.notDispatched();
                    }
                    pollFunctions.__emit(pollResponse);
                    this.logger.debug('Poll returned new data; handed off to a new execution', logContext);
                    return report.dispatched();
                }
                try {
                    const isActive = await this.workflowRepository.isActive(workflowId);
                    leaseSignal.throwIfAborted();
                    if (isActive) {
                        await (0, n8n_core_1.commitStagedCursor)(pollFunctions);
                    }
                }
                catch (error) {
                    leaseSignal.throwIfAborted();
                    this.errorReporter.error(error, {
                        extra: logContext,
                    });
                    this.logger.error('Failed to commit the poll cursor; the next poll repeats the same window', { ...logContext, error });
                }
                leaseSignal.throwIfAborted();
                this.logger.debug('Poll returned no new data; nothing to hand off', logContext);
                return report.notDispatched();
            }
            catch (error) {
                leaseSignal.throwIfAborted();
                if (!polled) {
                    await this.recordFailureIfActive(workflowId, nodeId, error, state, leaseSignal);
                }
                leaseSignal.throwIfAborted();
                pollFunctions.__emitError((0, ensure_error_1.ensureError)(error));
                this.logger.debug('Poll failed at runtime; routed to the error workflow', logContext);
                return report.dispatched();
            }
            finally {
                await workflow.expression.releaseIsolate();
            }
        });
    }
    async recordPollTimeout(logContext, nodeType, state) {
        this.eventService.emit('poll-tick-timed-out', { nodeType });
        this.logger.warn('Poll exceeded its timeout and was abandoned', logContext);
        const { workflowId, nodeId } = logContext;
        await this.recordFailureIfActive(workflowId, nodeId, new PollTimeoutError(), state);
    }
    async recordFailureIfActive(workflowId, nodeId, error, state, leaseSignal) {
        const isActive = await this.workflowRepository.isActive(workflowId).catch(() => true);
        leaseSignal?.throwIfAborted();
        if (isActive) {
            await this.pollBackoffService.recordFailure({
                workflowId,
                nodeId,
                error,
                state,
                now: new Date(),
            });
        }
    }
    hasHealthyNodeIds(workflowData) {
        const ids = workflowData.nodes.map((node) => node.id);
        return ids.every(Boolean) && new Set(ids).size === ids.length;
    }
    parsePayload(task) {
        if (!(0, poll_trigger_task_1.isPollTriggerTaskPayload)(task.payload)) {
            throw new n8n_workflow_1.UnexpectedError('Poll-trigger task payload is missing workflowId or nodeId', {
                extra: { taskId: task.id, jobId: task.jobId },
            });
        }
        return task.payload;
    }
};
exports.PollTriggerTaskHandler = PollTriggerTaskHandler;
exports.PollTriggerTaskHandler = PollTriggerTaskHandler = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, trigger_execution_context_factory_1.TriggerExecutionContextFactory, n8n_core_1.TriggersAndPollers, db_1.WorkflowRepository, n8n_core_1.ErrorReporter, poll_backoff_service_1.PollBackoffService, backend_services_1.EventService])
], PollTriggerTaskHandler);
//# sourceMappingURL=poll-trigger-task-handler.js.map