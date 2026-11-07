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
exports.NodeTypePolicyRestrictedTypesProvider = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const single_flight_1 = require("@n8n/utils/promise/single-flight");
const policy_enforcement_service_1 = require("../../policy/policy-enforcement.service");
const constants_2 = require("./constants");
const restricted_workflow_repository_1 = require("./database/repositories/restricted-workflow.repository");
const type_availability_policy_service_1 = require("./type-availability-policy.service");
const deniedNames = (verdicts) => verdicts.filter((verdict) => verdict.action === 'deny').map((verdict) => verdict.name);
let NodeTypePolicyRestrictedTypesProvider = class NodeTypePolicyRestrictedTypesProvider {
    constructor(service, licenseState, restrictedWorkflowRepository, policyEnforcementService) {
        this.service = service;
        this.licenseState = licenseState;
        this.restrictedWorkflowRepository = restrictedWorkflowRepository;
        this.policyEnforcementService = policyEnforcementService;
        this.findRestrictedWorkflowIds = (0, single_flight_1.singleFlight)(async () => {
            const restricted = await this.findRestrictedNodeTypes();
            return restricted && this.restrictedWorkflowRepository.restrictedWorkflowIdsQuery(restricted);
        });
    }
    async findRestrictedNodeTypes() {
        if (!this.licenseState.isLicensed(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES) ||
            !this.policyEnforcementService.hasChecksFor('workflowStart')) {
            return null;
        }
        const inUse = await this.restrictedWorkflowRepository.findRunningNodeTypes();
        if (inUse.length === 0)
            return null;
        const { withoutProjectPolicy, byProject } = await this.service.evaluateComposedTypesForAllProjects(constants_2.NODE_TYPES_KIND, inUse);
        const shared = deniedNames(withoutProjectPolicy);
        const sharedKey = shared.join('\n');
        const groups = new Map();
        for (const { projectId, verdicts } of byProject) {
            const denied = deniedNames(verdicts);
            const key = denied.join('\n');
            if (key === sharedKey)
                continue;
            const group = groups.get(key) ?? { projectIds: [], nodeTypes: denied };
            group.projectIds.push(projectId);
            groups.set(key, group);
        }
        if (shared.length === 0 && groups.size === 0)
            return null;
        return { shared, byProjects: [...groups.values()], nodeTypesInUse: inUse };
    }
};
exports.NodeTypePolicyRestrictedTypesProvider = NodeTypePolicyRestrictedTypesProvider;
exports.NodeTypePolicyRestrictedTypesProvider = NodeTypePolicyRestrictedTypesProvider = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [type_availability_policy_service_1.TypeAvailabilityPolicyService, backend_common_1.LicenseState, restricted_workflow_repository_1.RestrictedWorkflowRepository, policy_enforcement_service_1.PolicyEnforcementService])
], NodeTypePolicyRestrictedTypesProvider);
//# sourceMappingURL=restricted-node-types.provider.js.map