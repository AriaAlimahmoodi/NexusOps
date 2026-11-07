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
exports.PolicyLifecycleHandler = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const policy_enforcement_service_1 = require("../../policy/policy-enforcement.service");
const ownership_service_1 = require("../../services/ownership.service");
let PolicyLifecycleHandler = class PolicyLifecycleHandler {
    constructor(policyEnforcementService, ownershipService) {
        this.policyEnforcementService = policyEnforcementService;
        this.ownershipService = ownershipService;
    }
    async onWorkflowExecuteBefore(ctx) {
        if (!ctx.workflowInstance)
            return;
        if (!this.policyEnforcementService.hasChecksFor('workflowStart'))
            return;
        const project = await this.ownershipService.getWorkflowProjectCached(ctx.workflow.id);
        await this.policyEnforcementService.enforceWorkflowStart({ workflow: ctx.workflow, projectId: project.id }, { kind: 'system', reason: 'execution', executionId: ctx.executionId });
    }
};
exports.PolicyLifecycleHandler = PolicyLifecycleHandler;
__decorate([
    (0, decorators_1.OnLifecycleEvent)('workflowExecuteBefore'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PolicyLifecycleHandler.prototype, "onWorkflowExecuteBefore", null);
exports.PolicyLifecycleHandler = PolicyLifecycleHandler = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [policy_enforcement_service_1.PolicyEnforcementService, ownership_service_1.OwnershipService])
], PolicyLifecycleHandler);
//# sourceMappingURL=policy-lifecycle-handler.js.map