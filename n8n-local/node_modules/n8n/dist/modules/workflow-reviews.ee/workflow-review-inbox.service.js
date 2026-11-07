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
exports.WorkflowReviewInboxService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const workflow_history_service_1 = require("../../workflows/workflow-history/workflow-history.service");
const workflow_review_authorization_service_1 = require("./workflow-review-authorization.service");
const workflow_review_feature_gate_service_1 = require("./workflow-review-feature-gate.service");
const workflow_review_participant_resolver_1 = require("./workflow-review-participant.resolver");
let WorkflowReviewInboxService = class WorkflowReviewInboxService {
    constructor(featureGate, authorizationService, workflowHistoryService, workflowReviewInboxRepository, workflowReviewRequestWorkflowRepository, participantResolver) {
        this.featureGate = featureGate;
        this.authorizationService = authorizationService;
        this.workflowHistoryService = workflowHistoryService;
        this.workflowReviewInboxRepository = workflowReviewInboxRepository;
        this.workflowReviewRequestWorkflowRepository = workflowReviewRequestWorkflowRepository;
        this.participantResolver = participantResolver;
    }
    async isInboxAvailable() {
        return await this.featureGate.isAvailable();
    }
    async listForInbox(user, query) {
        await this.featureGate.assertAvailable();
        const visibility = await this.authorizationService.resolveInboxVisibility(user);
        const rows = await this.workflowReviewInboxRepository.findRequests({
            visibility,
            state: query.state,
            category: query.category === undefined ? undefined : { userId: user.id, category: query.category },
            limit: query.limit,
            boundary: query.boundary,
        });
        const [linkedWorkflowByRequestId, participants] = await Promise.all([
            this.workflowReviewRequestWorkflowRepository.findLinkedWorkflowsByRequestIds(rows.map((row) => row.id)),
            this.participantResolver.resolve(rows),
        ]);
        return rows.map((row) => ({
            type: 'workflow_review',
            ...this.toInboxItem(row, linkedWorkflowByRequestId.get(row.id) ?? null, participants.for(row.id)),
        }));
    }
    async getInboxSummaryForUser(user) {
        await this.featureGate.assertAvailable();
        const visibility = await this.authorizationService.resolveInboxVisibility(user);
        return await this.workflowReviewInboxRepository.countRequestsByState(visibility);
    }
    async getDetail(user, workflowReviewRequestId) {
        await this.featureGate.assertAvailable();
        const access = await this.authorizationService.findReadableRequestOrFail(user, workflowReviewRequestId);
        const { request, readableWorkflowRows } = access;
        const [workflows, participants, eligibility] = await Promise.all([
            Promise.all(readableWorkflowRows.map(async (row) => await this.toWorkflowDetail(row))),
            this.participantResolver.resolve([request]),
            this.authorizationService.resolveViewerEligibility(user, access),
        ]);
        return {
            ...this.toReviewSummary(request, participants.for(request.id)),
            description: request.description,
            workflows,
            viewerCanDecide: eligibility.canDecide,
            viewerDecisionIneligibilityReason: eligibility.decisionIneligibilityReason,
            viewerCanComment: eligibility.canComment,
        };
    }
    async toWorkflowDetail(row) {
        const baselineVersionId = row.baselineVersionId ?? (row.requestState === 'closed' ? null : row.activeVersionId);
        const [pinnedVersion, baselineVersion] = await Promise.all([
            this.findVersionSnapshot(row.workflowId, row.workflowVersionId),
            this.findVersionSnapshot(row.workflowId, baselineVersionId),
        ]);
        return {
            workflowId: row.workflowId,
            workflowName: row.workflowName,
            workflowVersionId: row.workflowVersionId,
            pinnedVersion,
            publishedVersionId: row.activeVersionId,
            baselineVersion,
        };
    }
    async findVersionSnapshot(workflowId, versionId) {
        if (!versionId) {
            return null;
        }
        const version = await this.workflowHistoryService.findVersion(workflowId, versionId);
        return version ? this.toVersionSnapshot(version) : null;
    }
    toVersionSnapshot(version) {
        return {
            versionId: version.versionId,
            name: version.name,
            nodes: version.nodes,
            connections: version.connections,
            nodeGroups: version.nodeGroups,
            createdAt: version.createdAt.toISOString(),
        };
    }
    toReviewSummary(entity, { requester, authors, reviewers }) {
        return {
            id: entity.id,
            projectId: entity.projectId,
            title: entity.title,
            decision: entity.decision,
            state: entity.state,
            createdAt: entity.createdAt.toISOString(),
            updatedAt: entity.updatedAt.toISOString(),
            requester,
            authors,
            reviewers,
        };
    }
    toInboxItem(entity, linkedWorkflow, participants) {
        return {
            ...this.toReviewSummary(entity, participants),
            workflowName: linkedWorkflow?.workflowName ?? null,
            workflowVersionId: linkedWorkflow?.workflowVersionId ?? null,
        };
    }
};
exports.WorkflowReviewInboxService = WorkflowReviewInboxService;
exports.WorkflowReviewInboxService = WorkflowReviewInboxService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_review_feature_gate_service_1.WorkflowReviewFeatureGate, workflow_review_authorization_service_1.WorkflowReviewAuthorizationService, workflow_history_service_1.WorkflowHistoryService, db_1.WorkflowReviewInboxRepository, db_1.WorkflowReviewRequestWorkflowRepository, workflow_review_participant_resolver_1.WorkflowReviewParticipantResolver])
], WorkflowReviewInboxService);
//# sourceMappingURL=workflow-review-inbox.service.js.map