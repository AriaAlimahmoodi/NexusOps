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
exports.InstanceAiPendingAgentService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const errors_1 = require("@n8n/errors");
const agent_default_model_resolver_service_1 = require("../../modules/agents/agent-default-model-resolver.service");
const agent_runnable_state_service_1 = require("../../modules/agents/agent-runnable-state.service");
const agents_service_1 = require("../../modules/agents/agents.service");
const check_access_1 = require("../../permissions.ee/check-access");
const agents_access_1 = require("./agents-access");
const instance_ai_memory_service_1 = require("./instance-ai-memory.service");
let InstanceAiPendingAgentService = class InstanceAiPendingAgentService {
    constructor(memoryService, moduleRegistry) {
        this.memoryService = memoryService;
        this.moduleRegistry = moduleRegistry;
    }
    agentsModule() {
        if (!(0, agents_access_1.isAgentsAccessEnabled)(this.moduleRegistry)) {
            throw new errors_1.NotFoundError('Agents are not enabled on this instance');
        }
        return {
            agents: di_1.Container.get(agents_service_1.AgentsService),
            runnableState: di_1.Container.get(agent_runnable_state_service_1.AgentRunnableStateService),
            defaultModelResolver: di_1.Container.get(agent_default_model_resolver_service_1.AgentDefaultModelResolverService),
        };
    }
    async persistAndBind(user, threadId, { projectId, agentId, name }) {
        const { agents, runnableState } = this.agentsModule();
        const threadProjectId = await this.memoryService.getThreadProjectId(threadId);
        if (threadProjectId !== undefined && threadProjectId !== projectId) {
            throw new errors_1.ForbiddenError('This agent belongs to a different project than the thread');
        }
        const adoptable = await this.mayAdopt(user, threadId, { projectId, agentId });
        const existing = await agents.findById(agentId, projectId);
        if (existing && !adoptable) {
            throw new errors_1.ForbiddenError('This thread has no pending agent with that id');
        }
        await this.assertMayWrite(user, projectId, { adopting: Boolean(existing) || adoptable });
        const agent = existing ?? (await this.createAgent(user, { projectId, agentId, name }, adoptable));
        const thread = await this.memoryService.bindAgentBuilderTarget(user.id, threadId, {
            agentId: agent.id,
            projectId,
            name: agent.name,
        });
        return {
            agent: await runnableState.addRunnableState(agent, projectId, user),
            thread,
        };
    }
    async createAgent(user, { projectId, agentId, name }, adoptOnCollision) {
        const { agents, defaultModelResolver } = this.agentsModule();
        const defaultModel = await defaultModelResolver.resolve(user, projectId);
        return await agents.create(projectId, name, {
            actor: { kind: 'user', user },
            id: agentId,
            adoptOnCollision,
            ...(defaultModel ? { defaultModel } : {}),
        });
    }
    async mayAdopt(user, threadId, target) {
        const metadata = await this.memoryService.getThreadMetadata(user.id, threadId);
        return (0, instance_ai_1.threadAuthorizesAgentAdoption)(metadata, target);
    }
    async assertMayWrite(user, projectId, { adopting }) {
        const scopes = adopting ? ['agent:create', 'agent:update'] : ['agent:create'];
        if (!(await (0, check_access_1.userHasScopes)(user, scopes, false, { projectId }))) {
            throw new errors_1.ForbiddenError('You do not have permission to create agents in this project.');
        }
    }
};
exports.InstanceAiPendingAgentService = InstanceAiPendingAgentService;
exports.InstanceAiPendingAgentService = InstanceAiPendingAgentService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [instance_ai_memory_service_1.InstanceAiMemoryService, backend_common_1.ModuleRegistry])
], InstanceAiPendingAgentService);
//# sourceMappingURL=instance-ai-pending-agent.service.js.map