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
exports.AgentPolicyService = void 0;
const di_1 = require("@n8n/di");
const policed_agent_nodes_1 = require("../../policy/policed-agent-nodes");
const policy_enforcement_service_1 = require("../../policy/policy-enforcement.service");
function policedWorkflowForAgent(agentId, content) {
    return {
        id: agentId,
        name: content.name,
        nodes: (0, policed_agent_nodes_1.toPolicedNodes)(content.tools),
        artifactKind: 'agent',
    };
}
let AgentPolicyService = class AgentPolicyService {
    constructor(policyEnforcementService) {
        this.policyEnforcementService = policyEnforcementService;
    }
    async enforceSave(projectId, agentId, content, stored, actor) {
        await this.policyEnforcementService.enforceWorkflowSave({
            workflow: policedWorkflowForAgent(agentId, content),
            storedWorkflow: stored === null ? null : policedWorkflowForAgent(agentId, stored),
            projectId,
        }, actor);
    }
    async enforcePublish(projectId, agentId, content, actor) {
        await this.policyEnforcementService.enforceWorkflowPublish({ workflow: policedWorkflowForAgent(agentId, content), projectId }, actor);
    }
};
exports.AgentPolicyService = AgentPolicyService;
exports.AgentPolicyService = AgentPolicyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [policy_enforcement_service_1.PolicyEnforcementService])
], AgentPolicyService);
//# sourceMappingURL=agent-policy.service.js.map