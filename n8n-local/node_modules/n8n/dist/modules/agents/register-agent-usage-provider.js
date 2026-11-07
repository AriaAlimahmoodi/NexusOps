"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAgentUsageProvider = registerAgentUsageProvider;
const di_1 = require("@n8n/di");
const agent_usage_provider_proxy_service_1 = require("../../modules/workflow-index/agent-usage-provider-proxy.service");
const agent_credential_dependency_repository_1 = require("./repositories/agent-credential-dependency.repository");
const agent_workflow_dependency_repository_1 = require("./repositories/agent-workflow-dependency.repository");
const agent_repository_1 = require("./repositories/agent.repository");
function registerAgentUsageProvider() {
    const credentialDependencyRepository = di_1.Container.get(agent_credential_dependency_repository_1.AgentCredentialDependencyRepository);
    const workflowDependencyRepository = di_1.Container.get(agent_workflow_dependency_repository_1.AgentWorkflowDependencyRepository);
    const agentRepository = di_1.Container.get(agent_repository_1.AgentRepository);
    di_1.Container.get(agent_usage_provider_proxy_service_1.AgentUsageProviderProxy).registerProvider({
        async findAgentUsages(resourceType, resourceIds) {
            if (resourceType === 'credential') {
                const dependencies = await credentialDependencyRepository.findByCredentialIds(resourceIds);
                return dependencies.map(({ agentId, credentialId }) => ({
                    agentId,
                    resourceId: credentialId,
                }));
            }
            if (resourceType === 'workflow') {
                const dependencies = await workflowDependencyRepository.findByWorkflowIds(resourceIds);
                return dependencies.map(({ agentId, workflowId }) => ({
                    agentId,
                    resourceId: workflowId,
                }));
            }
            return [];
        },
        findAgentSummaries: async (agentIds) => await agentRepository.findSummariesByIds(agentIds),
    });
}
//# sourceMappingURL=register-agent-usage-provider.js.map