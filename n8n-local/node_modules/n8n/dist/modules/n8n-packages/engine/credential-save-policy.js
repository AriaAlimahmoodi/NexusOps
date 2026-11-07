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
exports.CredentialSavePolicyGate = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const policy_enforcement_service_1 = require("../../../policy/policy-enforcement.service");
const policy_violation_error_1 = require("../../../policy/policy-violation.error");
const credential_missing_mode_1 = require("../entities/credential/credential-missing-mode");
const requirement_consumers_1 = require("../spec/requirement-consumers");
let CredentialSavePolicyGate = class CredentialSavePolicyGate {
    constructor(policyEnforcementService, logger) {
        this.policyEnforcementService = policyEnforcementService;
        this.logger = logger;
    }
    async refusedStubs(request, resolution, projectId, actor) {
        if (!this.policyEnforcementService.hasChecksFor('credentialSave'))
            return [];
        const refused = [];
        for (const { sourceId, name, type } of (0, credential_missing_mode_1.credentialsToStub)(request.missingMode, resolution)) {
            if (type === undefined)
                continue;
            try {
                await this.policyEnforcementService.enforceCredentialSave({ credential: { id: null, type }, storedCredential: null, projectId }, actor);
            }
            catch (error) {
                if (!(error instanceof policy_violation_error_1.PolicyViolationError))
                    throw error;
                this.logger.warn(`Credential "${name ?? sourceId}" is blocked by the credential-save policy`, { violations: error.violations });
                refused.push({
                    type: 'credential-policy-violation',
                    sourceId,
                    ...(name !== undefined ? { name } : {}),
                    credentialType: type,
                    usedBy: (0, requirement_consumers_1.mergeRequirementConsumers)(request.requirements?.find(({ id }) => id === sourceId)?.usedBy ?? []),
                    violations: error.violations,
                });
            }
        }
        return refused;
    }
};
exports.CredentialSavePolicyGate = CredentialSavePolicyGate;
exports.CredentialSavePolicyGate = CredentialSavePolicyGate = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [policy_enforcement_service_1.PolicyEnforcementService, backend_common_1.Logger])
], CredentialSavePolicyGate);
//# sourceMappingURL=credential-save-policy.js.map