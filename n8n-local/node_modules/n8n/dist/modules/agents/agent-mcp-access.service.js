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
exports.AgentMcpAccessService = void 0;
const di_1 = require("@n8n/di");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const agent_repository_1 = require("./repositories/agent.repository");
const BULK_CHUNK_SIZE = 500;
let AgentMcpAccessService = class AgentMcpAccessService {
    constructor(agentRepository, projectScopeService, collaborationService) {
        this.agentRepository = agentRepository;
        this.projectScopeService = projectScopeService;
        this.collaborationService = collaborationService;
    }
    async getAgents(user, options) {
        const projectIds = await this.projectScopeService.getProjectIds(user, ['agent:update']);
        return await this.agentRepository.findByProjectIdsPaginated(projectIds, {
            ...options,
            filter: {
                ...options.filter,
                availableInMCP: options.filter?.availableInMCP ?? false,
            },
        }, { withProject: true });
    }
    async bulkSetAvailableInMCP(user, dto, pushRef) {
        const targets = [dto.agentIds, dto.projectId, dto.allAgents].filter((target) => target !== undefined);
        if (targets.length !== 1) {
            throw new errors_1.BadRequestError('Provide exactly one of "agentIds", "projectId", or "allAgents".');
        }
        const projectIds = await this.projectScopeService.getProjectIds(user, ['agent:update']);
        const allowedProjectIds = projectIds === null ? null : new Set(projectIds);
        if (dto.projectId && allowedProjectIds !== null && !allowedProjectIds.has(dto.projectId)) {
            return { updatedCount: 0 };
        }
        const candidates = await this.resolveCandidates(dto, projectIds);
        const accessible = allowedProjectIds === null
            ? candidates
            : candidates.filter((agent) => allowedProjectIds.has(agent.projectId));
        const toUpdate = accessible.filter((agent) => agent.availableInMCP !== dto.availableInMCP);
        const agentIds = toUpdate.map((agent) => agent.id);
        for (let start = 0; start < agentIds.length; start += BULK_CHUNK_SIZE) {
            await this.collaborationService.validateAgentWriteLocks(user.id, pushRef, agentIds.slice(start, start + BULK_CHUNK_SIZE), 'toggle MCP availability for');
        }
        for (let start = 0; start < agentIds.length; start += BULK_CHUNK_SIZE) {
            await this.agentRepository.setAvailableInMCP(agentIds.slice(start, start + BULK_CHUNK_SIZE), dto.availableInMCP);
        }
        return {
            updatedCount: toUpdate.length,
            ...(dto.agentIds
                ? {
                    updatedIds: agentIds,
                    unchangedIds: accessible
                        .filter((agent) => agent.availableInMCP === dto.availableInMCP)
                        .map((agent) => agent.id),
                }
                : {}),
        };
    }
    async resolveCandidates(dto, projectIds) {
        if (dto.agentIds) {
            return await this.agentRepository.findMcpAvailabilityCandidates({
                ids: [...new Set(dto.agentIds)],
            });
        }
        if (dto.projectId) {
            return await this.agentRepository.findMcpAvailabilityCandidates({
                projectIds: [dto.projectId],
            });
        }
        return await this.agentRepository.findMcpAvailabilityCandidates(projectIds === null ? { all: true } : { projectIds });
    }
};
exports.AgentMcpAccessService = AgentMcpAccessService;
exports.AgentMcpAccessService = AgentMcpAccessService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_repository_1.AgentRepository, backend_services_1.ProjectScopeService, collaboration_service_1.CollaborationService])
], AgentMcpAccessService);
//# sourceMappingURL=agent-mcp-access.service.js.map