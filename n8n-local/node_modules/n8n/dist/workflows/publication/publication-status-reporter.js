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
exports.PublicationStatusReporter = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const activation_errors_service_1 = require("../../activation-errors.service");
const policy_violation_error_1 = require("../../policy/policy-violation.error");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const format_node_failures_1 = require("../../workflows/publication/format-node-failures");
const workflow_push_notifier_service_1 = require("../../workflows/workflow-push-notifier.service");
const SKIP_LOG_MESSAGE = {
    'workflow-not-found': 'Workflow not found',
    'node-ids-healed': 'Version was healed and republished; its own record applies it',
    superseded: 'Version was superseded by a concurrent publication',
};
let PublicationStatusReporter = class PublicationStatusReporter {
    constructor(logger, errorReporter, outboxRepository, retryStateRepository, transactionRunner, activationErrorsService, publisher, triggerStatusRepository, workflowPushNotifier) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.outboxRepository = outboxRepository;
        this.retryStateRepository = retryStateRepository;
        this.transactionRunner = transactionRunner;
        this.activationErrorsService = activationErrorsService;
        this.publisher = publisher;
        this.triggerStatusRepository = triggerStatusRepository;
        this.workflowPushNotifier = workflowPushNotifier;
        this.logger = this.logger.scoped('workflow-publication');
    }
    async report(record, result) {
        switch (result.type) {
            case 'completed': {
                const warningMessage = this.surfaceTeardownFailures(result.teardownFailures);
                await this.complete(record, this.toRows(record, result.triggerStatuses), warningMessage);
                await this.pushStatus({
                    type: 'workflowActivated',
                    data: { workflowId: record.workflowId, activeVersionId: record.publishedVersionId },
                });
                return;
            }
            case 'unpublished': {
                const warningMessage = this.surfaceTeardownFailures(result.teardownFailures);
                await this.complete(record, [], warningMessage);
                await this.pushStatus({
                    type: 'workflowDeactivated',
                    data: { workflowId: record.workflowId },
                });
                return;
            }
            case 'skipped': {
                this.logSkip(record, result.reason);
                await this.complete(record);
                return;
            }
            case 'version-missing': {
                const errorMessage = 'Published version not found';
                this.logger.warn('Published version not found, marking outbox record as failed', {
                    workflowId: record.workflowId,
                    publishedVersionId: record.publishedVersionId,
                    outboxId: record.id,
                });
                await this.transactionRunner.run({}, async (ctx) => {
                    await this.retryStateRepository.suppressRetry(record.workflowId, record.publishedVersionId, ctx);
                    await this.outboxRepository.markFailed(record.id, errorMessage, ctx);
                });
                await this.pushFailedToActivate(record.workflowId, errorMessage);
                return;
            }
            case 'failed': {
                this.surfaceTeardownFailures(result.teardownFailures);
                const { triggerStatuses } = result;
                await this.transactionRunner.run({}, async (ctx) => {
                    if (triggerStatuses) {
                        await this.triggerStatusRepository.replaceForWorkflow(record.workflowId, this.toRows(record, triggerStatuses), ctx);
                    }
                    await this.retryStateRepository.suppressRetry(record.workflowId, record.publishedVersionId, ctx);
                    await this.outboxRepository.markFailed(record.id, result.error.message, ctx);
                });
                const policyRefusal = (0, policy_violation_error_1.isPolicyRefusal)(result.error);
                if (!policyRefusal) {
                    this.errorReporter.error(result.error, { shouldBeLogged: true });
                }
                const failedTriggers = (triggerStatuses ?? []).filter((s) => s.status === 'failed');
                const nodeId = !policyRefusal && failedTriggers.length === 1 ? failedTriggers[0].nodeId : undefined;
                await this.pushFailedToActivate(record.workflowId, result.error.message, nodeId);
                return;
            }
            case 'partial': {
                this.surfaceTeardownFailures(result.teardownFailures);
                await this.reportPartial(record, result.triggerStatuses);
                return;
            }
        }
    }
    async reportPartial(record, triggerStatuses) {
        const failures = triggerStatuses.filter((s) => s.status === 'failed');
        const errorMessage = this.formatPartialActivationError(failures);
        this.logger.warn('Workflow partially published; some triggers failed to activate', {
            workflowId: record.workflowId,
            outboxId: record.id,
            failedNodeIds: failures.map((s) => s.nodeId),
        });
        await this.transactionRunner.run({}, async (ctx) => {
            await this.triggerStatusRepository.replaceForWorkflow(record.workflowId, this.toRows(record, triggerStatuses), ctx);
            await this.retryStateRepository.clearRetrySuppression(record.workflowId, ctx);
            await this.outboxRepository.markPartialSuccess(record.id, errorMessage, ctx);
        });
        await this.pushStatus({
            type: 'workflowPartiallyActivated',
            data: {
                workflowId: record.workflowId,
                activeVersionId: record.publishedVersionId,
                errorMessage,
                failedNodes: failures.map((triggerStatus) => ({
                    nodeId: triggerStatus.nodeId,
                    nodeName: triggerStatus.nodeName,
                    errorMessage: triggerStatus.errorMessage,
                })),
            },
        });
    }
    toRows(record, statuses) {
        return statuses.map((triggerStatus) => ({
            nodeId: triggerStatus.nodeId,
            versionId: record.publishedVersionId,
            status: triggerStatus.status,
            triggerKind: triggerStatus.triggerKind,
            errorMessage: triggerStatus.status === 'failed' ? triggerStatus.errorMessage : null,
        }));
    }
    formatPartialActivationError(failures) {
        const detail = (0, format_node_failures_1.formatNodeFailures)(failures.map(({ nodeName, errorMessage }) => ({ nodeName, message: errorMessage })));
        return `Some triggers failed to activate: ${detail}`;
    }
    async pushFailedToActivate(workflowId, errorMessage, nodeId) {
        await this.pushStatus({
            type: 'workflowFailedToActivate',
            data: { workflowId, errorMessage, nodeId },
        });
    }
    async pushStatus(pushMsg) {
        void this.publisher
            .publishCommand({ command: 'display-workflow-publication-status', payload: pushMsg })
            .catch((error) => this.errorReporter.error(error, { shouldBeLogged: true }));
        await this.workflowPushNotifier.notify(pushMsg.data.workflowId, pushMsg);
    }
    async handleDisplayWorkflowPublicationStatus(pushMsg) {
        await this.workflowPushNotifier.notify(pushMsg.data.workflowId, pushMsg);
    }
    surfaceTeardownFailures(teardownFailures) {
        if (!teardownFailures?.length)
            return undefined;
        const detail = (0, format_node_failures_1.formatNodeFailures)(teardownFailures.map(({ nodeName, error }) => ({ nodeName, message: error.message })));
        const message = `External webhook deregistration failed for: ${detail}`;
        this.errorReporter.error(new n8n_workflow_1.OperationalError(message, { level: 'error', cause: teardownFailures[0].error }), { shouldBeLogged: true });
        return message;
    }
    async complete(record, triggerStatuses, warningMessage) {
        await this.transactionRunner.run({}, async (ctx) => {
            if (triggerStatuses !== undefined) {
                await this.triggerStatusRepository.replaceForWorkflow(record.workflowId, triggerStatuses, ctx);
            }
            await this.retryStateRepository.clearRetrySuppression(record.workflowId, ctx);
            await this.outboxRepository.markCompleted(record.id, ctx, warningMessage);
        });
        await this.activationErrorsService.deregister(record.workflowId);
    }
    logSkip(record, reason) {
        const context = { workflowId: record.workflowId, outboxId: record.id };
        this.logger.warn(`${SKIP_LOG_MESSAGE[reason]}, marking outbox record as completed`, context);
    }
};
exports.PublicationStatusReporter = PublicationStatusReporter;
__decorate([
    (0, decorators_1.OnPubSubEvent)('display-workflow-publication-status', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicationStatusReporter.prototype, "handleDisplayWorkflowPublicationStatus", null);
exports.PublicationStatusReporter = PublicationStatusReporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, db_1.WorkflowPublicationOutboxRepository, db_1.WorkflowPublicationRetryStateRepository, db_1.TransactionRunner, activation_errors_service_1.ActivationErrorsService, publisher_service_1.Publisher, db_1.WorkflowPublicationTriggerStatusRepository, workflow_push_notifier_service_1.WorkflowPushNotifier])
], PublicationStatusReporter);
//# sourceMappingURL=publication-status-reporter.js.map