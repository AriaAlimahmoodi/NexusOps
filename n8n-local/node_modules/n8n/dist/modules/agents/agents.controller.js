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
exports.AgentsController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
const agent_runnable_state_service_1 = require("./agent-runnable-state.service");
const agent_default_model_resolver_service_1 = require("./agent-default-model-resolver.service");
const agents_service_1 = require("./agents.service");
let AgentsController = class AgentsController {
    constructor(agentsService, agentRunnableStateService, agentDefaultModelResolverService, collaborationService) {
        this.agentsService = agentsService;
        this.agentRunnableStateService = agentRunnableStateService;
        this.agentDefaultModelResolverService = agentDefaultModelResolverService;
        this.collaborationService = collaborationService;
    }
    async create(req, _res, payload) {
        const { projectId } = req.params;
        const isDuplicate = Boolean(payload.schema);
        const defaultModel = isDuplicate
            ? undefined
            : await this.agentDefaultModelResolverService.resolve(req.user, projectId);
        const agent = await this.agentsService.create(projectId, payload.name, {
            actor: { kind: 'user', user: req.user },
            id: payload.id,
            ...(defaultModel ? { defaultModel } : {}),
            ...(isDuplicate && payload.schema
                ? {
                    schema: { ...payload.schema, name: payload.name },
                    skills: payload.skills,
                    tools: payload.tools,
                    user: req.user,
                }
                : {}),
        });
        return await this.agentRunnableStateService.addRunnableState(agent, projectId, req.user);
    }
    async list(req, res, query) {
        res.json(await this.agentsService.findByProjectIdPaginated(req.params.projectId, query));
    }
    async get(req, _res, agentId) {
        const agent = await this.agentsService.findById(agentId, req.params.projectId);
        if (!agent) {
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        }
        return await this.agentRunnableStateService.addRunnableState(agent, req.params.projectId, req.user);
    }
    async getSummary(req) {
        const { projectId, agentId } = req.params;
        return await this.agentsService.getCapabilitySummary(agentId, projectId);
    }
    async delete(req, _res, agentId) {
        const deleted = await this.agentsService.delete(agentId, req.params.projectId);
        if (!deleted) {
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        }
        return { success: true };
    }
    async getWriteLock(req, _res, agentId) {
        return await this.collaborationService.getAgentWriteLock(req.params.projectId, agentId);
    }
};
exports.AgentsController = AgentsController;
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ProjectScope)('agent:create'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateAgentDto]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "create", null);
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ProjectScope)('agent:list'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListAgentsQueryDto]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "list", null);
__decorate([
    (0, decorators_1.Get)('/:agentId'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "get", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/summary'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "getSummary", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId'),
    (0, decorators_1.ProjectScope)('agent:delete'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "delete", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/collaboration/write-lock'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "getWriteLock", null);
exports.AgentsController = AgentsController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agents_service_1.AgentsService, agent_runnable_state_service_1.AgentRunnableStateService, agent_default_model_resolver_service_1.AgentDefaultModelResolverService, collaboration_service_1.CollaborationService])
], AgentsController);
//# sourceMappingURL=agents.controller.js.map