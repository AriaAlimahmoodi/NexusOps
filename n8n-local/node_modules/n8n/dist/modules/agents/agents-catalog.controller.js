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
exports.AgentsCatalogController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const agent_integration_persistence_service_1 = require("./agent-integration-persistence.service");
const agent_model_catalog_service_1 = require("./agent-model-catalog.service");
const model_catalog_1 = require("./model-catalog");
let AgentsCatalogController = class AgentsCatalogController {
    constructor(agentIntegrationPersistenceService, agentModelCatalogService) {
        this.agentIntegrationPersistenceService = agentIntegrationPersistenceService;
        this.agentModelCatalogService = agentModelCatalogService;
    }
    async getModelCatalog() {
        const { fetchProviderCatalog } = await import('@n8n/agents');
        return (0, model_catalog_1.filterOfferedAgentModelProviders)(await fetchProviderCatalog());
    }
    async getProviderModels(req, _res, provider, query) {
        if (!(0, api_types_1.isAgentModelProvider)(provider)) {
            throw new errors_1.BadRequestError(`Unknown model provider "${provider}"`);
        }
        return await this.agentModelCatalogService.getProviderModels(req.user, req.params.projectId, provider, query.credentialId);
    }
    listIntegrations() {
        return this.agentIntegrationPersistenceService.listChatIntegrations();
    }
};
exports.AgentsCatalogController = AgentsCatalogController;
__decorate([
    (0, decorators_1.Get)('/catalog/models'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentsCatalogController.prototype, "getModelCatalog", null);
__decorate([
    (0, decorators_1.Get)('/catalog/models/:provider'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('provider')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AgentProviderModelsQueryDto]),
    __metadata("design:returntype", Promise)
], AgentsCatalogController.prototype, "getProviderModels", null);
__decorate([
    (0, decorators_1.Get)('/catalog/integrations'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], AgentsCatalogController.prototype, "listIntegrations", null);
exports.AgentsCatalogController = AgentsCatalogController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_integration_persistence_service_1.AgentIntegrationPersistenceService, agent_model_catalog_service_1.AgentModelCatalogService])
], AgentsCatalogController);
//# sourceMappingURL=agents-catalog.controller.js.map