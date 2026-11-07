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
exports.WorkflowReviewStateNotifier = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
let WorkflowReviewStateNotifier = class WorkflowReviewStateNotifier {
    constructor(logger, collaborationService) {
        this.logger = logger;
        this.collaborationService = collaborationService;
    }
    notify(workflowId) {
        this.collaborationService
            .broadcastWorkflowReviewStateChanged(workflowId)
            .catch((error) => this.logger.warn('Failed to broadcast review state change', { workflowId, error }));
    }
    notifyMany(workflowIds) {
        for (const workflowId of workflowIds) {
            this.notify(workflowId);
        }
    }
};
exports.WorkflowReviewStateNotifier = WorkflowReviewStateNotifier;
exports.WorkflowReviewStateNotifier = WorkflowReviewStateNotifier = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, collaboration_service_1.CollaborationService])
], WorkflowReviewStateNotifier);
//# sourceMappingURL=workflow-review-state-notifier.service.js.map