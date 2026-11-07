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
exports.WorkflowReviewRequestStatusService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const workflow_review_authorization_service_1 = require("./workflow-review-authorization.service");
const workflow_review_feature_gate_service_1 = require("./workflow-review-feature-gate.service");
const workflow_review_mapper_1 = require("./workflow-review.mapper");
let WorkflowReviewRequestStatusService = class WorkflowReviewRequestStatusService {
    constructor(featureGate, workflowFinderService, workflowReviewRequestRepository, userRepository, authorizationService) {
        this.featureGate = featureGate;
        this.workflowFinderService = workflowFinderService;
        this.workflowReviewRequestRepository = workflowReviewRequestRepository;
        this.userRepository = userRepository;
        this.authorizationService = authorizationService;
    }
    async list(user, query) {
        await this.featureGate.assertAvailable();
        const workflow = await this.workflowFinderService.findWorkflowForUser(query.workflowId, user, [
            'workflow:read',
        ]);
        if (!workflow) {
            throw new errors_1.NotFoundError('Could not find workflow');
        }
        const [[requests, count], canPublish] = await Promise.all([
            this.workflowReviewRequestRepository.findRequestsForWorkflow(query.workflowId, {
                state: query.state,
                skip: query.skip,
                take: query.take,
            }),
            this.workflowFinderService
                .findWorkflowForUser(query.workflowId, user, ['workflow:publish'])
                .then((found) => found !== null),
        ]);
        return {
            count,
            data: await this.toWorkflowScopedItems(requests, canPublish, user),
        };
    }
    async toWorkflowScopedItems(requests, canPublish, user) {
        const [decisionActors, openableIds] = await Promise.all([
            this.resolveDecisionActors(requests),
            this.authorizationService.resolveOpenableRequestIds(user, requests),
        ]);
        return requests.map((request) => ({
            id: request.id,
            state: request.state,
            decision: request.decision,
            description: canPublish ? request.description : null,
            workflowVersionId: request.workflowVersionId,
            workflowVersionName: request.workflowVersionName,
            createdAt: request.createdAt.toISOString(),
            updatedAt: request.updatedAt.toISOString(),
            decisionBy: this.pickDecisionActor(request, decisionActors),
            viewerCanOpen: openableIds.has(request.id),
        }));
    }
    async resolveDecisionActors(requests) {
        const actorIds = [
            ...new Set(requests.flatMap((request) => request.decision === 'changes_requested' && request.updatedById
                ? [request.updatedById]
                : [])),
        ];
        if (actorIds.length === 0) {
            return new Map();
        }
        const actors = await this.userRepository.findManyByIds(actorIds);
        return new Map(actors.map((actor) => [actor.id, (0, workflow_review_mapper_1.toEligibleReviewer)(actor)]));
    }
    pickDecisionActor(request, actors) {
        if (request.decision !== 'changes_requested' || !request.updatedById) {
            return null;
        }
        return actors.get(request.updatedById) ?? null;
    }
};
exports.WorkflowReviewRequestStatusService = WorkflowReviewRequestStatusService;
exports.WorkflowReviewRequestStatusService = WorkflowReviewRequestStatusService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_review_feature_gate_service_1.WorkflowReviewFeatureGate, workflow_finder_service_1.WorkflowFinderService, db_1.WorkflowReviewRequestRepository, db_1.UserRepository, workflow_review_authorization_service_1.WorkflowReviewAuthorizationService])
], WorkflowReviewRequestStatusService);
//# sourceMappingURL=workflow-review-request-status.service.js.map