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
exports.WorkflowReviewRequestDecisionService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
const errors_1 = require("@n8n/errors");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const workflow_service_1 = require("../../workflows/workflow.service");
const workflow_review_authorization_service_1 = require("./workflow-review-authorization.service");
const workflow_review_decision_policy_1 = require("./workflow-review-decision-policy");
const workflow_review_feature_gate_service_1 = require("./workflow-review-feature-gate.service");
const workflow_review_mapper_1 = require("./workflow-review.mapper");
const workflow_review_request_mutation_guard_service_1 = require("./workflow-review-request-mutation-guard.service");
const workflow_review_state_notifier_service_1 = require("./workflow-review-state-notifier.service");
let WorkflowReviewRequestDecisionService = class WorkflowReviewRequestDecisionService {
    constructor(logger, featureGate, workflowFinderService, workflowReviewRequestRepository, workflowReviewRequestWorkflowRepository, workflowReviewRequestAuthorRepository, workflowReviewRequestReviewerRepository, activityRepository, userRepository, dbLockService, collaborationService, workflowService, authorizationService, eventService, mutationGuard, stateNotifier) {
        this.logger = logger;
        this.featureGate = featureGate;
        this.workflowFinderService = workflowFinderService;
        this.workflowReviewRequestRepository = workflowReviewRequestRepository;
        this.workflowReviewRequestWorkflowRepository = workflowReviewRequestWorkflowRepository;
        this.workflowReviewRequestAuthorRepository = workflowReviewRequestAuthorRepository;
        this.workflowReviewRequestReviewerRepository = workflowReviewRequestReviewerRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.dbLockService = dbLockService;
        this.collaborationService = collaborationService;
        this.workflowService = workflowService;
        this.authorizationService = authorizationService;
        this.eventService = eventService;
        this.mutationGuard = mutationGuard;
        this.stateNotifier = stateNotifier;
    }
    async decide(user, workflowReviewRequestId, dto) {
        await this.featureGate.assertAvailable();
        const request = await this.workflowReviewRequestRepository.findById(workflowReviewRequestId, {});
        if (!request) {
            throw new errors_1.NotFoundError('Could not find review request');
        }
        const workflowRows = await this.workflowReviewRequestWorkflowRepository.findByRequestId(workflowReviewRequestId, {});
        const [workflowRow] = workflowRows;
        if (!workflowRow) {
            throw new errors_1.NotFoundError('Could not find review request');
        }
        const readableWorkflows = await Promise.all(workflowRows.map(async (row) => await this.workflowFinderService.findWorkflowForUser(row.workflowId, user, [
            'workflow:read',
        ])));
        const canReadEveryWorkflow = readableWorkflows.every((workflow) => workflow !== null);
        if (!canReadEveryWorkflow) {
            throw new errors_1.NotFoundError('Could not find review request');
        }
        (0, workflow_review_request_mutation_guard_service_1.assertWorkflowReviewRequestUpdatable)(request);
        const hasAdminOverride = await this.authorizationService.isAdminForProject(user, request.projectId);
        const isAuthor = await this.workflowReviewRequestAuthorRepository.isAuthor({ workflowReviewRequestId, userId: user.id }, {});
        const isAssignedReviewer = await this.workflowReviewRequestReviewerRepository.isReviewer({ workflowReviewRequestId, userId: user.id }, {});
        this.assertDecisionAllowed({
            canReadEveryWorkflow,
            isAuthor,
            isAssignedReviewer,
            hasAdminOverride,
        });
        const requesterPublishability = dto.decision === 'approved'
            ? await this.resolveRequesterPublishability(request.createdById, workflowRow.workflowId)
            : null;
        if (dto.decision === 'changes_requested' && !dto.note) {
            throw new errors_1.BadRequestError('A note is required when requesting changes');
        }
        const { request: saved, pinnedVersionId, decidedAsAssignedReviewer, } = await this.dbLockService.withLockContext(1004, async (ctx) => {
            const current = await this.workflowReviewRequestRepository.findById(workflowReviewRequestId, ctx);
            if (!current) {
                throw new errors_1.NotFoundError('Could not find review request');
            }
            (0, workflow_review_request_mutation_guard_service_1.assertWorkflowReviewRequestUpdatable)(current);
            const isAuthorNow = await this.workflowReviewRequestAuthorRepository.isAuthor({ workflowReviewRequestId, userId: user.id }, ctx);
            const isAssignedReviewerNow = await this.workflowReviewRequestReviewerRepository.isReviewer({ workflowReviewRequestId, userId: user.id }, ctx);
            this.assertDecisionAllowed({
                canReadEveryWorkflow,
                isAuthor: isAuthorNow,
                isAssignedReviewer: isAssignedReviewerNow,
                hasAdminOverride,
            });
            const currentRows = await this.workflowReviewRequestWorkflowRepository.findByRequestId(workflowReviewRequestId, ctx);
            const currentRow = currentRows.find((row) => row.workflowId === workflowRow.workflowId);
            if (!currentRow) {
                throw new errors_1.NotFoundError('Could not find review request');
            }
            await this.mutationGuard.assertWorkflowStillReviewable(currentRow.workflowId, current.projectId, ctx, 'review');
            if (dto.decision === 'approved') {
                for (const row of currentRows) {
                    await this.workflowReviewRequestWorkflowRepository.captureApprovalBaseline({
                        workflowReviewRequestId,
                        workflowId: row.workflowId,
                    }, ctx);
                }
            }
            current.decision = dto.decision;
            current.updatedById = user.id;
            if (dto.decision === 'approved') {
                current.state = 'closed';
                current.closedById = requesterPublishability?.canPublish === true ? user.id : null;
                current.approvedAt = new Date();
            }
            const savedRequest = await this.workflowReviewRequestRepository.saveRequest(current, ctx);
            await this.activityRepository.createActivity({
                workflowReviewRequestId,
                type: dto.decision === 'approved' ? 'review.approved' : 'review.changes_requested',
                data: {
                    workflowVersions: currentRows.flatMap((row) => row.workflowVersionId === null
                        ? []
                        : [{ workflowId: row.workflowId, workflowVersionId: row.workflowVersionId }]),
                    note: dto.note ?? null,
                },
                createdById: user.id,
            }, ctx);
            return {
                request: savedRequest,
                pinnedVersionId: currentRow.workflowVersionId,
                decidedAsAssignedReviewer: isAssignedReviewerNow,
            };
        });
        this.stateNotifier.notify(workflowRow.workflowId);
        this.eventService.emit('workflow-review-decided', {
            user,
            workflowReviewRequestId,
            workflowId: workflowRow.workflowId,
            workflowVersionId: pinnedVersionId,
            decision: dto.decision,
            decidedVia: decidedAsAssignedReviewer ? 'assigned-reviewer' : 'admin-override',
            reviewCreatedAt: saved.createdAt,
        });
        const summary = (0, workflow_review_mapper_1.toRequestSummary)(saved, pinnedVersionId);
        if (dto.decision !== 'approved' || requesterPublishability === null) {
            return summary;
        }
        if (!requesterPublishability.canPublish) {
            this.logger.warn('Cannot publish approved review: requester cannot publish', {
                workflowId: workflowRow.workflowId,
                message: requesterPublishability.failureMessage,
            });
            return {
                ...summary,
                autoPublish: {
                    status: 'failed',
                    message: requesterPublishability.failureMessage,
                },
            };
        }
        return {
            ...summary,
            autoPublish: await this.publishApprovedVersion(requesterPublishability.requester, workflowRow.workflowId, pinnedVersionId),
        };
    }
    async resolveRequesterPublishability(createdById, workflowId) {
        if (!createdById) {
            return {
                canPublish: false,
                failureMessage: 'The review requester is no longer available',
            };
        }
        const [requester] = await this.userRepository.findManyByIds([createdById], {
            includeRole: true,
        });
        if (!requester || requester.disabled) {
            return {
                canPublish: false,
                failureMessage: 'The review requester is no longer available',
            };
        }
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, requester, [
            'workflow:publish',
        ]);
        if (!workflow) {
            return {
                canPublish: false,
                failureMessage: 'The review requester no longer has permission to publish this workflow',
            };
        }
        return { canPublish: true, requester };
    }
    async publishApprovedVersion(requester, workflowId, pinnedVersionId) {
        if (pinnedVersionId === null) {
            this.logger.warn('Cannot publish approved review: the pinned version was pruned', {
                workflowId,
            });
            return { status: 'failed', message: 'The reviewed workflow version no longer exists' };
        }
        try {
            await this.workflowService.activateWorkflow(requester, workflowId, {
                versionId: pinnedVersionId,
                source: 'review-approval',
            });
        }
        catch (error) {
            this.logger.error('Failed to publish workflow after review approval', {
                workflowId,
                pinnedVersionId,
                error,
            });
            return { status: 'failed', message: (0, ensure_error_1.ensureError)(error).message };
        }
        this.collaborationService
            .broadcastWorkflowUpdate(workflowId, requester.id)
            .catch((error) => this.logger.warn('Failed to broadcast workflow update', { workflowId, error }));
        return { status: 'published' };
    }
    assertDecisionAllowed(facts) {
        const capability = (0, workflow_review_decision_policy_1.resolveDecisionCapability)(facts);
        if (capability.allowed) {
            return;
        }
        if (capability.reason === 'author') {
            throw new errors_1.ForbiddenError('Authors cannot decide on their own review request');
        }
        throw new errors_1.NotFoundError('Could not find review request');
    }
};
exports.WorkflowReviewRequestDecisionService = WorkflowReviewRequestDecisionService;
exports.WorkflowReviewRequestDecisionService = WorkflowReviewRequestDecisionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, workflow_review_feature_gate_service_1.WorkflowReviewFeatureGate, workflow_finder_service_1.WorkflowFinderService, db_1.WorkflowReviewRequestRepository, db_1.WorkflowReviewRequestWorkflowRepository, db_1.WorkflowReviewRequestAuthorRepository, db_1.WorkflowReviewRequestReviewerRepository, db_1.WorkflowReviewActivityRepository, db_1.UserRepository, db_1.DbLockService, collaboration_service_1.CollaborationService, workflow_service_1.WorkflowService, workflow_review_authorization_service_1.WorkflowReviewAuthorizationService, backend_services_1.EventService, workflow_review_request_mutation_guard_service_1.WorkflowReviewRequestMutationGuard, workflow_review_state_notifier_service_1.WorkflowReviewStateNotifier])
], WorkflowReviewRequestDecisionService);
//# sourceMappingURL=workflow-review-request-decision.service.js.map