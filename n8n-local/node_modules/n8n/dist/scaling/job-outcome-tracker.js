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
exports.JobOutcomeTracker = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const active_executions_1 = require("../active-executions");
const constants_1 = require("./constants");
const toJobKey = (queueName, jobId) => `${queueName}:${jobId.toString()}`;
const IN_FLIGHT_STATUSES = new Set(['new', 'running', 'unknown']);
const SUCCEEDED_STATUSES = new Set(['success', 'waiting', 'deleted']);
const FAILED_RESPONSE = {
    body: { message: 'Workflow execution failed' },
    statusCode: 500,
};
let JobOutcomeTracker = class JobOutcomeTracker {
    constructor(logger, activeExecutions, executionRepository, eventService) {
        this.logger = logger;
        this.activeExecutions = activeExecutions;
        this.executionRepository = executionRepository;
        this.eventService = eventService;
        this.results = new Map();
        this.failures = new Map();
        this.pendingWaits = new Map();
        this.logger = this.logger.scoped('scaling');
    }
    getDiagnosticCounts() {
        return { jobResults: this.results.size };
    }
    recordFinished(queueName, jobId, executionId, result) {
        const jobKey = toJobKey(queueName, jobId);
        if (result && this.acceptsReport(jobKey, executionId)) {
            this.results.set(jobKey, { executionId, result });
        }
        this.settle(jobKey, { succeeded: result?.success ?? true });
    }
    recordFailed(queueName, jobId, executionId, error) {
        const jobKey = toJobKey(queueName, jobId);
        const settled = this.settle(jobKey, { error, succeeded: false });
        if (settled)
            return;
        if (this.acceptsReport(jobKey, executionId))
            this.failures.set(jobKey, { executionId, error });
    }
    acceptsReport(jobKey, executionId) {
        if (!this.activeExecutions.has(executionId))
            return false;
        if (this.pendingWaits.has(jobKey))
            return true;
        return ![...this.pendingWaits.values()].some((wait) => wait.executionId === executionId);
    }
    settleByJobKey(queueName, jobId, error) {
        this.settle(toJobKey(queueName, jobId), { error, succeeded: !error });
    }
    async waitFor(job) {
        const { executionId } = job.data;
        const jobKey = toJobKey(job.queue.name, job.id);
        for (const outcomes of [this.results, this.failures]) {
            for (const [key, outcome] of outcomes) {
                const isOtherSegment = outcome.executionId === executionId && key !== jobKey;
                if (isOtherSegment && !this.pendingWaits.has(key)) {
                    outcomes.delete(key);
                }
            }
        }
        if (this.results.has(jobKey))
            return;
        const earlyFailure = this.failures.get(jobKey);
        if (earlyFailure) {
            this.failures.delete(jobKey);
            throw earlyFailure.error;
        }
        await new Promise((resolve, reject) => {
            this.pendingWaits.set(jobKey, { executionId, resolve, reject });
            this.startRecheckTimer();
        });
    }
    popResult(job) {
        const jobKey = toJobKey(job.queue.name, job.id);
        const result = this.results.get(jobKey);
        this.results.delete(jobKey);
        this.failures.delete(jobKey);
        return result?.result;
    }
    drop(job) {
        return this.dropByJobKey(toJobKey(job.queue.name, job.id));
    }
    dropByJobKey(jobKey) {
        const wait = this.pendingWaits.get(jobKey);
        if (!wait)
            return undefined;
        this.pendingWaits.delete(jobKey);
        if (this.pendingWaits.size === 0)
            this.stopRecheckTimer();
        return wait;
    }
    clear() {
        for (const jobKey of this.pendingWaits.keys())
            this.dropByJobKey(jobKey);
    }
    async recheckAll() {
        if (this.pendingWaits.size === 0)
            return;
        this.recheckInFlight ??= this.recheckPendingWaits().finally(() => {
            this.recheckInFlight = undefined;
        });
        await this.recheckInFlight;
    }
    async recheckPendingWaits() {
        const waits = [...this.pendingWaits];
        const executionIds = [...new Set(waits.map(([, wait]) => wait.executionId))];
        const statusById = await this.readStatuses(executionIds);
        if (!statusById)
            return;
        for (const [jobKey, wait] of waits) {
            const { executionId } = wait;
            const status = statusById.get(executionId);
            if (!status)
                continue;
            if (IN_FLIGHT_STATUSES.has(status))
                continue;
            if (this.pendingWaits.get(jobKey) !== wait)
                continue;
            this.logger.warn(`Execution ${executionId} ended without a completion event, resolving the wait from the DB`, { executionId, status });
            this.eventService.emit('job-completion-missed', { status });
            this.settle(jobKey, { succeeded: SUCCEEDED_STATUSES.has(status) });
        }
    }
    async readStatuses(executionIds) {
        try {
            const rows = await this.executionRepository.findStatusesByIds(executionIds);
            const statusById = new Map(rows.map((row) => [row.id, row.status]));
            for (const executionId of executionIds) {
                if (!statusById.has(executionId))
                    statusById.set(executionId, 'deleted');
            }
            return statusById;
        }
        catch (error) {
            this.logger.warn(`Failed to read the status of ${executionIds.length} executions, next recheck in ${constants_1.JOB_WAIT_RECHECK_INTERVAL_MS / 1000}s`, { executionIds, error });
            return undefined;
        }
    }
    settle(jobKey, outcome) {
        const wait = this.dropByJobKey(jobKey);
        if (!wait)
            return false;
        this.activeExecutions.resolveResponsePromise(wait.executionId, outcome.succeeded ? {} : FAILED_RESPONSE);
        if (outcome.error) {
            wait.reject(outcome.error);
        }
        else {
            wait.resolve();
        }
        return true;
    }
    startRecheckTimer() {
        if (this.recheckTimer)
            return;
        this.recheckTimer = setInterval(() => {
            void this.recheckAll();
        }, constants_1.JOB_WAIT_RECHECK_INTERVAL_MS).unref();
    }
    stopRecheckTimer() {
        if (!this.recheckTimer)
            return;
        clearInterval(this.recheckTimer);
        this.recheckTimer = undefined;
    }
};
exports.JobOutcomeTracker = JobOutcomeTracker;
exports.JobOutcomeTracker = JobOutcomeTracker = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, active_executions_1.ActiveExecutions, db_1.ExecutionRepository, backend_services_1.EventService])
], JobOutcomeTracker);
//# sourceMappingURL=job-outcome-tracker.js.map