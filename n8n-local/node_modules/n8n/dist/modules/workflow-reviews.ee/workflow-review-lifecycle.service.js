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
exports.WorkflowReviewLifecycleService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const workflow_review_state_notifier_service_1 = require("./workflow-review-state-notifier.service");
const CLOSE_TRIGGER_BY_ACTIVITY_TYPE = {
    'workflow.archived': 'workflow-archived',
    'workflow.moved': 'workflow-moved',
    'workflow.deleted': 'workflow-deleted',
};
const MAX_PENDING_DELETE_CAPTURES = 1000;
let WorkflowReviewLifecycleService = class WorkflowReviewLifecycleService {
    constructor(logger, workflowReviewRequestRepository, workflowReviewLifecycleRepository, workflowReviewRequestWorkflowRepository, activityRepository, dbLockService, stateNotifier, eventService) {
        this.logger = logger;
        this.workflowReviewRequestRepository = workflowReviewRequestRepository;
        this.workflowReviewLifecycleRepository = workflowReviewLifecycleRepository;
        this.workflowReviewRequestWorkflowRepository = workflowReviewRequestWorkflowRepository;
        this.activityRepository = activityRepository;
        this.dbLockService = dbLockService;
        this.stateNotifier = stateNotifier;
        this.eventService = eventService;
        this.pendingDeleteCaptures = new Map();
    }
    async afterWorkflowArchived(workflowId, userId) {
        await this.recordCauseEventsAndApplyClosePolicy([workflowId], 'workflow.archived', userId);
        await this.reconcileUnreviewableOpenRequests([workflowId]);
    }
    async afterWorkflowsTransferred(workflowIds, userId) {
        await this.recordCauseEventsAndApplyClosePolicy(workflowIds, 'workflow.moved', userId);
        await this.reconcileUnreviewableOpenRequests(workflowIds);
    }
    async beforeWorkflowDeleted(workflowId, userId) {
        try {
            const openRequests = await this.workflowReviewLifecycleRepository.findOpenRequestsAffectedByWorkflows([workflowId], {});
            this.pendingDeleteCaptures.delete(workflowId);
            if (this.pendingDeleteCaptures.size >= MAX_PENDING_DELETE_CAPTURES) {
                const oldest = this.pendingDeleteCaptures.keys().next().value;
                if (oldest !== undefined)
                    this.pendingDeleteCaptures.delete(oldest);
            }
            this.pendingDeleteCaptures.set(workflowId, {
                userId,
                requestIds: openRequests.map(({ request }) => request.id),
            });
        }
        catch (error) {
            this.logger.warn('Failed to capture open workflow review request(s) before deletion', {
                workflowId,
                error,
            });
        }
    }
    async afterWorkflowsDeleted(workflowIds) {
        const capturesByRequestId = new Map();
        for (const workflowId of workflowIds) {
            const capture = this.pendingDeleteCaptures.get(workflowId);
            this.pendingDeleteCaptures.delete(workflowId);
            if (!capture)
                continue;
            for (const requestId of capture.requestIds) {
                const grouped = capturesByRequestId.get(requestId) ?? {
                    workflowIds: [],
                    userId: capture.userId,
                };
                grouped.workflowIds.push(workflowId);
                capturesByRequestId.set(requestId, grouped);
            }
        }
        if (capturesByRequestId.size > 0) {
            await this.recordCapturedDeletions(capturesByRequestId, workflowIds);
        }
        await this.reconcileUnreviewableOpenRequests(workflowIds);
    }
    async afterWorkflowPublished(event) {
        try {
            const requestIds = await this.workflowReviewRequestWorkflowRepository.findRequestIdsPinnedToVersion({ workflowId: event.workflowId, workflowVersionId: event.versionId }, {});
            for (const requestId of requestIds) {
                await this.activityRepository.createActivity({
                    workflowReviewRequestId: requestId,
                    type: 'workflow.published',
                    data: { workflowId: event.workflowId, workflowVersionId: event.versionId },
                    createdById: event.userId,
                }, {});
            }
            this.stateNotifier.notify(event.workflowId);
        }
        catch (error) {
            this.logger.warn('Failed to record workflow publication in review activity', {
                workflowId: event.workflowId,
                versionId: event.versionId,
                error,
            });
        }
    }
    async reconcileUnreviewableOpenRequests(workflowIds) {
        try {
            const closedRequestIds = await this.dbLockService.withLockContext(1004, async (ctx) => await this.closeUnreviewable(ctx));
            if (closedRequestIds.length === 0)
                return;
            for (const requestId of closedRequestIds) {
                this.eventService.emit('workflow-review-closed', {
                    workflowReviewRequestId: requestId,
                    cause: { trigger: 'unknown', actorKind: 'system', userId: null },
                });
            }
            this.logger.info('Closed open workflow review request(s) left on unreviewable workflows', {
                workflowIds,
                closedRequestIds,
            });
        }
        catch (error) {
            this.logger.error('Failed to close open workflow review request(s) left on unreviewable workflows', { workflowIds, error });
        }
    }
    async recordCauseEventsAndApplyClosePolicy(workflowIds, type, userId) {
        const actorKind = userId === null ? 'system' : 'user';
        await this.recordCauseEventsAndClose(type, workflowIds, async (ctx) => {
            const openRequests = await this.workflowReviewLifecycleRepository.findOpenRequestsAffectedByWorkflows(workflowIds, ctx);
            const affected = new Set();
            const candidateRequestIds = [];
            for (const { request, links } of openRequests) {
                for (const { workflowId: linkedWorkflowId } of links) {
                    await this.activityRepository.createActivity({
                        workflowReviewRequestId: request.id,
                        type,
                        data: { workflowId: linkedWorkflowId, actorKind },
                        createdById: userId,
                    }, ctx);
                    affected.add(linkedWorkflowId);
                }
                candidateRequestIds.push(request.id);
            }
            const closedRequestIds = await this.closeUnreviewable(ctx, candidateRequestIds);
            return {
                affectedWorkflowIds: [...affected],
                closedRequests: closedRequestIds.map((requestId) => ({ requestId, actorKind, userId })),
            };
        });
    }
    async recordCapturedDeletions(capturesByRequestId, batchWorkflowIds) {
        await this.recordCauseEventsAndClose('workflow.deleted', batchWorkflowIds, async (ctx) => {
            const affected = new Set();
            const candidateRequestIds = [];
            const actorByRequestId = new Map();
            for (const [requestId, capture] of capturesByRequestId) {
                const request = await this.workflowReviewRequestRepository.findById(requestId, ctx);
                if (!request || request.state !== 'open')
                    continue;
                const actorKind = capture.userId === null ? 'system' : 'user';
                for (const workflowId of capture.workflowIds) {
                    await this.activityRepository.createActivity({
                        workflowReviewRequestId: requestId,
                        type: 'workflow.deleted',
                        data: { workflowId, actorKind },
                        createdById: capture.userId,
                    }, ctx);
                    affected.add(workflowId);
                }
                candidateRequestIds.push(requestId);
                actorByRequestId.set(requestId, { requestId, actorKind, userId: capture.userId });
            }
            const closedRequestIds = await this.closeUnreviewable(ctx, candidateRequestIds);
            return {
                affectedWorkflowIds: [...affected],
                closedRequests: closedRequestIds.map((requestId) => actorByRequestId.get(requestId)),
            };
        });
    }
    async recordCauseEventsAndClose(type, logWorkflowIds, gather) {
        try {
            const { affectedWorkflowIds, closedRequests } = await this.dbLockService.withLockContext(1004, gather);
            const trigger = CLOSE_TRIGGER_BY_ACTIVITY_TYPE[type];
            for (const { requestId, actorKind, userId } of closedRequests) {
                this.eventService.emit('workflow-review-closed', {
                    workflowReviewRequestId: requestId,
                    cause: { trigger, actorKind, userId },
                });
            }
            if (affectedWorkflowIds.length === 0)
                return;
            this.logger.info('Recorded workflow review cause event(s)', {
                type,
                workflowIds: affectedWorkflowIds,
            });
            this.stateNotifier.notifyMany(affectedWorkflowIds);
        }
        catch (error) {
            this.logger.error('Failed to record workflow review cause event(s)', {
                type,
                workflowIds: logWorkflowIds,
                error,
            });
        }
    }
    async closeUnreviewable(ctx, candidateRequestIds) {
        const closableRequestIds = await this.workflowReviewLifecycleRepository.findUnreviewableOpenRequestIds(ctx, candidateRequestIds);
        await this.workflowReviewRequestRepository.closeRequests(closableRequestIds, ctx);
        for (const requestId of closableRequestIds) {
            await this.activityRepository.createActivity({
                workflowReviewRequestId: requestId,
                type: 'review.closed',
                data: { reason: 'no-reviewable-workflows' },
                createdById: null,
            }, ctx);
        }
        return closableRequestIds;
    }
};
exports.WorkflowReviewLifecycleService = WorkflowReviewLifecycleService;
exports.WorkflowReviewLifecycleService = WorkflowReviewLifecycleService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.WorkflowReviewRequestRepository, db_1.WorkflowReviewLifecycleRepository, db_1.WorkflowReviewRequestWorkflowRepository, db_1.WorkflowReviewActivityRepository, db_1.DbLockService, workflow_review_state_notifier_service_1.WorkflowReviewStateNotifier, backend_services_1.EventService])
], WorkflowReviewLifecycleService);
//# sourceMappingURL=workflow-review-lifecycle.service.js.map