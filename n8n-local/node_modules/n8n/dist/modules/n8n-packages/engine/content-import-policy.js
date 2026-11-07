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
exports.ContentImportPolicyGate = void 0;
exports.contentImportTransport = contentImportTransport;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const policy_enforcement_service_1 = require("../../../policy/policy-enforcement.service");
const policy_violation_error_1 = require("../../../policy/policy-violation.error");
function contentImportTransport(source) {
    return source === 'git-pull' ? 'git-connection' : 'package';
}
let ContentImportPolicyGate = class ContentImportPolicyGate {
    constructor(policyEnforcementService, logger) {
        this.policyEnforcementService = policyEnforcementService;
        this.logger = logger;
    }
    async refusedWorkflows(items, projectId, transport, actor) {
        if (!this.policyEnforcementService.hasChecksFor('contentImport'))
            return [];
        const refused = [];
        for (const item of items) {
            if (item.action === 'skip')
                continue;
            try {
                await this.policyEnforcementService.enforceContentImport({
                    workflow: {
                        id: item.action === 'create' ? item.decidedId : item.existing.id,
                        name: item.entity.name,
                        nodes: item.entity.nodes,
                    },
                    projectId,
                    transport,
                }, actor);
            }
            catch (error) {
                if (!(error instanceof policy_violation_error_1.PolicyViolationError))
                    throw error;
                this.logger.warn(`Workflow "${item.entity.name}" is blocked by the content-import policy`, {
                    violations: error.violations,
                });
                refused.push({
                    type: 'policy-violation',
                    sourceWorkflowId: item.sourceWorkflowId,
                    name: item.entity.name,
                    violations: error.violations,
                });
            }
        }
        return refused;
    }
};
exports.ContentImportPolicyGate = ContentImportPolicyGate;
exports.ContentImportPolicyGate = ContentImportPolicyGate = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [policy_enforcement_service_1.PolicyEnforcementService, backend_common_1.Logger])
], ContentImportPolicyGate);
//# sourceMappingURL=content-import-policy.js.map