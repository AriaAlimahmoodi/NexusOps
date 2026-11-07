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
exports.AgentMcpAccessController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const agent_mcp_access_service_1 = require("./agent-mcp-access.service");
let AgentMcpAccessController = class AgentMcpAccessController {
    constructor(agentMcpAccessService) {
        this.agentMcpAccessService = agentMcpAccessService;
    }
    async getMcpAgents(req, res, query) {
        res.json(await this.agentMcpAccessService.getAgents(req.user, query));
    }
    async toggleAgentsMCPAccess(req, _res, dto) {
        return await this.agentMcpAccessService.bulkSetAvailableInMCP(req.user, dto, req.headers?.['push-ref']);
    }
};
exports.AgentMcpAccessController = AgentMcpAccessController;
__decorate([
    (0, decorators_1.Get)('/'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListAgentsQueryDto]),
    __metadata("design:returntype", Promise)
], AgentMcpAccessController.prototype, "getMcpAgents", null);
__decorate([
    (0, decorators_1.Patch)('/toggle-access'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateAgentsMcpAvailabilityDto]),
    __metadata("design:returntype", Promise)
], AgentMcpAccessController.prototype, "toggleAgentsMCPAccess", null);
exports.AgentMcpAccessController = AgentMcpAccessController = __decorate([
    (0, decorators_1.RestController)('/mcp/agents'),
    __metadata("design:paramtypes", [agent_mcp_access_service_1.AgentMcpAccessService])
], AgentMcpAccessController);
//# sourceMappingURL=agent-mcp-access.controller.js.map