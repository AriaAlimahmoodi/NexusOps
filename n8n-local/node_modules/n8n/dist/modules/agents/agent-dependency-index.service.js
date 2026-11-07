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
exports.AgentDependencyIndexService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const agent_runtime_cache_service_1 = require("./agent-runtime-cache.service");
const agent_credential_dependency_repository_1 = require("./repositories/agent-credential-dependency.repository");
const agent_workflow_dependency_repository_1 = require("./repositories/agent-workflow-dependency.repository");
const agent_repository_1 = require("./repositories/agent.repository");
let AgentDependencyIndexService = class AgentDependencyIndexService {
    constructor(credentialDependencyRepository, workflowDependencyRepository, agentRepository, runtimeCache, logger, workflowsConfig) {
        this.credentialDependencyRepository = credentialDependencyRepository;
        this.workflowDependencyRepository = workflowDependencyRepository;
        this.agentRepository = agentRepository;
        this.runtimeCache = runtimeCache;
        this.logger = logger.scoped('agents');
        this.batchSize = workflowsConfig.indexingBatchSize;
    }
    async remove(agentId) {
        await this.credentialDependencyRepository.removeForAgent(agentId);
        await this.workflowDependencyRepository.removeForAgent(agentId);
    }
    async refresh(agentId) {
        await this.credentialDependencyRepository.refreshForAgent(agentId);
        await this.workflowDependencyRepository.refreshForAgent(agentId);
    }
    async invalidateRuntimesForWorkflow(workflowId) {
        const dependencies = await this.workflowDependencyRepository.findByWorkflowIds([workflowId]);
        for (const { agentId } of dependencies)
            this.runtimeCache.clearRuntimes(agentId);
    }
    async invalidateRuntimesForCredential(credentialId) {
        const credentials = await this.credentialDependencyRepository.findByCredentialIds([
            credentialId,
        ]);
        for (const { agentId } of credentials)
            this.runtimeCache.clearRuntimes(agentId);
    }
    async buildIndex() {
        let afterId = null;
        while (true) {
            const agents = await this.agentRepository.findDependencyIndexAgentIdsBatch(afterId, this.batchSize);
            for (const { id: agentId } of agents) {
                try {
                    await this.refresh(agentId);
                }
                catch (error) {
                    this.logger.error('Failed to index agent dependencies', { agentId, error });
                }
            }
            if (agents.length < this.batchSize)
                return;
            const lastAgent = agents[agents.length - 1];
            if (lastAgent === undefined)
                return;
            afterId = lastAgent.id;
        }
    }
};
exports.AgentDependencyIndexService = AgentDependencyIndexService;
exports.AgentDependencyIndexService = AgentDependencyIndexService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_credential_dependency_repository_1.AgentCredentialDependencyRepository, agent_workflow_dependency_repository_1.AgentWorkflowDependencyRepository, agent_repository_1.AgentRepository, agent_runtime_cache_service_1.AgentRuntimeCacheService, backend_common_1.Logger, config_1.WorkflowsConfig])
], AgentDependencyIndexService);
//# sourceMappingURL=agent-dependency-index.service.js.map