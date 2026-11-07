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
exports.WorkflowReviewPublishGuard = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const workflow_publish_blocked_error_1 = require("../../errors/response-errors/workflow-publish-blocked.error");
const workflow_review_feature_gate_service_1 = require("./workflow-review-feature-gate.service");
let WorkflowReviewPublishGuard = class WorkflowReviewPublishGuard {
    constructor(featureGate, workflowReviewRequestRepository) {
        this.featureGate = featureGate;
        this.workflowReviewRequestRepository = workflowReviewRequestRepository;
    }
    async assertCanPublish(workflowId) {
        if (!(await this.featureGate.isAvailable()))
            return;
        const request = await this.workflowReviewRequestRepository.findOpenRequestForWorkflow(workflowId, {});
        if (!request)
            return;
        const reason = request.decision === 'changes_requested' ? 'changes_requested' : 'review_pending';
        throw new workflow_publish_blocked_error_1.WorkflowPublishBlockedError({
            reason,
            workflowReviewRequestId: request.id,
        });
    }
};
exports.WorkflowReviewPublishGuard = WorkflowReviewPublishGuard;
exports.WorkflowReviewPublishGuard = WorkflowReviewPublishGuard = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_review_feature_gate_service_1.WorkflowReviewFeatureGate, db_1.WorkflowReviewRequestRepository])
], WorkflowReviewPublishGuard);
//# sourceMappingURL=workflow-review-publish-guard.service.js.map