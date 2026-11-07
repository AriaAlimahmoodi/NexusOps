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
exports.WorkflowPublicationOutboxConsumer = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const publication_status_reporter_1 = require("../../workflows/publication/publication-status-reporter");
const workflow_publication_lifecycle_lock_1 = require("../../workflows/publication/workflow-publication-lifecycle-lock");
const workflow_publication_applier_1 = require("../../workflows/publication/workflow-publication-applier");
const workflow_publication_outbox_worker_pool_1 = require("../../workflows/publication/workflow-publication-outbox-worker-pool");
const TIMED_OUT = Symbol('timed-out');
const ABORT_AFTER_LEASE_FRACTION = 0.7;
const ABANDON_GRACE_MS = 10 * constants_1.Time.seconds.toMilliseconds;
const ABANDON_GRACE_LEASE_FRACTION = 0.25;
let WorkflowPublicationOutboxConsumer = class WorkflowPublicationOutboxConsumer {
    constructor(logger, workflowsConfig, errorReporter, outboxRepository, applier, reporter, instanceSettings, lifecycleLock, tracing, eventService) {
        this.logger = logger;
        this.workflowsConfig = workflowsConfig;
        this.errorReporter = errorReporter;
        this.outboxRepository = outboxRepository;
        this.applier = applier;
        this.reporter = reporter;
        this.instanceSettings = instanceSettings;
        this.lifecycleLock = lifecycleLock;
        this.tracing = tracing;
        this.eventService = eventService;
        this.isPolling = false;
        this.isShuttingDown = false;
        this.logger = this.logger.scoped('workflow-publication');
        this.pool = new workflow_publication_outbox_worker_pool_1.WorkflowPublicationOutboxWorkerPool({
            runPass: async () => await this.runWorkerPass(),
            shouldRun: () => this.shouldKeepPolling(),
            concurrency: this.workflowsConfig.workflowPublicationConcurrency,
            onWorkerError: (error) => this.errorReporter.error(error, { shouldBeLogged: true }),
        });
    }
    async init() {
        if (!this.instanceSettings.isLeader)
            return;
        this.startPolling();
        await this.drainPending();
    }
    startPolling() {
        if (!this.workflowsConfig.useWorkflowPublicationService || this.isShuttingDown)
            return;
        if (this.isPolling)
            return;
        this.isPolling = true;
        this.schedulePollCycle();
        this.logger.debug('Started outbox polling');
    }
    stopPolling() {
        this.isPolling = false;
        if (this.pollTimeout) {
            clearTimeout(this.pollTimeout);
            this.pollTimeout = undefined;
            this.logger.debug('Stopped outbox polling');
        }
    }
    async shutdown() {
        this.isShuttingDown = true;
        this.stopPolling();
        await this.pool.awaitIdle();
    }
    async wakeUp() {
        if (!this.workflowsConfig.useWorkflowPublicationService)
            return;
        if (!this.instanceSettings.isLeader)
            return;
        this.startPolling();
        try {
            await this.drainPending();
        }
        catch (error) {
            this.logger.debug('Publication outbox drain triggered by a wake-up failed', {
                error: (0, ensure_error_1.ensureError)(error).message,
            });
        }
    }
    schedulePollCycle() {
        clearTimeout(this.pollTimeout);
        if (!this.shouldKeepPolling())
            return;
        this.pollTimeout = setTimeout(() => {
            this.pool.topUp();
            if (this.shouldKeepPolling())
                this.schedulePollCycle();
        }, this.workflowsConfig.publicationOutboxPollIntervalMs);
    }
    async drainPending() {
        this.pool.topUp();
        const error = await this.pool.awaitIdle();
        if (error) {
            throw new n8n_workflow_1.OperationalError('Workflow publication outbox drain failed', {
                cause: error,
                level: 'warning',
            });
        }
    }
    async runWorkerPass() {
        if (!this.shouldKeepPolling())
            return;
        const first = await this.outboxRepository.claimNextPendingRecord();
        if (!first)
            return;
        await this.tracing.startSpan({
            name: 'Publication outbox drain',
            op: 'publication.outbox.drain',
            attributes: {
                'n8n.publication.consumer_concurrency': this.workflowsConfig.workflowPublicationConcurrency,
            },
        }, async (span) => {
            let processed = 0;
            let record = first;
            while (record) {
                if (await this.processRecordWithAbort(record))
                    processed++;
                record = this.shouldKeepPolling()
                    ? await this.outboxRepository.claimNextPendingRecord()
                    : null;
            }
            if (processed > 1) {
                this.logger.debug(`Processed ${processed} workflow publication outbox records in this pass`);
            }
            span.setAttribute('n8n.publication.records_processed', processed);
            span.setStatus({ code: 1 });
        });
    }
    shouldKeepPolling() {
        return this.isPolling && !this.isShuttingDown;
    }
    async processRecordWithAbort(record) {
        const { leaseMs } = this;
        const abortAfterMs = leaseMs * ABORT_AFTER_LEASE_FRACTION;
        const abandonGraceMs = Math.min(ABANDON_GRACE_MS, leaseMs * ABANDON_GRACE_LEASE_FRACTION);
        const controller = new AbortController();
        const work = this.processRecord(record, controller.signal);
        if ((await this.raceTimeout(work, abortAfterMs)) !== TIMED_OUT)
            return true;
        controller.abort(new n8n_workflow_1.OperationalError('Workflow publication processing exceeded its deadline'));
        if ((await this.raceTimeout(work, abandonGraceMs)) !== TIMED_OUT)
            return true;
        void work.catch((error) => this.errorReporter.error((0, ensure_error_1.ensureError)(error), { shouldBeLogged: true }));
        this.errorReporter.error(new n8n_workflow_1.OperationalError('Abandoned workflow publication outbox record: processing did not stop after abort', { extra: { outboxId: record.id, workflowId: record.workflowId } }), { shouldBeLogged: true });
        return false;
    }
    async raceTimeout(promise, timeoutMs) {
        let timer;
        try {
            return await Promise.race([
                promise,
                new Promise((resolve) => {
                    timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
                }),
            ]);
        }
        finally {
            clearTimeout(timer);
        }
    }
    async processRecord(record, signal) {
        await this.tracing.startSpan({
            name: 'Publication outbox record',
            op: 'publication.outbox.process_record',
            attributes: {
                ...this.tracing.pickWorkflowAttributes({ id: record.workflowId }),
                'n8n.publication.outbox_id': record.id,
                'n8n.publication.published_version_id': record.publishedVersionId,
            },
        }, async (span) => {
            const startedAt = Date.now();
            let entered = false;
            const process = async () => {
                entered = true;
                if (!this.instanceSettings.isLeader) {
                    await this.outboxRepository.returnToPending(record.id);
                    this.logger.debug('Returned publication outbox record to queue: no longer leader', {
                        outboxId: record.id,
                        workflowId: record.workflowId,
                    });
                    return;
                }
                let result;
                const detachedWork = [];
                if (signal.aborted) {
                    this.logger.warn('Failing publication outbox record: aborted before applying', {
                        outboxId: record.id,
                        workflowId: record.workflowId,
                    });
                    result = {
                        type: 'failed',
                        error: new n8n_workflow_1.OperationalError('Workflow publication timed out waiting for a previous publication of this workflow to finish', { cause: (0, ensure_error_1.ensureError)(signal.reason) }),
                    };
                }
                else {
                    this.logger.debug('Started processing workflow publication outbox record', {
                        outboxId: record.id,
                        workflowId: record.workflowId,
                        publishedVersionId: record.publishedVersionId,
                    });
                    const abort = {
                        signal,
                        onDetached: (work) => detachedWork.push(work),
                    };
                    try {
                        result = await this.applier.apply(record, abort);
                    }
                    catch (error) {
                        const cause = (0, ensure_error_1.ensureError)(error);
                        result = {
                            type: 'failed',
                            error: signal.aborted || cause instanceof n8n_workflow_1.UserError
                                ? cause
                                : new n8n_workflow_1.UnexpectedError(`Unexpected: ${cause.message}`, { cause }),
                        };
                    }
                }
                let reporterFailed = false;
                try {
                    await this.reporter.report(record, result);
                }
                catch (reportError) {
                    reporterFailed = true;
                    this.errorReporter.error(reportError, { shouldBeLogged: true });
                }
                this.eventService.emit('workflow-publication-outbox-record-processed', {
                    ...this.toOutcomeLabels(result, reporterFailed),
                    durationMs: Date.now() - startedAt,
                });
                this.logger.debug('Finished processing workflow publication outbox record', {
                    outboxId: record.id,
                    workflowId: record.workflowId,
                    result: result.type,
                });
                span.setAttribute('n8n.publication.result', result.type);
                if (detachedWork.length > 0) {
                    this.logger.warn('Keeping workflow publication lock held until abandoned trigger operations settle', { outboxId: record.id, workflowId: record.workflowId });
                    await this.awaitDetachedWork(record, detachedWork);
                }
            };
            try {
                await this.lifecycleLock.runExclusive({
                    workflowId: record.workflowId,
                    fn: process,
                    signal,
                });
            }
            catch (error) {
                if (entered || !signal.aborted)
                    throw error;
                await process();
            }
            span.setStatus({ code: 1 });
        });
    }
    async awaitDetachedWork(record, detachedWork) {
        const settled = await this.raceTimeout(Promise.allSettled(detachedWork), this.leaseMs);
        if (settled !== TIMED_OUT)
            return;
        this.errorReporter.error(new n8n_workflow_1.OperationalError('Released workflow publication lock with abandoned trigger operations still pending', {
            level: 'error',
            extra: {
                outboxId: record.id,
                workflowId: record.workflowId,
                pendingOperations: detachedWork.length,
            },
        }), { shouldBeLogged: true });
    }
    get leaseMs() {
        return this.workflowsConfig.publicationOutboxLeaseSeconds * constants_1.Time.seconds.toMilliseconds;
    }
    toOutcomeLabels(result, reporterFailed) {
        if (reporterFailed)
            return { result: 'failed', reason: 'none' };
        switch (result.type) {
            case 'completed':
                return { result: 'published', reason: 'none' };
            case 'unpublished':
                return { result: 'unpublished', reason: 'none' };
            case 'skipped':
                return {
                    result: 'skipped',
                    reason: 'workflow_not_found',
                };
            case 'version-missing':
                return { result: 'failed', reason: 'version_missing' };
            case 'partial':
                return { result: 'partial_success', reason: 'none' };
            case 'failed':
                return { result: 'failed', reason: 'none' };
        }
    }
};
exports.WorkflowPublicationOutboxConsumer = WorkflowPublicationOutboxConsumer;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkflowPublicationOutboxConsumer.prototype, "shutdown", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('workflow-publish-wake-up', { instanceType: 'main', instanceRole: 'leader' }),
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkflowPublicationOutboxConsumer.prototype, "wakeUp", null);
exports.WorkflowPublicationOutboxConsumer = WorkflowPublicationOutboxConsumer = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.WorkflowsConfig, n8n_core_1.ErrorReporter, db_1.WorkflowPublicationOutboxRepository, workflow_publication_applier_1.WorkflowPublicationApplier, publication_status_reporter_1.PublicationStatusReporter, n8n_core_1.InstanceSettings, workflow_publication_lifecycle_lock_1.WorkflowPublicationLifecycleLock, n8n_core_1.Tracing, backend_services_1.EventService])
], WorkflowPublicationOutboxConsumer);
//# sourceMappingURL=workflow-publication-outbox-consumer.js.map