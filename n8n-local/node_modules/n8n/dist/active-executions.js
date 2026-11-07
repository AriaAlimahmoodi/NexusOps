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
exports.ActiveExecutions = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const deferred_promise_1 = require("@n8n/utils/promise/deferred-promise");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const sleep_1 = require("@n8n/utils/sleep");
const node_assert_1 = require("node:assert");
const execution_already_resuming_error_1 = require("./errors/execution-already-resuming.error");
const execution_not_found_error_1 = require("./errors/execution-not-found-error");
const execution_persistence_1 = require("./executions/execution-persistence");
const utils_1 = require("./utils");
const constants_2 = require("./webhooks/constants");
const concurrency_capacity_reservation_1 = require("./concurrency/concurrency-capacity-reservation");
const concurrency_control_service_1 = require("./concurrency/concurrency-control.service");
const DEFAULT_CANCEL_WRITE_TIMEOUT_MS = 3 * constants_1.Time.seconds.toMilliseconds;
let ActiveExecutions = class ActiveExecutions {
    constructor(logger, executionRepository, executionPersistence, concurrencyControl, eventService, executionsConfig, instanceSettings) {
        this.logger = logger;
        this.executionRepository = executionRepository;
        this.executionPersistence = executionPersistence;
        this.concurrencyControl = concurrencyControl;
        this.eventService = eventService;
        this.executionsConfig = executionsConfig;
        this.instanceSettings = instanceSettings;
        this.activeExecutions = {};
        this.responseModes = new Map();
    }
    has(executionId) {
        return this.activeExecutions[executionId] !== undefined;
    }
    async add(executionData, existingExecution) {
        let executionStatus = existingExecution ? 'running' : 'new';
        const mode = executionData.executionMode;
        const capacityReservation = new concurrency_capacity_reservation_1.ConcurrencyCapacityReservation(this.concurrencyControl);
        const shouldReserveCapacity = mode !== 'evaluation';
        let executionId;
        try {
            if (existingExecution === undefined) {
                const fullExecutionData = {
                    data: executionData.executionData,
                    mode,
                    finished: false,
                    workflowData: executionData.workflowData,
                    status: executionStatus,
                    workflowId: executionData.workflowData.id,
                    retryOf: executionData.retryOf ?? undefined,
                    tracingContext: executionData.tracingContext ?? null,
                    deduplicationKey: executionData.deduplicationKey,
                };
                const workflowId = executionData.workflowData.id;
                if (workflowId !== undefined && (0, utils_1.isWorkflowIdValid)(workflowId)) {
                    fullExecutionData.workflowId = workflowId;
                }
                executionId = await this.executionPersistence.create(fullExecutionData);
                (0, node_assert_1.strict)(executionId);
                if (shouldReserveCapacity) {
                    await capacityReservation.reserve({ mode, executionId });
                }
                if (this.executionsConfig.mode === 'regular') {
                    await this.executionRepository.setRunning(executionId);
                }
                executionStatus = 'running';
            }
            else {
                executionId = existingExecution.executionId;
                if (shouldReserveCapacity) {
                    await capacityReservation.reserve({ mode, executionId });
                }
                const execution = {
                    id: executionId,
                    data: executionData.executionData,
                    waitTill: null,
                    status: executionStatus,
                };
                const updateSucceeded = await this.executionPersistence.updateExistingExecution(executionId, execution, { requireStatus: existingExecution.expectedStatus });
                if (!updateSucceeded) {
                    throw new execution_already_resuming_error_1.ExecutionAlreadyResumingError(executionId);
                }
                if (existingExecution.expectedStatus === 'new') {
                    await this.executionRepository.setRunning(executionId);
                }
            }
        }
        catch (error) {
            capacityReservation.release();
            throw error;
        }
        const resumingExecution = this.activeExecutions[executionId];
        const postExecutePromise = (0, deferred_promise_1.createDeferredPromise)();
        const execution = {
            executionData,
            startedAt: resumingExecution?.startedAt ?? new Date(),
            postExecutePromise,
            status: executionStatus,
            responsePromise: resumingExecution?.responsePromise,
            httpResponse: executionData.httpResponse ?? undefined,
        };
        this.activeExecutions[executionId] = execution;
        void postExecutePromise.promise
            .catch((error) => {
            if (error instanceof n8n_workflow_1.ExecutionCancelledError)
                return;
            throw error;
        })
            .finally(() => {
            capacityReservation.release();
            if (execution.status === 'waiting') {
                delete execution.workflowExecution;
            }
            else if (this.activeExecutions[executionId] === execution) {
                delete this.activeExecutions[executionId];
                this.responseModes.delete(executionId);
                this.logger.debug('Execution removed', { executionId });
            }
        });
        this.logger.debug('Execution added', { executionId });
        return executionId;
    }
    attachWorkflowExecution(executionId, workflowExecution, options) {
        const execution = this.getExecutionOrFail(executionId);
        execution.workflowExecution = workflowExecution;
        execution.isQueueJob = options?.isQueueJob;
    }
    attachResponsePromise(executionId, responsePromise) {
        this.getExecutionOrFail(executionId).responsePromise = responsePromise;
    }
    resolveResponsePromise(executionId, response) {
        const execution = this.activeExecutions[executionId];
        execution?.responsePromise?.resolve(response);
    }
    sendChunk(executionId, chunkText) {
        const execution = this.activeExecutions[executionId];
        if (execution?.httpResponse) {
            execution?.httpResponse.write(JSON.stringify(chunkText) + '\n');
            execution?.httpResponse.flush();
        }
    }
    stopExecution(executionId, cancellationError) {
        const execution = this.activeExecutions[executionId];
        if (execution === undefined) {
            return;
        }
        this.logger.debug('Cancelling execution', { executionId, reason: cancellationError.reason });
        const workflowData = execution.executionData.workflowData;
        this.eventService.emit('execution-cancelled', {
            executionId,
            workflowId: workflowData?.id,
            workflowName: workflowData?.name,
            reason: cancellationError.reason,
        });
        execution.responsePromise?.reject(cancellationError);
        if (execution.status === 'waiting') {
            delete this.activeExecutions[executionId];
            this.responseModes.delete(executionId);
        }
        else {
            execution.workflowExecution?.cancel();
            execution.postExecutePromise.reject(cancellationError);
        }
        this.logger.debug('Execution cancelled', { executionId });
    }
    finalizeExecution(executionId, fullRunData) {
        if (!this.has(executionId))
            return;
        const execution = this.getExecutionOrFail(executionId);
        if (execution.executionData.httpResponse) {
            try {
                this.logger.debug('Closing response for execution', { executionId });
                execution.executionData.httpResponse.end();
            }
            catch (error) {
                this.logger.error('Error closing streaming response', {
                    executionId,
                    error: error.message,
                });
            }
        }
        execution.postExecutePromise.resolve(fullRunData);
        this.logger.debug('Execution finalized', { executionId });
    }
    resolveExecutionResponsePromise(executionId) {
        if (!this.has(executionId))
            return;
        const execution = this.getExecutionOrFail(executionId);
        if (execution.status !== 'waiting' && execution?.responsePromise) {
            execution.responsePromise.resolve(constants_2.EXECUTION_ENDED_WITHOUT_RESPONSE);
            this.logger.debug('Execution response promise cleaned', { executionId });
        }
    }
    async getPostExecutePromise(executionId) {
        return await this.getExecutionOrFail(executionId).postExecutePromise.promise;
    }
    getActiveExecutions() {
        const returnData = [];
        let data;
        for (const id of Object.keys(this.activeExecutions)) {
            data = this.activeExecutions[id];
            returnData.push({
                id,
                retryOf: data.executionData.retryOf ?? undefined,
                startedAt: data.startedAt,
                mode: data.executionData.executionMode,
                workflowId: data.executionData.workflowData.id,
                status: data.status,
            });
        }
        return returnData;
    }
    getRunningExecutionIds() {
        return Object.keys(this.activeExecutions).filter((executionId) => this.activeExecutions[executionId].status === 'running' &&
            !this.activeExecutions[executionId].isQueueJob);
    }
    getDiagnosticCounts() {
        return {
            executions: Object.keys(this.activeExecutions).length,
            responseModes: this.responseModes.size,
        };
    }
    async cancelRunningExecutions(writeDeadlineMs = DEFAULT_CANCEL_WRITE_TIMEOUT_MS) {
        const executionIds = this.getRunningExecutionIds().filter((executionId) => this.activeExecutions[executionId].workflowExecution !== undefined);
        if (executionIds.length === 0)
            return executionIds;
        await this.recordAsCancelled(executionIds, writeDeadlineMs);
        for (const executionId of executionIds) {
            this.stopExecution(executionId, new n8n_workflow_1.SystemShutdownExecutionCancelledError(executionId));
        }
        return executionIds;
    }
    async recordAsCancelled(executionIds, writeDeadlineMs) {
        let timeout;
        try {
            await Promise.race([
                this.executionRepository.cancelManyRunning(executionIds),
                new Promise((_, reject) => {
                    timeout = setTimeout(() => reject(new n8n_workflow_1.OperationalError('Timed out writing the cancelled status')), writeDeadlineMs);
                }),
            ]);
        }
        catch (error) {
            this.logger.error(`Failed to record ${executionIds.length} cancelled executions: ${(0, ensure_error_1.ensureError)(error).message}`, { executionIds });
        }
        finally {
            clearTimeout(timeout);
        }
    }
    setStatus(executionId, status) {
        this.getExecutionOrFail(executionId).status = status;
    }
    getStatus(executionId) {
        return this.getExecutionOrFail(executionId).status;
    }
    setResponseMode(executionId, responseMode) {
        this.responseModes.set(executionId, responseMode);
    }
    getResponseMode(executionId) {
        return this.responseModes.get(executionId);
    }
    async shutdown(cancelAll = false) {
        const isRegularMode = this.executionsConfig.mode === 'regular';
        if (isRegularMode) {
            this.concurrencyControl.disable();
        }
        const isWorker = this.instanceSettings.instanceType === 'worker';
        let executionIds = Object.keys(this.activeExecutions);
        const toCancel = [];
        for (const executionId of executionIds) {
            const { status, isQueueJob } = this.activeExecutions[executionId];
            if (isRegularMode && cancelAll) {
                this.stopExecution(executionId, new n8n_workflow_1.SystemShutdownExecutionCancelledError(executionId));
                toCancel.push(executionId);
            }
            else if (status === 'waiting' || status === 'new' || (isWorker && isQueueJob)) {
                delete this.activeExecutions[executionId];
            }
        }
        await this.concurrencyControl.removeAll(toCancel);
        let count = 0;
        executionIds = Object.keys(this.activeExecutions);
        while (executionIds.length !== 0) {
            if (count++ % 4 === 0) {
                this.logger.info(`Waiting for ${executionIds.length} active executions to finish...`);
            }
            await (0, sleep_1.sleep)(500);
            if (isWorker) {
                for (const [executionId, { isQueueJob }] of Object.entries(this.activeExecutions)) {
                    if (isQueueJob)
                        delete this.activeExecutions[executionId];
                }
            }
            executionIds = Object.keys(this.activeExecutions);
        }
    }
    getExecutionOrFail(executionId) {
        const execution = this.activeExecutions[executionId];
        if (!execution) {
            throw new execution_not_found_error_1.ExecutionNotFoundError(executionId);
        }
        return execution;
    }
};
exports.ActiveExecutions = ActiveExecutions;
exports.ActiveExecutions = ActiveExecutions = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.ExecutionRepository, execution_persistence_1.ExecutionPersistence, concurrency_control_service_1.ConcurrencyControlService, backend_services_1.EventService, config_1.ExecutionsConfig, n8n_core_1.InstanceSettings])
], ActiveExecutions);
//# sourceMappingURL=active-executions.js.map