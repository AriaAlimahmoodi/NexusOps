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
exports.TaskBroker = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const task_deferred_error_1 = require("../../task-runners/task-broker/errors/task-deferred.error");
const task_reject_error_1 = require("../../task-runners/task-broker/errors/task-reject.error");
const task_requester_accept_timeout_error_1 = require("../../task-runners/task-broker/errors/task-requester-accept-timeout.error");
const task_runner_accept_timeout_error_1 = require("../../task-runners/task-broker/errors/task-runner-accept-timeout.error");
const task_runner_execution_timeout_error_1 = require("../../task-runners/task-broker/errors/task-runner-execution-timeout.error");
const task_runner_shutdown_timeout_error_1 = require("../../task-runners/task-broker/errors/task-runner-shutdown-timeout.error");
const task_runner_unreachable_error_1 = require("../../task-runners/task-broker/errors/task-runner-unreachable.error");
const task_runner_lifecycle_events_1 = require("../../task-runners/task-runner-lifecycle-events");
const MAX_REQUEST_TIMEOUT_REFRESHES = 3;
const MAX_CONSECUTIVE_ACCEPT_TIMEOUTS = 3;
const MIN_SILENCE_DURATION_MS = 2_000;
let TaskBroker = class TaskBroker {
    constructor(logger, taskRunnersConfig, taskRunnerLifecycleEvents, globalConfig) {
        this.logger = logger;
        this.taskRunnersConfig = taskRunnersConfig;
        this.taskRunnerLifecycleEvents = taskRunnerLifecycleEvents;
        this.globalConfig = globalConfig;
        this.knownRunners = new Map();
        this.requesters = new Map();
        this.tasks = new Map();
        this.isDraining = false;
        this.runnerAcceptRejects = new Map();
        this.requesterAcceptRejects = new Map();
        this.consecutiveAcceptTimeouts = new Map();
        this.silentRunnersSince = new Map();
        this.pendingTaskOffers = [];
        this.pendingTaskRequests = [];
        this.requestTimesOutAt = new WeakMap();
        this.mismatchWarned = new Set();
        if (this.taskRunnersConfig.taskTimeout <= 0) {
            throw new n8n_workflow_1.UserError('Task timeout must be greater than 0');
        }
        if (this.taskRunnersConfig.taskRequestTimeout <= 0) {
            throw new n8n_workflow_1.UserError('Task request timeout must be greater than 0');
        }
        if (this.taskRunnersConfig.taskAcceptTimeout <= 0) {
            throw new n8n_workflow_1.UserError('Task accept timeout must be greater than 0');
        }
    }
    createRequestTimeout(requestId) {
        const now = Date.now();
        const requestTimeoutMs = this.taskRunnersConfig.taskRequestTimeout * constants_1.Time.seconds.toMilliseconds;
        const timesOutAt = Math.min(now + requestTimeoutMs, this.shutdownDeadline ?? Infinity);
        const timeout = setTimeout(() => {
            this.handleRequestTimeout(requestId);
        }, Math.max(timesOutAt - now, 0));
        this.requestTimesOutAt.set(timeout, timesOutAt);
        return timeout;
    }
    refreshRequestTimeout(request) {
        const isPending = this.pendingTaskRequests.some((r) => r.requestId === request.requestId);
        const refreshes = request.timeoutRefreshes ?? 0;
        if (isPending && refreshes < MAX_REQUEST_TIMEOUT_REFRESHES) {
            request.timeoutRefreshes = refreshes + 1;
            clearTimeout(request.timeout);
            request.timeout = this.createRequestTimeout(request.requestId);
        }
    }
    handleRequestTimeout(requestId) {
        const requestIndex = this.pendingTaskRequests.findIndex((r) => r.requestId === requestId);
        if (requestIndex === -1)
            return;
        const request = this.pendingTaskRequests[requestIndex];
        this.flagSilentRunners(request.taskType);
        this.pendingTaskRequests.splice(requestIndex, 1);
        this.mismatchWarned.delete(requestId);
        clearTimeout(request.timeout);
        void this.requesters.get(request.requesterId)?.({
            type: 'broker:requestexpired',
            requestId: request.requestId,
            reason: 'timeout',
        });
    }
    discardOffers(shouldDiscard) {
        for (let i = this.pendingTaskOffers.length - 1; i >= 0; i--) {
            if (shouldDiscard(this.pendingTaskOffers[i])) {
                this.pendingTaskOffers.splice(i, 1);
            }
        }
    }
    expireTasks() {
        const now = process.hrtime.bigint();
        this.discardOffers(({ validFor, validUntil }) => validFor !== -1 && validUntil < now);
    }
    discardOffersFrom(runnerId) {
        this.discardOffers((offer) => offer.runnerId === runnerId);
    }
    discardOffersFromUnreachableRunners() {
        this.discardOffers((offer) => this.knownRunners.get(offer.runnerId)?.isRunnerReachable() === false);
    }
    registerRunner(runner, messageCallback, isRunnerReachable = () => true) {
        this.knownRunners.set(runner.id, { runner, messageCallback, isRunnerReachable });
        void this.knownRunners.get(runner.id).messageCallback({ type: 'broker:runnerregistered' });
    }
    deregisterRunner(runnerId, error) {
        this.knownRunners.delete(runnerId);
        this.consecutiveAcceptTimeouts.delete(runnerId);
        this.silentRunnersSince.delete(runnerId);
        this.discardOffersFrom(runnerId);
        for (const [taskId, acceptReject] of this.runnerAcceptRejects) {
            if (acceptReject.runnerId === runnerId) {
                this.handleRunnerReject(taskId, `The Task Runner (${runnerId}) has disconnected: ${error.message}`);
            }
        }
        this.failTasks(this.getInFlightTaskIds(runnerId), error);
    }
    getInFlightTaskIds(runnerId) {
        return [...this.tasks.values()]
            .filter((task) => task.runnerId === runnerId)
            .map((task) => task.id);
    }
    failTasks(taskIds, error) {
        for (const taskId of taskIds) {
            void this.failTask(taskId, error);
        }
    }
    registerRequester(requesterId, messageCallback) {
        this.requesters.set(requesterId, messageCallback);
    }
    deregisterRequester(requesterId) {
        this.requesters.delete(requesterId);
    }
    async messageRunner(runnerId, message) {
        await this.knownRunners.get(runnerId)?.messageCallback(message);
    }
    async messageRequester(requesterId, message) {
        await this.requesters.get(requesterId)?.(message);
    }
    async onRunnerMessage(runnerId, message) {
        const runner = this.knownRunners.get(runnerId);
        if (!runner) {
            return;
        }
        this.silentRunnersSince.delete(runnerId);
        switch (message.type) {
            case 'runner:taskaccepted':
                this.handleRunnerAccept(message.taskId);
                break;
            case 'runner:taskrejected':
                this.handleRunnerReject(message.taskId, message.reason);
                break;
            case 'runner:taskdeferred':
                this.handleRunnerDeferred(message.taskId);
                break;
            case 'runner:taskoffer':
                this.taskOffered({
                    runnerId,
                    taskType: message.taskType,
                    offerId: message.offerId,
                    validFor: message.validFor,
                    validUntil: message.validFor === -1
                        ? 0n
                        : process.hrtime.bigint() + BigInt(message.validFor * 1_000_000),
                });
                break;
            case 'runner:taskdone':
                this.resetAcceptTimeoutsOnOwnTask(runnerId, message.taskId);
                await this.taskDoneHandler(message.taskId, message.data);
                break;
            case 'runner:taskerror':
                this.resetAcceptTimeoutsOnOwnTask(runnerId, message.taskId);
                await this.taskErrorHandler(message.taskId, message.error);
                break;
            case 'runner:taskdatarequest':
                await this.handleDataRequest(message.taskId, message.requestId, message.requestParams);
                break;
            case 'runner:nodetypesrequest':
                await this.handleNodeTypesRequest(message.taskId, message.requestId, message.requestParams);
                break;
            case 'runner:rpc':
                await this.handleRpcRequest(message.taskId, message.callId, message.name, message.params);
                break;
            case 'runner:info':
                break;
        }
    }
    async handleRpcRequest(taskId, callId, name, params) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return;
        }
        await this.messageRequester(task.requesterId, {
            type: 'broker:rpc',
            taskId,
            callId,
            name,
            params,
        });
    }
    handleRunnerAccept(taskId) {
        const acceptReject = this.runnerAcceptRejects.get(taskId);
        if (acceptReject) {
            this.consecutiveAcceptTimeouts.delete(acceptReject.runnerId);
            acceptReject.accept();
            this.runnerAcceptRejects.delete(taskId);
        }
    }
    handleRunnerReject(taskId, reason) {
        const acceptReject = this.runnerAcceptRejects.get(taskId);
        if (acceptReject) {
            this.consecutiveAcceptTimeouts.delete(acceptReject.runnerId);
            acceptReject.reject(new task_reject_error_1.TaskRejectError(reason));
            this.runnerAcceptRejects.delete(taskId);
        }
    }
    handleRunnerDeferred(taskId) {
        const acceptReject = this.runnerAcceptRejects.get(taskId);
        if (acceptReject) {
            this.consecutiveAcceptTimeouts.delete(acceptReject.runnerId);
            acceptReject.reject(new task_deferred_error_1.TaskDeferredError());
            this.runnerAcceptRejects.delete(taskId);
        }
    }
    async handleDataRequest(taskId, requestId, requestParams) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return;
        }
        await this.messageRequester(task.requesterId, {
            type: 'broker:taskdatarequest',
            taskId,
            requestId,
            requestParams,
        });
    }
    async handleNodeTypesRequest(taskId, requestId, requestParams) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return;
        }
        await this.messageRequester(task.requesterId, {
            type: 'broker:nodetypesrequest',
            taskId,
            requestId,
            requestParams,
        });
    }
    async handleResponse(taskId, requestId, data) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return;
        }
        await this.messageRunner(task.requesterId, {
            type: 'broker:taskdataresponse',
            taskId,
            requestId,
            data,
        });
    }
    async onRequesterMessage(requesterId, message) {
        switch (message.type) {
            case 'requester:tasksettings':
                this.handleRequesterAccept(message.taskId, message.settings);
                break;
            case 'requester:taskcancel':
                await this.cancelTask(message.taskId, message.reason);
                break;
            case 'requester:taskrequest':
                this.taskRequested({
                    taskType: message.taskType,
                    requestId: message.requestId,
                    requesterId,
                    timeout: this.createRequestTimeout(message.requestId),
                });
                break;
            case 'requester:taskdataresponse':
                await this.handleRequesterDataResponse(message.taskId, message.requestId, message.data);
                break;
            case 'requester:nodetypesresponse':
                await this.handleRequesterNodeTypesResponse(message.taskId, message.requestId, message.nodeTypes);
                break;
            case 'requester:rpcresponse':
                await this.handleRequesterRpcResponse(message.taskId, message.callId, message.status, message.data);
                break;
        }
    }
    async handleRequesterRpcResponse(taskId, callId, status, data) {
        if (!this.tasks.has(taskId))
            return;
        const runner = await this.getRunnerOrFailTask(taskId);
        await this.messageRunner(runner.id, {
            type: 'broker:rpcresponse',
            taskId,
            callId,
            status,
            data,
        });
    }
    async handleRequesterDataResponse(taskId, requestId, data) {
        if (!this.tasks.has(taskId))
            return;
        const runner = await this.getRunnerOrFailTask(taskId);
        await this.messageRunner(runner.id, {
            type: 'broker:taskdataresponse',
            taskId,
            requestId,
            data,
        });
    }
    async handleRequesterNodeTypesResponse(taskId, requestId, nodeTypes) {
        if (!this.tasks.has(taskId))
            return;
        const runner = await this.getRunnerOrFailTask(taskId);
        await this.messageRunner(runner.id, {
            type: 'broker:nodetypes',
            taskId,
            requestId,
            nodeTypes,
        });
    }
    handleRequesterAccept(taskId, settings) {
        const acceptReject = this.requesterAcceptRejects.get(taskId);
        if (acceptReject) {
            acceptReject.accept(settings);
            this.requesterAcceptRejects.delete(taskId);
        }
    }
    handleRequesterReject(taskId, reason) {
        const acceptReject = this.requesterAcceptRejects.get(taskId);
        if (acceptReject) {
            acceptReject.reject(new task_reject_error_1.TaskRejectError(reason));
            this.requesterAcceptRejects.delete(taskId);
        }
    }
    untrackTask(taskId) {
        const task = this.tasks.get(taskId);
        if (task) {
            clearTimeout(task.timeout);
            this.tasks.delete(taskId);
        }
        return task;
    }
    async cancelTask(taskId, reason) {
        const task = this.untrackTask(taskId);
        if (task) {
            await this.messageRunner(task.runnerId, {
                type: 'broker:taskcancel',
                taskId,
                reason,
            });
        }
    }
    async failTask(taskId, error) {
        const task = this.untrackTask(taskId);
        if (task) {
            await this.messageRequester(task.requesterId, {
                type: 'broker:taskerror',
                taskId,
                error,
            });
        }
    }
    async getRunnerOrFailTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new n8n_workflow_1.UnexpectedError(`Cannot find runner, failed to find task (${taskId})`);
        }
        const runner = this.knownRunners.get(task.runnerId);
        if (!runner) {
            const error = new n8n_workflow_1.UnexpectedError(`Cannot find runner, failed to find runner (${task.runnerId})`);
            await this.failTask(taskId, error);
            throw error;
        }
        if (!runner.isRunnerReachable()) {
            const error = new task_runner_unreachable_error_1.TaskRunnerUnreachableError(taskId, task.runnerId);
            await this.failTask(taskId, error);
            throw error;
        }
        return runner.runner;
    }
    async sendTaskSettings(taskId, settings) {
        if (!this.tasks.has(taskId))
            return;
        const runner = await this.getRunnerOrFailTask(taskId);
        const task = this.tasks.get(taskId);
        if (!task)
            return;
        const taskTimeoutMs = this.taskRunnersConfig.taskTimeout * constants_1.Time.seconds.toMilliseconds;
        task.timesOutAt = Math.min(Date.now() + taskTimeoutMs, this.shutdownDeadline ?? Infinity);
        task.timeout = setTimeout(async () => {
            await this.handleTaskTimeout(taskId);
        }, task.timesOutAt - Date.now());
        await this.messageRunner(runner.id, {
            type: 'broker:tasksettings',
            taskId,
            settings,
        });
    }
    async handleTaskTimeout(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            return;
        const isCappedByShutdown = this.shutdownDeadline !== undefined && task.timesOutAt === this.shutdownDeadline;
        if (this.taskRunnersConfig.mode === 'internal') {
            if (this.shutdownDeadline === undefined) {
                this.taskRunnerLifecycleEvents.emit('runner:timed-out-during-task', {
                    runnerId: task.runnerId,
                });
            }
        }
        else if (this.taskRunnersConfig.mode === 'external') {
            await this.messageRunner(task.runnerId, {
                type: 'broker:taskcancel',
                taskId,
                reason: isCappedByShutdown
                    ? 'Task aborted because this n8n instance is shutting down'
                    : 'Task execution timed out',
            });
        }
        const { taskTimeout, mode } = this.taskRunnersConfig;
        await this.taskErrorHandler(taskId, isCappedByShutdown
            ? new task_runner_shutdown_timeout_error_1.TaskRunnerShutdownTimeoutError()
            : new task_runner_execution_timeout_error_1.TaskRunnerExecutionTimeoutError({
                taskTimeout,
                isSelfHosted: this.globalConfig.deployment.type !== 'cloud',
                mode,
            }));
    }
    async taskDoneHandler(taskId, data) {
        const task = this.untrackTask(taskId);
        if (task) {
            await this.requesters.get(task.requesterId)?.({
                type: 'broker:taskdone',
                taskId: task.id,
                data,
            });
        }
    }
    async taskErrorHandler(taskId, error) {
        const task = this.untrackTask(taskId);
        if (task) {
            await this.requesters.get(task.requesterId)?.({
                type: 'broker:taskerror',
                taskId: task.id,
                error,
            });
        }
    }
    async acceptOffer(offer, request) {
        const taskId = (0, nanoid_1.nanoid)(8);
        let runnerAcceptTimer;
        try {
            const acceptPromise = new Promise((resolve, reject) => {
                this.runnerAcceptRejects.set(taskId, {
                    accept: resolve,
                    reject,
                    runnerId: offer.runnerId,
                });
                runnerAcceptTimer = setTimeout(() => {
                    reject(new task_runner_accept_timeout_error_1.TaskRunnerAcceptTimeoutError(taskId, offer.runnerId));
                }, this.taskRunnersConfig.taskAcceptTimeout * constants_1.Time.seconds.toMilliseconds);
            });
            await this.messageRunner(offer.runnerId, {
                type: 'broker:taskofferaccept',
                offerId: offer.offerId,
                taskId,
            });
            await acceptPromise;
        }
        catch (e) {
            request.acceptInProgress = false;
            if (e instanceof task_reject_error_1.TaskRejectError) {
                this.logger.info(`Task (${taskId}) rejected by Runner with reason "${e.reason}"`);
                this.settleTasks();
                return;
            }
            if (e instanceof task_deferred_error_1.TaskDeferredError) {
                this.logger.debug(`Task (${taskId}) deferred until runner is ready`);
                this.refreshRequestTimeout(request);
                return;
            }
            if (e instanceof task_runner_accept_timeout_error_1.TaskRunnerAcceptTimeoutError) {
                this.logger.warn(e.message);
                this.runnerAcceptRejects.delete(taskId);
                this.refreshRequestTimeout(request);
                await this.messageRunner(offer.runnerId, {
                    type: 'broker:taskcancel',
                    taskId,
                    reason: 'Acknowledgement window elapsed',
                });
                this.discardOffersFrom(offer.runnerId);
                this.flagRunnerIfUnresponsive(offer.runnerId);
                this.settleTasks();
                return;
            }
            throw e;
        }
        finally {
            clearTimeout(runnerAcceptTimer);
        }
        clearTimeout(request.timeout);
        const task = {
            id: taskId,
            taskType: offer.taskType,
            runnerId: offer.runnerId,
            requesterId: request.requesterId,
        };
        this.tasks.set(taskId, task);
        const requestIndex = this.pendingTaskRequests.findIndex((r) => r.requestId === request.requestId);
        if (requestIndex === -1) {
            this.logger.warn(`Task request (${request.requestId}) expired while runner (${offer.runnerId}) was accepting task (${taskId}), canceling task`);
            await this.cancelTask(taskId, 'Task request expired');
            return;
        }
        this.pendingTaskRequests.splice(requestIndex, 1);
        let requesterAcceptTimer;
        try {
            const acceptPromise = new Promise((resolve, reject) => {
                this.requesterAcceptRejects.set(taskId, {
                    accept: resolve,
                    reject,
                });
                requesterAcceptTimer = setTimeout(() => {
                    reject(new task_requester_accept_timeout_error_1.TaskRequesterAcceptTimeoutError(taskId, request.requesterId));
                }, this.taskRunnersConfig.taskAcceptTimeout * constants_1.Time.seconds.toMilliseconds);
            });
            await this.messageRequester(request.requesterId, {
                type: 'broker:taskready',
                requestId: request.requestId,
                taskId,
            });
            const settings = await acceptPromise;
            await this.sendTaskSettings(task.id, settings);
        }
        catch (e) {
            if (e instanceof task_reject_error_1.TaskRejectError) {
                await this.cancelTask(task.id, e.reason);
                this.logger.info(`Task (${taskId}) rejected by Requester with reason "${e.reason}"`);
                return;
            }
            if (e instanceof task_runner_unreachable_error_1.TaskRunnerUnreachableError) {
                this.logger.warn(e.message);
                return;
            }
            if (e instanceof task_requester_accept_timeout_error_1.TaskRequesterAcceptTimeoutError) {
                this.logger.warn(e.message);
                this.requesterAcceptRejects.delete(taskId);
                await this.cancelTask(task.id, 'Requester took too long to acknowledge the task');
                return;
            }
            await this.cancelTask(task.id, 'Unknown reason');
            throw e;
        }
        finally {
            clearTimeout(requesterAcceptTimer);
        }
    }
    resetAcceptTimeoutsOnOwnTask(runnerId, taskId) {
        if (this.tasks.get(taskId)?.runnerId === runnerId) {
            this.consecutiveAcceptTimeouts.delete(runnerId);
        }
    }
    flagRunnerIfUnresponsive(runnerId) {
        const now = this.monotonicNowMs();
        const previous = this.consecutiveAcceptTimeouts.get(runnerId);
        const acceptWindowMs = this.taskRunnersConfig.taskAcceptTimeout * constants_1.Time.seconds.toMilliseconds;
        if (previous && now - previous.lastTimeoutAt < acceptWindowMs) {
            return;
        }
        const failures = Math.min((previous?.count ?? 0) + 1, MAX_CONSECUTIVE_ACCEPT_TIMEOUTS);
        this.consecutiveAcceptTimeouts.set(runnerId, { count: failures, lastTimeoutAt: now });
        if (failures < MAX_CONSECUTIVE_ACCEPT_TIMEOUTS)
            return;
        const reported = this.reportUnresponsive(runnerId, `failed to acknowledge ${MAX_CONSECUTIVE_ACCEPT_TIMEOUTS} consecutive task acceptances`);
        if (reported) {
            this.consecutiveAcceptTimeouts.delete(runnerId);
        }
    }
    flagSilentRunners(taskType) {
        this.expireTasks();
        const now = this.monotonicNowMs();
        [...this.knownRunners.values()]
            .filter(({ runner }) => runner.taskTypes.includes(taskType))
            .filter(({ isRunnerReachable }) => isRunnerReachable())
            .forEach(({ runner }) => {
            if (!this.isSilent(runner.id)) {
                this.silentRunnersSince.delete(runner.id);
                return;
            }
            const silentSince = this.silentRunnersSince.get(runner.id);
            if (silentSince === undefined) {
                this.silentRunnersSince.set(runner.id, now);
            }
            else if (now - silentSince >= MIN_SILENCE_DURATION_MS) {
                const reported = this.reportUnresponsive(runner.id, 'sent no task offers while task requests expired');
                if (reported) {
                    this.silentRunnersSince.delete(runner.id);
                }
            }
        });
    }
    reportUnresponsive(runnerId, cause) {
        if (this.getInFlightTaskIds(runnerId).length > 0) {
            this.logger.debug(`Runner (${runnerId}) ${cause}, but it still has tasks in flight, so not reporting it as unresponsive`);
            return false;
        }
        this.logger.warn(`Runner (${runnerId}) ${cause}, reporting it as unresponsive`);
        this.taskRunnerLifecycleEvents.emit('runner:unresponsive', { runnerId });
        return true;
    }
    monotonicNowMs() {
        return Number(process.hrtime.bigint() / 1000000n);
    }
    isSilent(runnerId) {
        const hasPendingOffer = this.pendingTaskOffers.some((offer) => offer.runnerId === runnerId);
        const hasInFlightTask = this.getInFlightTaskIds(runnerId).length > 0;
        const hasAcceptanceInProgress = [...this.runnerAcceptRejects.values()].some((acceptReject) => acceptReject.runnerId === runnerId);
        return !hasPendingOffer && !hasInFlightTask && !hasAcceptanceInProgress;
    }
    settleTasks() {
        this.expireTasks();
        this.discardOffersFromUnreachableRunners();
        for (const request of this.pendingTaskRequests) {
            if (request.acceptInProgress) {
                continue;
            }
            const offerIndex = this.pendingTaskOffers.findIndex((o) => o.taskType === request.taskType);
            if (offerIndex === -1) {
                this.warnOnTaskTypeMismatch(request);
                continue;
            }
            const offer = this.pendingTaskOffers[offerIndex];
            request.acceptInProgress = true;
            this.pendingTaskOffers.splice(offerIndex, 1);
            this.mismatchWarned.delete(request.requestId);
            void this.acceptOffer(offer, request);
        }
    }
    warnOnTaskTypeMismatch(request) {
        if (this.pendingTaskOffers.length === 0)
            return;
        if (this.mismatchWarned.has(request.requestId))
            return;
        const offerTypes = [...new Set(this.pendingTaskOffers.map((o) => o.taskType))];
        this.logger.warn(`No matching task offer for request "${request.requestId}" (type "${request.taskType}"). Available offer types: [${offerTypes.join(', ')}]`);
        this.mismatchWarned.add(request.requestId);
    }
    taskRequested(request) {
        if (this.isDraining) {
            clearTimeout(request.timeout);
            void this.requesters.get(request.requesterId)?.({
                type: 'broker:requestexpired',
                requestId: request.requestId,
                reason: 'draining',
            });
            return;
        }
        this.pendingTaskRequests.push(request);
        this.settleTasks();
    }
    taskOffered(offer) {
        this.pendingTaskOffers.push(offer);
        this.settleTasks();
    }
    startDraining() {
        this.isDraining = true;
    }
    hasActiveTasks() {
        return this.tasks.size > 0;
    }
    capTaskTimeoutsForShutdown(deadline) {
        this.shutdownDeadline = deadline;
        const cappedTaskIds = [];
        for (const [taskId, task] of this.tasks) {
            if (!task.timeout)
                continue;
            if (task.timesOutAt !== undefined && task.timesOutAt <= deadline)
                continue;
            clearTimeout(task.timeout);
            task.timesOutAt = deadline;
            task.timeout = setTimeout(async () => {
                await this.handleTaskTimeout(taskId);
            }, Math.max(deadline - Date.now(), 0));
            cappedTaskIds.push(taskId);
        }
        this.capRequestTimeoutsForShutdown(deadline);
        if (cappedTaskIds.length > 0) {
            this.logger.info(`Capped ${cappedTaskIds.length} in-flight task timeout(s) to fit the shutdown window (task IDs: ${cappedTaskIds.join(', ')})`);
        }
    }
    capRequestTimeoutsForShutdown(deadline) {
        for (const request of this.pendingTaskRequests) {
            if (!request.timeout)
                continue;
            const timesOutAt = this.requestTimesOutAt.get(request.timeout);
            if (timesOutAt !== undefined && timesOutAt <= deadline)
                continue;
            clearTimeout(request.timeout);
            request.timeout = this.createRequestTimeout(request.requestId);
        }
    }
    stopDraining() {
        this.isDraining = false;
    }
    getTasks() {
        return this.tasks;
    }
    getPendingTaskOffers() {
        return this.pendingTaskOffers;
    }
    getPendingTaskRequests() {
        return this.pendingTaskRequests;
    }
    getKnownRunners() {
        return this.knownRunners;
    }
    getKnownRequesters() {
        return this.requesters;
    }
    getRunnerAcceptRejects() {
        return this.runnerAcceptRejects;
    }
    getRequesterAcceptRejects() {
        return this.requesterAcceptRejects;
    }
    setTasks(tasks) {
        this.tasks = new Map(Object.entries(tasks));
    }
    setPendingTaskOffers(pendingTaskOffers) {
        this.pendingTaskOffers = pendingTaskOffers;
    }
    setPendingTaskRequests(pendingTaskRequests) {
        this.pendingTaskRequests = pendingTaskRequests;
    }
    setRunnerAcceptRejects(runnerAcceptRejects) {
        this.runnerAcceptRejects = new Map(Object.entries(runnerAcceptRejects));
    }
};
exports.TaskBroker = TaskBroker;
exports.TaskBroker = TaskBroker = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.TaskRunnersConfig, task_runner_lifecycle_events_1.TaskRunnerLifecycleEvents, config_1.GlobalConfig])
], TaskBroker);
//# sourceMappingURL=task-broker.service.js.map