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
exports.AgentVectorStoresController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const agent_vector_stores_service_1 = require("./agent-vector-stores.service");
let AgentVectorStoresController = class AgentVectorStoresController {
    constructor(agentVectorStoresService) {
        this.agentVectorStoresService = agentVectorStoresService;
    }
    async testConnection(req, _res, payload) {
        const { projectId } = req.params;
        return await this.agentVectorStoresService.testConnection(projectId, req.user, payload.vectorStore);
    }
};
exports.AgentVectorStoresController = AgentVectorStoresController;
__decorate([
    (0, decorators_1.Post)('/vector-stores/test'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.TestAgentVectorStoreDto]),
    __metadata("design:returntype", Promise)
], AgentVectorStoresController.prototype, "testConnection", null);
exports.AgentVectorStoresController = AgentVectorStoresController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_vector_stores_service_1.AgentVectorStoresService])
], AgentVectorStoresController);
//# sourceMappingURL=agent-vector-stores.controller.js.map