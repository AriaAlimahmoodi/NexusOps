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
exports.AgentSetupCompletionService = void 0;
const di_1 = require("@n8n/di");
const telemetry_1 = require("@n8n/telemetry");
const telemetry_2 = require("../../telemetry");
const agent_validation_service_1 = require("./agent-validation.service");
const agent_document_1 = require("./json-config/agent-document");
const agent_repository_1 = require("./repositories/agent.repository");
const agent_capabilities_1 = require("./utils/agent-capabilities");
let AgentSetupCompletionService = class AgentSetupCompletionService {
    constructor(agentValidationService, telemetry, agentRepository) {
        this.agentValidationService = agentValidationService;
        this.telemetry = telemetry;
        this.agentRepository = agentRepository;
    }
    async recordIfSetupComplete(agent, skillRefs, projectId, credentialProvider, user) {
        const config = agent.schema ? (0, agent_document_1.toAgentDocument)(agent.schema, skillRefs) : null;
        const counts = (0, agent_capabilities_1.countAgentCapabilities)(config, agent.integrations);
        if (!this.isPending(agent, counts))
            return null;
        const validation = await this.agentValidationService.validateLoadedAgentConfiguration(agent, projectId, credentialProvider, 'publish', { skillRefs });
        if (validation.status !== 'valid')
            return null;
        return this.claim(agent, projectId, counts, user);
    }
    recordPublishedSetupComplete(agent, projectId, user, config) {
        const counts = (0, agent_capabilities_1.countAgentCapabilities)(config, agent.integrations);
        if (!this.isPending(agent, counts))
            return null;
        return this.claim(agent, projectId, counts, user);
    }
    isPending(agent, counts) {
        return !agent.setupCompletedAt && (0, agent_capabilities_1.totalAgentCapabilities)(counts) > 0;
    }
    claim(agent, projectId, counts, user) {
        return async () => {
            try {
                const completedAt = new Date();
                const claimed = await this.agentRepository.claimSetupCompleted(agent.id, completedAt);
                if (!claimed)
                    return;
                agent.setupCompletedAt = completedAt;
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.AGENT_SETUP_COMPLETED, {
                    agent_id: agent.id,
                    project_id: projectId,
                    ...(user ? { user_id: user.id } : {}),
                    ...(0, agent_capabilities_1.capabilityCountTelemetryProperties)(counts),
                    status: agent.activeVersionId && agent.versionId === agent.activeVersionId
                        ? 'production'
                        : 'draft',
                });
            }
            catch {
            }
        };
    }
};
exports.AgentSetupCompletionService = AgentSetupCompletionService;
exports.AgentSetupCompletionService = AgentSetupCompletionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_validation_service_1.AgentValidationService, telemetry_2.Telemetry, agent_repository_1.AgentRepository])
], AgentSetupCompletionService);
//# sourceMappingURL=agent-setup-completion.service.js.map