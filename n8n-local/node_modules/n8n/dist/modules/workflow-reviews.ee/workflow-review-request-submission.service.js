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
exports.WorkflowReviewRequestSubmissionService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const workflow_history_service_1 = require("../../workflows/workflow-history/workflow-history.service");
const workflow_review_feature_gate_service_1 = require("./workflow-review-feature-gate.service");
const workflow_review_mapper_1 = require("./workflow-review.mapper");
const workflow_review_request_mutation_guard_service_1 = require("./workflow-review-request-mutation-guard.service");
const workflow_review_state_notifier_service_1 = require("./workflow-review-state-notifier.service");
function normalizeDescription(description) {
    if (description === undefined)
        return undefined;
    return description.trim() || null;
}
let WorkflowReviewRequestSubmissionService = class WorkflowReviewRequestSubmissionService {
    constructor(featureGate, workflowFinderService, workflowHistoryService, workflowHistoryRepository, sharedWorkflowRepository, workflowReviewRequestRepository, workflowReviewRequestWorkflowRepository, workflowReviewRequestAuthorRepository, workflowReviewRequestReviewerRepository, activityRepository, userRepository, roleService, dbLockService, eventService, mutationGuard, stateNotifier) {
        this.featureGate = featureGate;
        this.workflowFinderService = workflowFinderService;
        this.workflowHistoryService = workflowHistoryService;
        this.workflowHistoryRepository = workflowHistoryRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.workflowReviewRequestRepository = workflowReviewRequestRepository;
        this.workflowReviewRequestWorkflowRepository = workflowReviewRequestWorkflowRepository;
        this.workflowReviewRequestAuthorRepository = workflowReviewRequestAuthorRepository;
        this.workflowReviewRequestReviewerRepository = workflowReviewRequestReviewerRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.roleService = roleService;
        this.dbLockService = dbLockService;
        this.eventService = eventService;
        this.mutationGuard = mutationGuard;
        this.stateNotifier = stateNotifier;
    }
    async findEligibleReviewers(projectId, excludeUserId) {
        const [projectRoleSlugs, globalRoleSlugs] = await Promise.all([
            this.roleService.rolesWithScope('project', ['workflow:read']),
            this.roleService.rolesWithScope('global', ['workflow:read']),
        ]);
        const users = await this.userRepository.findEligibleByProjectOrGlobalRoles({
            projectId,
            projectRoleSlugs,
            globalRoleSlugs,
        });
        return users
            .filter((user) => !user.isPending && user.id !== excludeUserId)
            .sort((a, b) => a.email.localeCompare(b.email));
    }
    async getEligibleReviewers(user, query) {
        await this.featureGate.assertAvailable();
        const workflow = await this.workflowFinderService.findWorkflowForUser(query.workflowId, user, [
            'workflow:publish',
        ]);
        if (!workflow) {
            throw new errors_1.NotFoundError('Could not find workflow');
        }
        const project = await this.sharedWorkflowRepository.getWorkflowOwningProject(query.workflowId);
        if (!project) {
            throw new errors_1.NotFoundError('Could not find workflow');
        }
        const reviewers = await this.findEligibleReviewers(project.id, user.id);
        return {
            count: reviewers.length,
            data: reviewers.map(workflow_review_mapper_1.toEligibleReviewer),
        };
    }
    async nameVersion(workflowId, versionId, name, description, ctx) {
        const affected = await this.workflowHistoryRepository.updateVersionMetadata({ workflowId, versionId, name, description }, ctx);
        if (affected === 0) {
            throw new errors_1.BadRequestError(`Version '${versionId}' does not exist for workflow '${workflowId}'`);
        }
    }
    async updateVersionMetadataIfChanged(current, workflowId, versionId, name, description, ctx) {
        const changed = name !== current.name || (description !== undefined && description !== current.description);
        if (changed) {
            await this.nameVersion(workflowId, versionId, name, description, ctx);
        }
    }
    async create(user, dto) {
        const { workflowId, workflowVersionId, workflowVersionName, workflowVersionDescription } = dto.workflows[0];
        const versionName = workflowVersionName.trim();
        const versionDescription = normalizeDescription(workflowVersionDescription);
        await this.featureGate.assertAvailable();
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:publish',
        ]);
        if (!workflow) {
            throw new errors_1.NotFoundError('Could not find workflow');
        }
        if (workflow.isArchived) {
            throw new errors_1.BadRequestError(`The workflow '${workflowId}' is archived and cannot be submitted for review`);
        }
        const version = await this.workflowHistoryService.findVersion(workflowId, workflowVersionId);
        if (!version) {
            throw new errors_1.BadRequestError(`Version '${workflowVersionId}' does not exist for workflow '${workflowId}'`);
        }
        const project = await this.sharedWorkflowRepository.getWorkflowOwningProject(workflowId);
        if (!project) {
            throw new errors_1.NotFoundError('Could not find workflow');
        }
        const reviewerUserIds = [...new Set(dto.reviewerUserIds)];
        if (reviewerUserIds.length === 0) {
            throw new errors_1.BadRequestError('You must assign at least one reviewer');
        }
        if (reviewerUserIds.includes(user.id)) {
            throw new errors_1.BadRequestError('You cannot assign yourself as a reviewer');
        }
        const eligibleIds = new Set((await this.findEligibleReviewers(project.id, user.id)).map((reviewer) => reviewer.id));
        const ineligibleIds = reviewerUserIds.filter((id) => !eligibleIds.has(id));
        if (ineligibleIds.length > 0) {
            throw new errors_1.BadRequestError(`These users are not eligible to review this workflow: ${ineligibleIds.join(', ')}`);
        }
        const request = await this.dbLockService.withLockContext(1004, async (ctx) => {
            await this.mutationGuard.assertWorkflowStillReviewable(workflowId, project.id, ctx, 'submit');
            const existing = await this.workflowReviewRequestRepository.findOpenRequestForWorkflow(workflowId, ctx);
            if (existing) {
                throw new errors_1.ConflictError('An open review request already exists for this workflow', 'Update the existing review request instead of creating a new one', { workflowReviewRequestId: existing.id });
            }
            const created = await this.workflowReviewRequestRepository.createRequest({
                projectId: project.id,
                title: dto.title,
                description: normalizeDescription(dto.description) ?? null,
                createdById: user.id,
            }, ctx);
            await this.workflowReviewRequestWorkflowRepository.createWorkflowRow({
                workflowReviewRequestId: created.id,
                workflowId,
                workflowVersionId,
            }, ctx);
            await this.nameVersion(workflowId, workflowVersionId, versionName, versionDescription, ctx);
            await this.workflowReviewRequestAuthorRepository.addAuthor({ workflowReviewRequestId: created.id, userId: user.id }, ctx);
            await this.workflowReviewRequestReviewerRepository.addReviewers({ workflowReviewRequestId: created.id, userIds: reviewerUserIds }, ctx);
            await this.activityRepository.createActivity({
                workflowReviewRequestId: created.id,
                type: 'review.opened',
                data: { workflowVersions: [{ workflowId, workflowVersionId }] },
                createdById: user.id,
            }, ctx);
            return created;
        });
        this.stateNotifier.notify(workflowId);
        this.eventService.emit('workflow-review-requested', {
            user,
            workflowReviewRequestId: request.id,
            projectId: project.id,
            workflowId,
            workflowVersionId,
            reviewerCount: reviewerUserIds.length,
        });
        return (0, workflow_review_mapper_1.toRequestSummary)(request, workflowVersionId);
    }
    async updateVersion(user, workflowReviewRequestId, dto) {
        await this.featureGate.assertAvailable();
        const request = await this.workflowReviewRequestRepository.findById(workflowReviewRequestId, {});
        if (!request) {
            throw new errors_1.NotFoundError('Could not find review request');
        }
        const workflowRows = await this.workflowReviewRequestWorkflowRepository.findByRequestId(workflowReviewRequestId, {});
        const workflowRow = workflowRows.find((row) => row.workflowId === dto.workflowId);
        if (!workflowRow) {
            throw new errors_1.NotFoundError('Could not find review request');
        }
        const workflow = await this.workflowFinderService.findWorkflowForUser(dto.workflowId, user, [
            'workflow:publish',
        ]);
        if (!workflow) {
            throw new errors_1.NotFoundError('Could not find workflow');
        }
        if (workflow.isArchived) {
            throw new errors_1.BadRequestError(`The workflow '${dto.workflowId}' is archived and its review cannot be updated`);
        }
        (0, workflow_review_request_mutation_guard_service_1.assertWorkflowReviewRequestUpdatable)(request);
        const version = await this.workflowHistoryService.findVersion(dto.workflowId, dto.workflowVersionId);
        if (!version) {
            throw new errors_1.BadRequestError(`Version '${dto.workflowVersionId}' does not exist for workflow '${dto.workflowId}'`);
        }
        const versionName = dto.workflowVersionName.trim();
        const versionDescription = normalizeDescription(dto.workflowVersionDescription);
        const reviewDescription = normalizeDescription(dto.description);
        const hasReviewDescriptionChanged = (current) => reviewDescription !== undefined && reviewDescription !== current.description;
        if (workflowRow.workflowVersionId === dto.workflowVersionId &&
            !hasReviewDescriptionChanged(request)) {
            await this.updateVersionMetadataIfChanged(version, dto.workflowId, dto.workflowVersionId, versionName, versionDescription, {});
            return (0, workflow_review_mapper_1.toRequestSummary)(request, workflowRow.workflowVersionId);
        }
        const { request: updated, changed, versionUpdated, } = await this.dbLockService.withLockContext(1004, async (ctx) => {
            const current = await this.workflowReviewRequestRepository.findById(workflowReviewRequestId, ctx);
            if (!current) {
                throw new errors_1.NotFoundError('Could not find review request');
            }
            (0, workflow_review_request_mutation_guard_service_1.assertWorkflowReviewRequestUpdatable)(current);
            const currentRows = await this.workflowReviewRequestWorkflowRepository.findByRequestId(workflowReviewRequestId, ctx);
            const currentRow = currentRows.find((row) => row.workflowId === dto.workflowId);
            if (!currentRow) {
                throw new errors_1.NotFoundError('Could not find review request');
            }
            await this.mutationGuard.assertWorkflowStillReviewable(currentRow.workflowId, current.projectId, ctx, 'update');
            if (currentRow.workflowVersionId === dto.workflowVersionId) {
                await this.updateVersionMetadataIfChanged(version, dto.workflowId, dto.workflowVersionId, versionName, versionDescription, ctx);
                if (reviewDescription === undefined || reviewDescription === current.description) {
                    return { request: current, changed: false, versionUpdated: false };
                }
                current.description = reviewDescription;
                current.updatedById = user.id;
                const saved = await this.workflowReviewRequestRepository.saveRequest(current, ctx);
                return { request: saved, changed: true, versionUpdated: false };
            }
            const fromWorkflowVersionId = currentRow.workflowVersionId;
            await this.workflowReviewRequestWorkflowRepository.updateWorkflowVersion({
                workflowReviewRequestId,
                workflowId: dto.workflowId,
                workflowVersionId: dto.workflowVersionId,
            }, ctx);
            await this.nameVersion(dto.workflowId, dto.workflowVersionId, versionName, versionDescription, ctx);
            current.decision = 'pending';
            if (reviewDescription !== undefined) {
                current.description = reviewDescription;
            }
            current.updatedById = user.id;
            const saved = await this.workflowReviewRequestRepository.saveRequest(current, ctx);
            await this.workflowReviewRequestAuthorRepository.addAuthorIfMissing({ workflowReviewRequestId, userId: user.id }, ctx);
            await this.activityRepository.createActivity({
                workflowReviewRequestId,
                type: 'review.version_updated',
                data: {
                    workflowId: dto.workflowId,
                    fromWorkflowVersionId,
                    toWorkflowVersionId: dto.workflowVersionId,
                },
                createdById: user.id,
            }, ctx);
            return { request: saved, changed: true, versionUpdated: true };
        });
        if (changed) {
            this.stateNotifier.notify(dto.workflowId);
        }
        if (versionUpdated) {
            this.eventService.emit('workflow-review-version-updated', {
                user,
                workflowReviewRequestId,
                workflowId: dto.workflowId,
                workflowVersionId: dto.workflowVersionId,
            });
        }
        return (0, workflow_review_mapper_1.toRequestSummary)(updated, dto.workflowVersionId);
    }
};
exports.WorkflowReviewRequestSubmissionService = WorkflowReviewRequestSubmissionService;
exports.WorkflowReviewRequestSubmissionService = WorkflowReviewRequestSubmissionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_review_feature_gate_service_1.WorkflowReviewFeatureGate, workflow_finder_service_1.WorkflowFinderService, workflow_history_service_1.WorkflowHistoryService, db_1.WorkflowHistoryRepository, db_1.SharedWorkflowRepository, db_1.WorkflowReviewRequestRepository, db_1.WorkflowReviewRequestWorkflowRepository, db_1.WorkflowReviewRequestAuthorRepository, db_1.WorkflowReviewRequestReviewerRepository, db_1.WorkflowReviewActivityRepository, db_1.UserRepository, backend_services_1.RoleService, db_1.DbLockService, backend_services_1.EventService, workflow_review_request_mutation_guard_service_1.WorkflowReviewRequestMutationGuard, workflow_review_state_notifier_service_1.WorkflowReviewStateNotifier])
], WorkflowReviewRequestSubmissionService);
//# sourceMappingURL=workflow-review-request-submission.service.js.map