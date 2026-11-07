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
exports.WorkflowReviewRequestMutationGuard = void 0;
exports.assertWorkflowReviewRequestUpdatable = assertWorkflowReviewRequestUpdatable;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const BLOCKED_ACTION_TEXT = {
    submit: 'submitted for review',
    review: 'reviewed',
    update: 'submitted as a new review version',
};
function assertWorkflowReviewRequestUpdatable(request) {
    if (request.state === 'closed' || request.decision === 'approved') {
        throw new errors_1.ConflictError('The review request is no longer open');
    }
}
let WorkflowReviewRequestMutationGuard = class WorkflowReviewRequestMutationGuard {
    constructor(workflowRepository, sharedWorkflowRepository) {
        this.workflowRepository = workflowRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
    }
    async assertWorkflowStillReviewable(workflowId, expectedProjectId, ctx, action) {
        const blockedAction = BLOCKED_ACTION_TEXT[action];
        const workflow = await this.workflowRepository.findArchivedState(workflowId, ctx);
        if (!workflow) {
            throw new errors_1.NotFoundError('Could not find workflow');
        }
        if (workflow.isArchived) {
            throw new errors_1.BadRequestError(`The workflow '${workflowId}' is archived and cannot be ${blockedAction}`);
        }
        const project = await this.sharedWorkflowRepository.getWorkflowOwningProject(workflowId, ctx);
        if (!project) {
            throw new errors_1.NotFoundError('Could not find workflow');
        }
        if (project.id !== expectedProjectId) {
            throw new errors_1.ConflictError(`The workflow '${workflowId}' moved to another project and cannot be ${blockedAction} here`, 'Retry from the project that now owns the workflow');
        }
    }
};
exports.WorkflowReviewRequestMutationGuard = WorkflowReviewRequestMutationGuard;
exports.WorkflowReviewRequestMutationGuard = WorkflowReviewRequestMutationGuard = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowRepository, db_1.SharedWorkflowRepository])
], WorkflowReviewRequestMutationGuard);
//# sourceMappingURL=workflow-review-request-mutation-guard.service.js.map