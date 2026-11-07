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
exports.NodeTypePolicyCheck = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const constants_2 = require("./constants");
const type_availability_policy_service_1 = require("./type-availability-policy.service");
const type_violation_1 = require("./type-violation");
const NO_VIOLATIONS = { violations: [] };
const NOTHING_GRANDFATHERED = new Set();
function distinctTypes(nodes) {
    return [...new Set(nodes.map((node) => node.type))];
}
let NodeTypePolicyCheck = class NodeTypePolicyCheck {
    constructor(service, licenseState) {
        this.service = service;
        this.licenseState = licenseState;
        this.id = 'node-type-availability';
    }
    async onWorkflowSave({ workflow, storedWorkflow, projectId, }) {
        const grandfathered = storedWorkflow
            ? new Set(distinctTypes(storedWorkflow.nodes))
            : NOTHING_GRANDFATHERED;
        return await this.check(workflow, projectId, grandfathered);
    }
    async onWorkflowPublish({ workflow, projectId, }) {
        return await this.check(workflow, projectId, NOTHING_GRANDFATHERED);
    }
    async onWorkflowStart({ workflow, projectId }) {
        return await this.check(workflow, projectId, NOTHING_GRANDFATHERED);
    }
    async onWorkflowTransfer({ workflow, targetProjectId, }) {
        return await this.check(workflow, targetProjectId, NOTHING_GRANDFATHERED);
    }
    async onContentImport(context) {
        if (!('workflow' in context))
            return NO_VIOLATIONS;
        return await this.check(context.workflow, context.projectId, NOTHING_GRANDFATHERED);
    }
    async onCredentialDecrypt({ consumer, projectId, }) {
        if (consumer === null)
            return NO_VIOLATIONS;
        return await this.checkTypes([consumer.nodeType], projectId);
    }
    async check(workflow, projectId, grandfathered) {
        const types = distinctTypes(workflow.nodes).filter((type) => !grandfathered.has(type));
        return await this.checkTypes(types, projectId);
    }
    async checkTypes(types, projectId) {
        if (!this.licenseState.isLicensed(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES))
            return NO_VIOLATIONS;
        if (types.length === 0)
            return NO_VIOLATIONS;
        const { verdicts, versions } = await this.service.evaluateComposedTypesFor(constants_2.NODE_TYPES_KIND, projectId, types);
        return {
            violations: verdicts
                .filter((verdict) => verdict.action === 'deny')
                .map((verdict) => (0, type_violation_1.toTypeViolation)(this.id, type_violation_1.NODE_TYPE_SUBJECT, verdict, projectId)),
            policyVersions: versions,
        };
    }
};
exports.NodeTypePolicyCheck = NodeTypePolicyCheck;
exports.NodeTypePolicyCheck = NodeTypePolicyCheck = __decorate([
    (0, decorators_1.PolicyCheck)(),
    __metadata("design:paramtypes", [type_availability_policy_service_1.TypeAvailabilityPolicyService, backend_common_1.LicenseState])
], NodeTypePolicyCheck);
//# sourceMappingURL=node-type-policy.check.js.map