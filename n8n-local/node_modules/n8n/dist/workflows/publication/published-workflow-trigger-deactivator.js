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
exports.PublishedWorkflowTriggerDeactivator = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const workflow_publication_lifecycle_lock_1 = require("../../workflows/publication/workflow-publication-lifecycle-lock");
const workflow_publication_outbox_consumer_1 = require("../../workflows/publication/workflow-publication-outbox-consumer");
const STUCK_LOCK_WARN_AFTER_PASSES = 3;
let PublishedWorkflowTriggerDeactivator = class PublishedWorkflowTriggerDeactivator {
    constructor(logger, workflowsConfig, errorReporter, lifecycleLock, activeWorkflowTriggers, outboxConsumer, instanceSettings, eventService) {
        this.logger = logger;
        this.workflowsConfig = workflowsConfig;
        this.errorReporter = errorReporter;
        this.lifecycleLock = lifecycleLock;
        this.activeWorkflowTriggers = activeWorkflowTriggers;
        this.outboxConsumer = outboxConsumer;
        this.instanceSettings = instanceSettings;
        this.eventService = eventService;
        this.isShuttingDown = false;
        this.consecutiveLockSkipsByWorkflowId = new Map();
        this.logger = this.logger.scoped('workflow-publication');
    }
    get leaseMs() {
        return this.workflowsConfig.publicationOutboxLeaseSeconds * constants_1.Time.seconds.toMilliseconds;
    }
    async deactivateAllNonWebhookTriggers() {
        if (!this.workflowsConfig.useWorkflowPublicationService)
            return;
        this.outboxConsumer.stopPolling();
        const workflowIds = this.activeWorkflowTriggers.getNonWebhookTriggerWorkflowIds();
        await this.deactivateWorkflows(workflowIds);
    }
    async sweepGhostTriggers() {
        if (this.instanceSettings.isLeader)
            return 0;
        const ghosts = [];
        try {
            const workflowIds = this.activeWorkflowTriggers.getNonWebhookTriggerWorkflowIds();
            ghosts.push(...(await this.deactivateWorkflows(workflowIds)));
            if (ghosts.length > 0) {
                this.logger.warn(`Found ${ghosts.length} ghost workflows. Removed them.`, {
                    workflowIds: ghosts,
                });
                this.eventService.emit('workflow-publication-ghost-trigger-sweep', {
                    removedCount: ghosts.length,
                });
            }
        }
        catch (error) {
            this.errorReporter.error(error, { shouldBeLogged: true });
        }
        return ghosts.length;
    }
    trackSkippedWhileLocked(workflowId) {
        const skips = (this.consecutiveLockSkipsByWorkflowId.get(workflowId) ?? 0) + 1;
        if (skips === STUCK_LOCK_WARN_AFTER_PASSES) {
            this.logger.warn(`Lifecycle lock for workflow "${workflowId}" still held after ${skips} teardown passes; its triggers cannot be torn down until the holder releases the lock`, { workflowId, passes: skips });
        }
        this.consecutiveLockSkipsByWorkflowId.set(workflowId, skips);
    }
    async deactivateWorkflows(workflowIds) {
        const deactivatedWorkflows = [];
        for (const workflowId of workflowIds) {
            try {
                if (this.lifecycleLock.isLocked(workflowId)) {
                    this.trackSkippedWhileLocked(workflowId);
                    continue;
                }
                this.consecutiveLockSkipsByWorkflowId.delete(workflowId);
                const result = await this.lifecycleLock.runExclusive({
                    workflowId,
                    fn: async () => {
                        if (this.instanceSettings.isLeader && !this.isShuttingDown)
                            return false;
                        return await this.activeWorkflowTriggers.remove(workflowId);
                    },
                    signal: AbortSignal.timeout(this.leaseMs),
                });
                if (result) {
                    deactivatedWorkflows.push(workflowId);
                }
            }
            catch (error) {
                this.errorReporter.error(error, { shouldBeLogged: true });
            }
        }
        return deactivatedWorkflows;
    }
    shutdown() {
        this.isShuttingDown = true;
    }
};
exports.PublishedWorkflowTriggerDeactivator = PublishedWorkflowTriggerDeactivator;
__decorate([
    (0, decorators_1.OnLeaderStepdown)(),
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublishedWorkflowTriggerDeactivator.prototype, "deactivateAllNonWebhookTriggers", null);
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublishedWorkflowTriggerDeactivator.prototype, "shutdown", null);
exports.PublishedWorkflowTriggerDeactivator = PublishedWorkflowTriggerDeactivator = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.WorkflowsConfig, n8n_core_1.ErrorReporter, workflow_publication_lifecycle_lock_1.WorkflowPublicationLifecycleLock, n8n_core_1.ActiveWorkflowTriggers, workflow_publication_outbox_consumer_1.WorkflowPublicationOutboxConsumer, n8n_core_1.InstanceSettings, backend_services_1.EventService])
], PublishedWorkflowTriggerDeactivator);
//# sourceMappingURL=published-workflow-trigger-deactivator.js.map