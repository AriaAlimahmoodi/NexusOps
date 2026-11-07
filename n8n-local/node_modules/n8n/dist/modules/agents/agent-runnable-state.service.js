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
exports.AgentRunnableStateService = void 0;
const di_1 = require("@n8n/di");
const credentials_service_1 = require("../../credentials/credentials.service");
const agents_credential_provider_1 = require("./adapters/agents-credential-provider");
const agent_publish_service_1 = require("./agent-publish.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_validation_service_1 = require("./agent-validation.service");
const agent_config_composition_1 = require("./json-config/agent-config-composition");
const agent_config_hash_1 = require("./utils/agent-config-hash");
let AgentRunnableStateService = class AgentRunnableStateService {
    constructor(credentialsService, agentValidationService, agentPublishService, agentSkillRefs) {
        this.credentialsService = credentialsService;
        this.agentValidationService = agentValidationService;
        this.agentPublishService = agentPublishService;
        this.agentSkillRefs = agentSkillRefs;
    }
    async addRunnableState(agent, projectId, user, draftValidation) {
        const { skillRefs, skills } = await this.agentSkillRefs.readDraft(agent, {});
        const configHash = (0, agent_config_hash_1.getAgentConfigHash)((0, agent_config_composition_1.composeJsonConfig)(agent, skillRefs));
        const skillHashes = Object.fromEntries(Object.entries(skills).map(([id, skill]) => [id, (0, agent_config_hash_1.getAgentSkillHash)(skill)]));
        const outdatedSkillIds = await this.agentSkillRefs.findOutdatedSkillIds(skillRefs, skills, {});
        if (draftValidation) {
            const hasPublishHistory = await this.agentPublishService.hasPublishHistory(agent.id);
            return Object.assign(agent, {
                isRunnable: true,
                hasPublishHistory,
                configHash,
                skills,
                skillHashes,
                outdatedSkillIds,
            });
        }
        const credentialProvider = new agents_credential_provider_1.AgentsCredentialProvider(this.credentialsService, projectId, user, agent.id);
        const [validation, hasPublishHistory] = await Promise.all([
            this.agentValidationService.validateLoadedAgentConfiguration(agent, projectId, credentialProvider, 'runtime'),
            this.agentPublishService.hasPublishHistory(agent.id),
        ]);
        return Object.assign(agent, {
            isRunnable: validation.status === 'valid',
            hasPublishHistory,
            configHash,
            skills,
            skillHashes,
            outdatedSkillIds,
        });
    }
};
exports.AgentRunnableStateService = AgentRunnableStateService;
exports.AgentRunnableStateService = AgentRunnableStateService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService, agent_validation_service_1.AgentValidationService, agent_publish_service_1.AgentPublishService, agent_skill_refs_service_1.AgentSkillRefsService])
], AgentRunnableStateService);
//# sourceMappingURL=agent-runnable-state.service.js.map