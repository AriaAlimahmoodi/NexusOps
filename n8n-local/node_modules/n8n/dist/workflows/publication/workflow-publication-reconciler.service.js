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
exports.WorkflowPublicationReconciler = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const non_webhook_trigger_registrar_1 = require("../../workflows/triggers/non-webhook-trigger-registrar");
const published_workflow_trigger_deactivator_1 = require("./published-workflow-trigger-deactivator");
const workflow_publication_lifecycle_lock_1 = require("./workflow-publication-lifecycle-lock");
const workflow_publication_outbox_consumer_1 = require("./workflow-publication-outbox-consumer");
let WorkflowPublicationReconciler = class WorkflowPublicationReconciler {
    constructor(logger, workflowsConfig, triggerStatusRepository, outboxRepository, nonWebhookTriggerRegistrar, outboxConsumer, instanceSettings, errorReporter, tracing, eventService, lifecycleLock, workflowRepository, activeWorkflowTriggers, publishedWorkflowTriggerDeactivator) {
        this.workflowsConfig = workflowsConfig;
        this.triggerStatusRepository = triggerStatusRepository;
        this.outboxRepository = outboxRepository;
        this.nonWebhookTriggerRegistrar = nonWebhookTriggerRegistrar;
        this.outboxConsumer = outboxConsumer;
        this.instanceSettings = instanceSettings;
        this.errorReporter = errorReporter;
        this.tracing = tracing;
        this.eventService = eventService;
        this.lifecycleLock = lifecycleLock;
        this.workflowRepository = workflowRepository;
        this.activeWorkflowTriggers = activeWorkflowTriggers;
        this.publishedWorkflowTriggerDeactivator = publishedWorkflowTriggerDeactivator;
        this.isShuttingDown = false;
        this.logger = logger.scoped('workflow-publication');
    }
    init() {
        this.startReconciler();
        if (this.reconcileInterval)
            void this.reconcile(db_1.WorkflowPublicationReason.Startup);
    }
    startReconciler() {
        if (!this.workflowsConfig.useWorkflowPublicationService)
            return;
        if (this.isShuttingDown || this.reconcileInterval)
            return;
        const intervalSeconds = this.workflowsConfig.publicationReconcileIntervalSeconds;
        this.reconcileInterval = setInterval(async () => await this.reconcile(db_1.WorkflowPublicationReason.Reconcile), intervalSeconds * constants_1.Time.seconds.toMilliseconds);
        this.logger.debug(`Trigger reconciliation scheduled every ${intervalSeconds}s`);
    }
    shutdown() {
        this.isShuttingDown = true;
        clearInterval(this.reconcileInterval);
        this.reconcileInterval = undefined;
    }
    get leaseMs() {
        return this.workflowsConfig.publicationOutboxLeaseSeconds * constants_1.Time.seconds.toMilliseconds;
    }
    async reconcile(reason) {
        if (this.isShuttingDown)
            return;
        if (!this.instanceSettings.isLeader) {
            await this.publishedWorkflowTriggerDeactivator.sweepGhostTriggers();
            return;
        }
        await this.tracing.startSpan({ name: 'Publication trigger reconciliation', op: 'publication.reconcile' }, async (span) => {
            const startedAt = Date.now();
            try {
                const surplus = await this.removeGhostTriggers(await this.findSurplusWorkflowIds());
                const missing = await this.republishWorkflows(await this.findMissingActiveWorkflows(), 'Re-publishing workflows with missing in-memory triggers', reason);
                const versionSkew = await this.republishWorkflows(await this.outboxRepository.findVersionSkewedWorkflowIds(), 'Re-enqueuing workflows whose published version diverged from the active version', reason);
                const statusDrift = await this.republishWorkflows(await this.outboxRepository.findTriggerStatusDriftedWorkflowIds(), 'Re-enqueuing workflows whose trigger-status rows lag the active version', reason);
                const unreported = await this.republishWorkflows(await this.outboxRepository.findUnreportedPublishedWorkflowIds(), 'Re-enqueuing published workflows that no publication reported trigger statuses for', reason);
                span.setAttribute('n8n.publication.deficient_workflows', missing);
                span.setAttribute('n8n.publication.surplus_workflows', surplus);
                span.setAttribute('n8n.publication.version_skewed_workflows', versionSkew);
                span.setAttribute('n8n.publication.status_drifted_workflows', statusDrift);
                span.setAttribute('n8n.publication.unreported_workflows', unreported);
                span.setStatus({ code: 1 });
                this.eventService.emit('workflow-publication-reconciliation', {
                    result: 'success',
                    deficientCount: missing,
                    surplusCount: surplus,
                    versionSkewCount: versionSkew,
                    statusDriftCount: statusDrift,
                    unreportedCount: unreported,
                    durationMs: Date.now() - startedAt,
                });
            }
            catch (error) {
                span.setStatus({ code: 2 });
                this.errorReporter.error(error, { shouldBeLogged: true });
                this.eventService.emit('workflow-publication-reconciliation', {
                    result: 'failure',
                    deficientCount: 0,
                    surplusCount: 0,
                    versionSkewCount: 0,
                    statusDriftCount: 0,
                    unreportedCount: 0,
                    durationMs: Date.now() - startedAt,
                });
            }
        });
    }
    async reconcileOnLeaderTakeover() {
        if (!this.reconcileInterval)
            return;
        await this.reconcile(db_1.WorkflowPublicationReason.LeadershipTakeover);
    }
    async findSurplusWorkflowIds() {
        const registered = this.activeWorkflowTriggers.getNonWebhookTriggerWorkflowIds();
        if (registered.length === 0)
            return [];
        const desired = new Set(await this.workflowRepository.getActiveIds());
        const candidates = registered.filter((workflowId) => !desired.has(workflowId));
        return candidates;
    }
    async removeGhostTriggers(workflowIds) {
        let surplusRepairs = 0;
        for (const workflowId of workflowIds) {
            if (this.lifecycleLock.isLocked(workflowId)) {
                this.logger.debug('Skipped ghost trigger teardown: workflow publication lock is held', {
                    workflowId,
                });
                continue;
            }
            try {
                await this.lifecycleLock.runExclusive({
                    workflowId,
                    fn: async () => {
                        const workflow = await this.workflowRepository.findOneBy({ id: workflowId });
                        if (workflow?.activeVersionId)
                            return;
                        if (await this.outboxRepository.findInFlightByWorkflowId(workflowId))
                            return;
                        await this.activeWorkflowTriggers.remove(workflowId);
                        surplusRepairs++;
                    },
                    signal: AbortSignal.timeout(this.leaseMs),
                });
            }
            catch (error) {
                this.errorReporter.error(error, { shouldBeLogged: true });
            }
        }
        return surplusRepairs;
    }
    async findMissingActiveWorkflows() {
        const desiredByWorkflow = this.groupByWorkflow(await this.triggerStatusRepository.findActivatedInMemoryTriggers());
        const missing = [];
        for (const [workflowId, desiredNodeIds] of desiredByWorkflow) {
            const registered = this.nonWebhookTriggerRegistrar.getRegisteredTriggerNodeIds(workflowId);
            const hasMissing = [...desiredNodeIds].some((nodeId) => !registered.has(nodeId));
            if (hasMissing)
                missing.push(workflowId);
        }
        return missing;
    }
    async republishWorkflows(workflowIds, logMessage, reason) {
        if (workflowIds.length > 0) {
            this.logger.debug(logMessage, { workflowIds });
            await this.outboxRepository.enqueueByWorkflowIds(workflowIds, reason);
            this.outboxConsumer.startPolling();
            await this.outboxConsumer.drainPending();
        }
        return workflowIds.length;
    }
    groupByWorkflow(rows) {
        const byWorkflow = new Map();
        for (const { workflowId, nodeId } of rows) {
            const nodeIds = byWorkflow.get(workflowId) ?? new Set();
            nodeIds.add(nodeId);
            byWorkflow.set(workflowId, nodeIds);
        }
        return byWorkflow;
    }
};
exports.WorkflowPublicationReconciler = WorkflowPublicationReconciler;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorkflowPublicationReconciler.prototype, "shutdown", null);
__decorate([
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkflowPublicationReconciler.prototype, "reconcileOnLeaderTakeover", null);
exports.WorkflowPublicationReconciler = WorkflowPublicationReconciler = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.WorkflowsConfig, db_1.WorkflowPublicationTriggerStatusRepository, db_1.WorkflowPublicationOutboxRepository, non_webhook_trigger_registrar_1.NonWebhookTriggerRegistrar, workflow_publication_outbox_consumer_1.WorkflowPublicationOutboxConsumer, n8n_core_1.InstanceSettings, n8n_core_1.ErrorReporter, n8n_core_1.Tracing, backend_services_1.EventService, workflow_publication_lifecycle_lock_1.WorkflowPublicationLifecycleLock, db_1.WorkflowRepository, n8n_core_1.ActiveWorkflowTriggers, published_workflow_trigger_deactivator_1.PublishedWorkflowTriggerDeactivator])
], WorkflowPublicationReconciler);
//# sourceMappingURL=workflow-publication-reconciler.service.js.map