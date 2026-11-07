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
exports.ConcurrencyControlService = exports.CLOUD_TEMP_REPORTABLE_THRESHOLDS = exports.CLOUD_TEMP_PRODUCTION_LIMIT = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const invalid_concurrency_limit_error_1 = require("../errors/invalid-concurrency-limit.error");
const unknown_execution_mode_error_1 = require("../errors/unknown-execution-mode.error");
const evaluation_concurrency_helper_1 = require("../evaluation.ee/evaluation-concurrency.helper");
const license_1 = require("../license");
const telemetry_1 = require("../telemetry");
const concurrency_queue_1 = require("./concurrency-queue");
exports.CLOUD_TEMP_PRODUCTION_LIMIT = 999;
exports.CLOUD_TEMP_REPORTABLE_THRESHOLDS = [5, 10, 20, 50, 100, 200];
let ConcurrencyControlService = class ConcurrencyControlService {
    constructor(logger, executionRepository, telemetry, eventService, globalConfig, license) {
        this.logger = logger;
        this.executionRepository = executionRepository;
        this.telemetry = telemetry;
        this.eventService = eventService;
        this.globalConfig = globalConfig;
        this.license = license;
        this.limitsToReport = exports.CLOUD_TEMP_REPORTABLE_THRESHOLDS.map((t) => exports.CLOUD_TEMP_PRODUCTION_LIMIT - t);
        this.evalQueueResolved = false;
        this.logger = this.logger.scoped('concurrency');
        const { productionLimit, evaluationLimit } = this.globalConfig.executions.concurrency;
        const normalisedProduction = this.normaliseLimit(productionLimit);
        const normalisedEvaluation = this.normaliseLimit(evaluationLimit);
        this.limits = new Map([
            ['production', normalisedProduction],
            ['evaluation', normalisedEvaluation],
        ]);
        if (this.globalConfig.executions.mode === 'queue') {
            this.isEnabled = false;
            return;
        }
        this.queues = new Map();
        if (normalisedProduction > 0) {
            const queue = new concurrency_queue_1.ConcurrencyQueue(normalisedProduction);
            this.queues.set('production', queue);
            this.wireQueue(queue, 'production');
        }
        if (normalisedEvaluation > 0) {
            const queue = new concurrency_queue_1.ConcurrencyQueue(normalisedEvaluation);
            this.queues.set('evaluation', queue);
            this.wireQueue(queue, 'evaluation');
            this.evalQueueResolved = true;
        }
        this.isEnabled = this.queues.size > 0;
        this.limits.forEach((limit, type) => {
            if (type === 'evaluation' && !this.evalQueueResolved)
                return;
            this.logger.debug(`${type === 'production' ? 'Production' : 'Evaluation'} execution concurrency is ${limit === -1 ? 'unlimited' : 'limited to ' + limit.toString()}`);
        });
    }
    normaliseLimit(limit) {
        if (limit === 0)
            throw new invalid_concurrency_limit_error_1.InvalidConcurrencyLimitError(0);
        return limit < -1 ? -1 : limit;
    }
    ensureEvalQueueResolved() {
        if (this.evalQueueResolved)
            return;
        this.evalQueueResolved = true;
        if (this.globalConfig.executions.mode === 'queue')
            return;
        const normalised = this.normaliseLimit((0, evaluation_concurrency_helper_1.resolveEvaluationConcurrencyLimit)(this.globalConfig.executions, this.license));
        this.limits.set('evaluation', normalised);
        if (normalised > 0) {
            const queue = new concurrency_queue_1.ConcurrencyQueue(normalised);
            this.queues.set('evaluation', queue);
            this.wireQueue(queue, 'evaluation');
            this.logger.debug(`Evaluation execution concurrency is limited to ${normalised}`);
            this.isEnabled = true;
        }
        else {
            this.logger.debug('Evaluation execution concurrency is unlimited');
        }
    }
    wireQueue(queue, type) {
        queue.on('concurrency-check', ({ capacity }) => {
            if (this.shouldReport(capacity)) {
                this.telemetry.track('User hit concurrency limit', {
                    threshold: exports.CLOUD_TEMP_PRODUCTION_LIMIT - capacity,
                    concurrencyQueue: type,
                });
            }
        });
        queue.on('execution-throttled', ({ executionId }) => {
            this.logger.debug('Execution throttled', { executionId, type });
            this.eventService.emit('execution-throttled', { executionId, type });
        });
        queue.on('execution-released', (executionId) => {
            this.logger.debug('Execution released', { executionId, type });
        });
    }
    has(executionId) {
        if (!this.isEnabled)
            return false;
        for (const queue of this.queues.values()) {
            if (queue.has(executionId)) {
                return true;
            }
        }
        return false;
    }
    async throttle({ mode, executionId }) {
        if (mode === 'evaluation')
            this.ensureEvalQueueResolved();
        if (!this.isEnabled || this.isUnlimited(mode))
            return;
        await this.getQueue(mode)?.enqueue(executionId);
    }
    release({ mode }) {
        if (mode === 'evaluation')
            this.ensureEvalQueueResolved();
        if (!this.isEnabled || this.isUnlimited(mode))
            return;
        this.getQueue(mode)?.dequeue();
    }
    remove({ mode, executionId }) {
        if (mode === 'evaluation')
            this.ensureEvalQueueResolved();
        if (!this.isEnabled || this.isUnlimited(mode))
            return;
        this.getQueue(mode)?.remove(executionId);
    }
    async removeAll(executionIdsToCancel) {
        if (!this.isEnabled)
            return;
        this.queues.forEach((queue) => {
            const enqueuedExecutionIds = queue.getAll();
            for (const id of enqueuedExecutionIds) {
                queue.remove(id);
            }
        });
        if (executionIdsToCancel.length === 0)
            return;
        await this.executionRepository.cancelMany(executionIdsToCancel);
        this.logger.info('Canceled enqueued executions with response promises', {
            executionIds: executionIdsToCancel,
        });
    }
    disable() {
        this.isEnabled = false;
    }
    isUnlimited(mode) {
        return this.getQueue(mode) === undefined;
    }
    shouldReport(capacity) {
        return this.globalConfig.deployment.type === 'cloud' && this.limitsToReport.includes(capacity);
    }
    getQueue(mode) {
        if (mode === 'error' ||
            mode === 'integrated' ||
            mode === 'cli' ||
            mode === 'internal' ||
            mode === 'manual' ||
            mode === 'retry') {
            return undefined;
        }
        if (mode === 'webhook' || mode === 'trigger' || mode === 'chat') {
            return this.queues.get('production');
        }
        if (mode === 'evaluation')
            return this.queues.get('evaluation');
        throw new unknown_execution_mode_error_1.UnknownExecutionModeError(mode);
    }
};
exports.ConcurrencyControlService = ConcurrencyControlService;
exports.ConcurrencyControlService = ConcurrencyControlService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.ExecutionRepository, telemetry_1.Telemetry, backend_services_1.EventService, config_1.GlobalConfig, license_1.License])
], ConcurrencyControlService);
//# sourceMappingURL=concurrency-control.service.js.map