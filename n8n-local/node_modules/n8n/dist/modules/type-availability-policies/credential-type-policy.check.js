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
exports.CredentialTypePolicyCheck = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const n8n_workflow_1 = require("n8n-workflow");
const node_types_1 = require("../../node-types");
const constants_2 = require("./constants");
const type_availability_policy_service_1 = require("./type-availability-policy.service");
const type_violation_1 = require("./type-violation");
const NO_VIOLATIONS = { violations: [] };
const NOTHING_GRANDFATHERED = new Set();
const CREDENTIAL_TYPE_PARAMETERS = ['nodeCredentialType', 'genericAuthType'];
let CredentialTypePolicyCheck = class CredentialTypePolicyCheck {
    constructor(service, licenseState, nodeTypes) {
        this.service = service;
        this.licenseState = licenseState;
        this.nodeTypes = nodeTypes;
        this.id = 'credential-type-availability';
    }
    async onWorkflowSave({ workflow, storedWorkflow, projectId, }) {
        const grandfathered = storedWorkflow
            ? new Set(this.distinctCredentialTypes(storedWorkflow.nodes))
            : NOTHING_GRANDFATHERED;
        return await this.checkWorkflow(workflow, projectId, grandfathered);
    }
    async onWorkflowPublish({ workflow, projectId, }) {
        return await this.checkWorkflow(workflow, projectId, NOTHING_GRANDFATHERED);
    }
    async onWorkflowStart({ workflow, projectId }) {
        return await this.checkWorkflow(workflow, projectId, NOTHING_GRANDFATHERED);
    }
    async onWorkflowTransfer({ workflow, targetProjectId, }) {
        return await this.checkWorkflow(workflow, targetProjectId, NOTHING_GRANDFATHERED);
    }
    async onContentImport(context) {
        if ('credential' in context) {
            return await this.checkTypes([context.credential.type], context.projectId);
        }
        return await this.checkWorkflow(context.workflow, context.projectId, NOTHING_GRANDFATHERED);
    }
    async onCredentialSave({ credential, storedCredential, projectId, }) {
        if (storedCredential?.type === credential.type)
            return NO_VIOLATIONS;
        return await this.checkTypes([credential.type], projectId);
    }
    async onCredentialTransfer({ credential, targetProjectId, }) {
        return await this.checkTypes([credential.type], targetProjectId);
    }
    async onCredentialDecrypt({ credentialType, projectId, }) {
        return await this.checkTypes([credentialType], projectId);
    }
    distinctCredentialTypes(nodes) {
        const types = new Set();
        for (const node of nodes) {
            for (const type of Object.keys(node.credentials ?? {}))
                types.add(type);
            for (const type of this.parameterCredentialTypes(node))
                types.add(type);
            if (node.extendsCredential)
                types.add(node.extendsCredential);
        }
        return [...types];
    }
    parameterCredentialTypes(node) {
        const named = CREDENTIAL_TYPE_PARAMETERS.map((name) => node.parameters?.[name]).filter((value) => typeof value === 'string' && value !== '');
        if (named.length === 0)
            return [];
        let description = null;
        try {
            description = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion).description;
        }
        catch {
        }
        const active = (0, n8n_workflow_1.getActiveCredentialTypes)(node, description);
        if (!active)
            return [];
        return named.filter((type) => active.has(type));
    }
    async checkWorkflow(workflow, projectId, grandfathered) {
        const types = this.distinctCredentialTypes(workflow.nodes).filter((type) => !grandfathered.has(type));
        return await this.checkTypes(types, projectId);
    }
    async checkTypes(types, projectId) {
        if (!this.licenseState.isLicensed(constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES))
            return NO_VIOLATIONS;
        if (types.length === 0)
            return NO_VIOLATIONS;
        const { verdicts, versions } = await this.service.evaluateComposedTypesFor(constants_2.CREDENTIAL_TYPES_KIND, projectId, types);
        return {
            violations: verdicts
                .filter((verdict) => verdict.action === 'deny')
                .map((verdict) => (0, type_violation_1.toTypeViolation)(this.id, type_violation_1.CREDENTIAL_TYPE_SUBJECT, verdict, projectId)),
            policyVersions: versions,
        };
    }
};
exports.CredentialTypePolicyCheck = CredentialTypePolicyCheck;
exports.CredentialTypePolicyCheck = CredentialTypePolicyCheck = __decorate([
    (0, decorators_1.PolicyCheck)(),
    __metadata("design:paramtypes", [type_availability_policy_service_1.TypeAvailabilityPolicyService, backend_common_1.LicenseState, node_types_1.NodeTypes])
], CredentialTypePolicyCheck);
//# sourceMappingURL=credential-type-policy.check.js.map