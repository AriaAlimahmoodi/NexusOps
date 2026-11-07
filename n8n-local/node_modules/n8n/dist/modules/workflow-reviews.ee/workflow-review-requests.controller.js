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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowReviewRequestsController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const workflow_review_activity_service_1 = require("./workflow-review-activity.service");
const workflow_review_inbox_service_1 = require("./workflow-review-inbox.service");
const workflow_review_request_decision_service_1 = require("./workflow-review-request-decision.service");
const workflow_review_request_status_service_1 = require("./workflow-review-request-status.service");
const workflow_review_request_submission_service_1 = require("./workflow-review-request-submission.service");
let WorkflowReviewRequestsController = class WorkflowReviewRequestsController {
    constructor(workflowReviewRequestStatusService, workflowReviewRequestSubmissionService, workflowReviewRequestDecisionService, workflowReviewInboxService, workflowReviewActivityService) {
        this.workflowReviewRequestStatusService = workflowReviewRequestStatusService;
        this.workflowReviewRequestSubmissionService = workflowReviewRequestSubmissionService;
        this.workflowReviewRequestDecisionService = workflowReviewRequestDecisionService;
        this.workflowReviewInboxService = workflowReviewInboxService;
        this.workflowReviewActivityService = workflowReviewActivityService;
    }
    async list(req, _res, query) {
        return await this.workflowReviewRequestStatusService.list(req.user, query);
    }
    async getEligibleReviewers(req, _res, query) {
        return await this.workflowReviewRequestSubmissionService.getEligibleReviewers(req.user, query);
    }
    async create(req, res, dto) {
        const request = await this.workflowReviewRequestSubmissionService.create(req.user, dto);
        res.status(201);
        return request;
    }
    async updateVersion(req, _res, workflowReviewRequestId, dto) {
        return await this.workflowReviewRequestSubmissionService.updateVersion(req.user, workflowReviewRequestId, dto);
    }
    async decide(req, _res, workflowReviewRequestId, dto) {
        return await this.workflowReviewRequestDecisionService.decide(req.user, workflowReviewRequestId, dto);
    }
    async listActivity(req, _res, workflowReviewRequestId, query) {
        return await this.workflowReviewActivityService.listActivity(req.user, workflowReviewRequestId, query);
    }
    async createComment(req, res, workflowReviewRequestId, dto) {
        const entry = await this.workflowReviewActivityService.createComment(req.user, workflowReviewRequestId, dto);
        res.status(201);
        return entry;
    }
    async getDetail(req, _res, workflowReviewRequestId) {
        return await this.workflowReviewInboxService.getDetail(req.user, workflowReviewRequestId);
    }
};
exports.WorkflowReviewRequestsController = WorkflowReviewRequestsController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.Licensed)('feat:workflowReviews'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListWorkflowReviewRequestsQueryDto]),
    __metadata("design:returntype", Promise)
], WorkflowReviewRequestsController.prototype, "list", null);
__decorate([
    (0, decorators_1.Get)('/eligible-reviewers'),
    (0, decorators_1.Licensed)('feat:workflowReviews'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.GetWorkflowReviewEligibleReviewersQueryDto]),
    __metadata("design:returntype", Promise)
], WorkflowReviewRequestsController.prototype, "getEligibleReviewers", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.Licensed)('feat:workflowReviews'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateWorkflowReviewRequestDto]),
    __metadata("design:returntype", Promise)
], WorkflowReviewRequestsController.prototype, "create", null);
__decorate([
    (0, decorators_1.Post)('/:workflowReviewRequestId/update-version'),
    (0, decorators_1.Licensed)('feat:workflowReviews'),
    __param(2, (0, decorators_1.Param)('workflowReviewRequestId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateWorkflowReviewRequestVersionDto]),
    __metadata("design:returntype", Promise)
], WorkflowReviewRequestsController.prototype, "updateVersion", null);
__decorate([
    (0, decorators_1.Post)('/:workflowReviewRequestId/decision'),
    (0, decorators_1.Licensed)('feat:workflowReviews'),
    __param(2, (0, decorators_1.Param)('workflowReviewRequestId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.DecideWorkflowReviewRequestDto]),
    __metadata("design:returntype", Promise)
], WorkflowReviewRequestsController.prototype, "decide", null);
__decorate([
    (0, decorators_1.Get)('/:workflowReviewRequestId/activity'),
    (0, decorators_1.Licensed)('feat:workflowReviews'),
    __param(2, (0, decorators_1.Param)('workflowReviewRequestId')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ListWorkflowReviewActivityQueryDto]),
    __metadata("design:returntype", Promise)
], WorkflowReviewRequestsController.prototype, "listActivity", null);
__decorate([
    (0, decorators_1.Post)('/:workflowReviewRequestId/comments'),
    (0, decorators_1.Licensed)('feat:workflowReviews'),
    __param(2, (0, decorators_1.Param)('workflowReviewRequestId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.CreateWorkflowReviewCommentDto]),
    __metadata("design:returntype", Promise)
], WorkflowReviewRequestsController.prototype, "createComment", null);
__decorate([
    (0, decorators_1.Get)('/:workflowReviewRequestId'),
    (0, decorators_1.Licensed)('feat:workflowReviews'),
    __param(2, (0, decorators_1.Param)('workflowReviewRequestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowReviewRequestsController.prototype, "getDetail", null);
exports.WorkflowReviewRequestsController = WorkflowReviewRequestsController = __decorate([
    (0, decorators_1.RestController)('/workflow-review-requests'),
    __metadata("design:paramtypes", [workflow_review_request_status_service_1.WorkflowReviewRequestStatusService, workflow_review_request_submission_service_1.WorkflowReviewRequestSubmissionService, workflow_review_request_decision_service_1.WorkflowReviewRequestDecisionService, workflow_review_inbox_service_1.WorkflowReviewInboxService, workflow_review_activity_service_1.WorkflowReviewActivityService])
], WorkflowReviewRequestsController);
//# sourceMappingURL=workflow-review-requests.controller.js.map