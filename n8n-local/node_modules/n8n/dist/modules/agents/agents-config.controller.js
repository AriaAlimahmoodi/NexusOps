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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsConfigController = void 0;
const api_types_1 = require("@n8n/api-types");
const agents_1 = require("@n8n/agents");
const decorators_1 = require("@n8n/decorators");
const agents_credential_provider_1 = require("./adapters/agents-credential-provider");
const agent_config_service_1 = require("./agent-config.service");
const agent_custom_tools_service_1 = require("./agent-custom-tools.service");
const agent_validation_service_1 = require("./agent-validation.service");
const budget_guardrail_1 = require("./budget-guardrail");
const agent_repository_1 = require("./repositories/agent.repository");
const agent_config_hash_1 = require("./utils/agent-config-hash");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
const credentials_service_1 = require("../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
let AgentsConfigController = class AgentsConfigController {
    constructor(agentConfigService, agentCustomToolsService, agentValidationService, credentialsService, agentRepository, collaborationService, agentSpendLedger) {
        this.agentConfigService = agentConfigService;
        this.agentCustomToolsService = agentCustomToolsService;
        this.agentValidationService = agentValidationService;
        this.credentialsService = credentialsService;
        this.agentRepository = agentRepository;
        this.collaborationService = collaborationService;
        this.agentSpendLedger = agentSpendLedger;
    }
    async getBudget(req) {
        const { projectId, agentId } = req.params;
        const exists = await this.agentRepository.existsByIdAndProjectId(agentId, projectId);
        if (!exists) {
            throw new errors_1.NotFoundError('Agent not found');
        }
        const spentUsd = await this.agentSpendLedger.read((0, agents_1.budgetMonthKey)(agentId));
        return { spentUsd };
    }
    async getConfig(req) {
        const { projectId, agentId } = req.params;
        const config = await this.agentConfigService.getConfig(agentId, projectId);
        return { config, configHash: (0, agent_config_hash_1.getAgentConfigHash)(config) };
    }
    async getValidation(req) {
        const { projectId, agentId } = req.params;
        const agent = await this.agentRepository.findByIdAndProjectId(agentId, projectId);
        if (!agent) {
            throw new errors_1.NotFoundError('Agent not found');
        }
        const credentialProvider = new agents_credential_provider_1.AgentsCredentialProvider(this.credentialsService, projectId, req.user, agentId);
        return await this.agentValidationService.validateLoadedAgentConfiguration(agent, projectId, credentialProvider);
    }
    async putConfig(req, _res, agentId, payload) {
        const { projectId } = req.params;
        const { config, baseConfigHash } = payload;
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, projectId, agentId, 'update');
        return await this.agentConfigService.updateConfig(agentId, projectId, config, req.user, {
            baseConfigHash,
            modifiedBy: 'user',
            pushRef: req.headers?.['push-ref'],
        });
    }
    async deleteTool(req, _res, agentId, toolId) {
        const { projectId } = req.params;
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, projectId, agentId, 'delete');
        await this.agentCustomToolsService.deleteCustomTool(agentId, projectId, toolId, {
            user: req.user,
            modifiedBy: 'user',
            pushRef: req.headers?.['push-ref'],
        });
        return { ok: true };
    }
};
exports.AgentsConfigController = AgentsConfigController;
__decorate([
    (0, decorators_1.Get)('/:agentId/budget'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentsConfigController.prototype, "getBudget", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/config'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentsConfigController.prototype, "getConfig", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/validation'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentsConfigController.prototype, "getValidation", null);
__decorate([
    (0, decorators_1.Put)('/:agentId/config'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateAgentConfigDto]),
    __metadata("design:returntype", Promise)
], AgentsConfigController.prototype, "putConfig", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/tools/:toolId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('toolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentsConfigController.prototype, "deleteTool", null);
exports.AgentsConfigController = AgentsConfigController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_config_service_1.AgentConfigService, agent_custom_tools_service_1.AgentCustomToolsService, agent_validation_service_1.AgentValidationService, credentials_service_1.CredentialsService, agent_repository_1.AgentRepository, collaboration_service_1.CollaborationService, budget_guardrail_1.AgentSpendLedger])
], AgentsConfigController);
//# sourceMappingURL=agents-config.controller.js.map