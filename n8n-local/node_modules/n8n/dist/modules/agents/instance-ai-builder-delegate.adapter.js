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
exports.InstanceAiBuilderDelegateAdapterService = void 0;
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const check_access_1 = require("../../permissions.ee/check-access");
const agent_config_service_1 = require("./agent-config.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_skills_service_1 = require("./agent-skills.service");
const agent_validation_service_1 = require("./agent-validation.service");
const agents_service_1 = require("./agents.service");
const agents_settings_service_1 = require("./agents-settings.service");
const agent_builder_session_context_1 = require("./builder/agent-builder-session-context");
const agents_builder_tools_service_1 = require("./builder/agents-builder-tools.service");
const skills_1 = require("./builder/skills");
const n8n_memory_1 = require("./integrations/n8n-memory");
const agent_document_1 = require("./json-config/agent-document");
const agent_thread_repository_1 = require("./repositories/agent-thread.repository");
const agent_capabilities_1 = require("./utils/agent-capabilities");
const agent_config_hash_1 = require("./utils/agent-config-hash");
const TOOLS_PROVIDED_BY_INSTANCE_AI = ['agent-context'];
let InstanceAiBuilderDelegateAdapterService = class InstanceAiBuilderDelegateAdapterService {
    constructor(agentsService, agentsBuilderToolsService, n8nMemory, agentThreadRepository, agentConfig, agentSkills, agentsSettingsService, agentValidation, agentSkillRefs) {
        this.agentsService = agentsService;
        this.agentsBuilderToolsService = agentsBuilderToolsService;
        this.n8nMemory = n8nMemory;
        this.agentThreadRepository = agentThreadRepository;
        this.agentConfig = agentConfig;
        this.agentSkills = agentSkills;
        this.agentsSettingsService = agentsSettingsService;
        this.agentValidation = agentValidation;
        this.agentSkillRefs = agentSkillRefs;
    }
    createDelegate(user, projectId, credentialProviderFor, credentialService, options = {}) {
        const assertProjectScope = async (...scopes) => {
            if (!(await (0, check_access_1.userHasScopes)(user, scopes, false, { projectId }))) {
                throw new errors_1.ForbiddenError('You do not have permission to access agents in this project.');
            }
        };
        const assertAccess = async (...scopes) => {
            await this.agentsSettingsService.assertEnabled();
            await assertProjectScope(...scopes);
        };
        return {
            createAgent: async (name, createOptions) => {
                await assertAccess(...(createOptions?.adoptOnCollision
                    ? ['agent:create', 'agent:update']
                    : ['agent:create']));
                const { agent, adopted } = await this.agentsService.createOrAdopt(projectId, name, {
                    ...createOptions,
                    actor: { kind: 'user', user },
                });
                return { agentId: agent.id, projectId, name: agent.name, adopted };
            },
            getBuilderTools: (resolveTargetAgentId, session) => this.agentsBuilderToolsService.getToolsForResolvedTarget(async (pinnedAgentId) => {
                await assertAccess('agent:update');
                if (pinnedAgentId)
                    return pinnedAgentId;
                const agentId = await resolveTargetAgentId();
                if (!agentId) {
                    throw new n8n_workflow_1.UserError('No agent is selected. Call agent_builder_select_agent before using the builder tools.');
                }
                return agentId;
            }, projectId, credentialProviderFor, credentialService, user, {
                threadId: session.threadId,
                runId: session.runId,
                ...(options.useEvalModelCatalog ? { useEvalModelCatalog: true } : {}),
                excludeToolNames: TOOLS_PROVIDED_BY_INSTANCE_AI,
            }),
            getRuntimeSkills: () => (0, skills_1.getBuilderRuntimeSkills)(),
            getBuilderSessionContext: async (agentId) => await (0, agent_builder_session_context_1.buildBuilderSessionContext)(projectId, agentId),
            resolveAgentName: async (agentId) => {
                await assertAccess('agent:read');
                return (await this.agentsService.findById(agentId, projectId))?.name;
            },
            readAgentArtifact: async (agentId) => {
                await assertAccess('agent:read');
                const config = await this.agentConfig.getConfig(agentId, projectId).catch((error) => {
                    if (error instanceof n8n_workflow_1.UserError)
                        return null;
                    throw error;
                });
                if (!config)
                    return null;
                return {
                    config,
                    skills: await this.agentSkills.listSkills(agentId, projectId),
                    configHash: (0, agent_config_hash_1.getAgentConfigHash)(config),
                };
            },
            validateAgent: async (agentId) => {
                await assertProjectScope('agent:read');
                const agent = await this.agentsService.findById(agentId, projectId);
                if (!agent)
                    return undefined;
                const skillRefs = await this.agentSkillRefs.refsForDraft(agent, {});
                const validation = await this.agentValidation.validateLoadedAgentConfiguration(agent, projectId, credentialProviderFor(agentId), 'publish', { skillRefs });
                const config = agent.schema ? (0, agent_document_1.toAgentDocument)(agent.schema, skillRefs) : null;
                return {
                    valid: validation.status === 'valid',
                    issueCodes: [...new Set(validation.issues.map((issue) => issue.code))].sort(),
                    issueCount: validation.issues.length,
                    capabilityCount: (0, agent_capabilities_1.totalAgentCapabilities)((0, agent_capabilities_1.countAgentCapabilities)(config, agent.integrations)),
                };
            },
        };
    }
    async deleteBuilderSessions(instanceAiThreadId) {
        const prefix = (0, instance_ai_1.instanceAiBuilderThreadPrefix)(instanceAiThreadId);
        const threads = await this.agentThreadRepository.find({
            select: { id: true },
            where: { id: (0, typeorm_1.Like)(`${prefix}%`) },
        });
        for (const { id } of threads) {
            const memory = this.n8nMemory.getImplementation(id.slice(prefix.length));
            await memory.deleteThread(id);
        }
    }
};
exports.InstanceAiBuilderDelegateAdapterService = InstanceAiBuilderDelegateAdapterService;
exports.InstanceAiBuilderDelegateAdapterService = InstanceAiBuilderDelegateAdapterService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agents_service_1.AgentsService, agents_builder_tools_service_1.AgentsBuilderToolsService, n8n_memory_1.N8nMemory, agent_thread_repository_1.AgentThreadRepository, agent_config_service_1.AgentConfigService, agent_skills_service_1.AgentSkillsService, agents_settings_service_1.AgentsSettingsService, agent_validation_service_1.AgentValidationService, agent_skill_refs_service_1.AgentSkillRefsService])
], InstanceAiBuilderDelegateAdapterService);
//# sourceMappingURL=instance-ai-builder-delegate.adapter.js.map