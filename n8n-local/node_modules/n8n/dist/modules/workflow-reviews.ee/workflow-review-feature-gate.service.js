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
exports.WorkflowReviewFeatureGate = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const workflow_review_policy_service_1 = require("../../services/workflow-review-policy.service");
let WorkflowReviewFeatureGate = class WorkflowReviewFeatureGate {
    constructor(licenseState, workflowReviewPolicyService) {
        this.licenseState = licenseState;
        this.workflowReviewPolicyService = workflowReviewPolicyService;
    }
    async isAvailable() {
        return (await this.getAvailability()).available;
    }
    async assertAvailable() {
        const availability = await this.getAvailability();
        if (!availability.available) {
            throw new errors_1.ForbiddenError(availability.errorMessage);
        }
    }
    async getAvailability() {
        if (!this.licenseState.isWorkflowReviewsLicensed()) {
            return {
                available: false,
                errorMessage: 'Workflow reviews are not available on this instance',
            };
        }
        const policy = await this.workflowReviewPolicyService.get();
        if (!policy.enabled) {
            return {
                available: false,
                errorMessage: 'Workflow reviews are disabled on this instance',
            };
        }
        return { available: true };
    }
};
exports.WorkflowReviewFeatureGate = WorkflowReviewFeatureGate;
exports.WorkflowReviewFeatureGate = WorkflowReviewFeatureGate = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.LicenseState, workflow_review_policy_service_1.WorkflowReviewPolicyService])
], WorkflowReviewFeatureGate);
//# sourceMappingURL=workflow-review-feature-gate.service.js.map