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
exports.AgentsSkillsController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const agent_skills_service_1 = require("./agent-skills.service");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
let AgentsSkillsController = class AgentsSkillsController {
    constructor(agentSkillsService, collaborationService) {
        this.agentSkillsService = agentSkillsService;
        this.collaborationService = collaborationService;
    }
    async listSkills(req) {
        const { projectId, agentId } = req.params;
        return await this.agentSkillsService.listSkills(agentId, projectId);
    }
    async getSkill(req, _res, agentId, skillId) {
        const { projectId } = req.params;
        return await this.agentSkillsService.getSkill(agentId, projectId, skillId);
    }
    async createSkill(req, _res, agentId, payload) {
        const { projectId } = req.params;
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, projectId, agentId, 'create skill for');
        const { availableTo, method, ...skill } = payload;
        return await this.agentSkillsService.createAndAttachSkill(agentId, projectId, skill, {
            user: req.user,
            modifiedBy: 'user',
            pushRef: req.headers?.['push-ref'],
        }, availableTo, method);
    }
    async updateSkill(req, _res, agentId, skillId, payload) {
        const { projectId } = req.params;
        const { baseSkillHash, availableTo, ...updates } = payload;
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, projectId, agentId, 'update skill for');
        return await this.agentSkillsService.updateSkill(agentId, projectId, skillId, updates, {
            user: req.user,
            modifiedBy: 'user',
            pushRef: req.headers?.['push-ref'],
        }, baseSkillHash, undefined, availableTo);
    }
    async deleteSkill(req, _res, agentId, skillId) {
        const { projectId } = req.params;
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, projectId, agentId, 'delete skill for');
        await this.agentSkillsService.deleteSkill(agentId, projectId, skillId, {
            user: req.user,
            modifiedBy: 'user',
            pushRef: req.headers?.['push-ref'],
        });
        return { ok: true };
    }
};
exports.AgentsSkillsController = AgentsSkillsController;
__decorate([
    (0, decorators_1.Get)('/:agentId/skills'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentsSkillsController.prototype, "listSkills", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/skills/:skillId'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('skillId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentsSkillsController.prototype, "getSkill", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/skills'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.CreateAgentSkillDto]),
    __metadata("design:returntype", Promise)
], AgentsSkillsController.prototype, "createSkill", null);
__decorate([
    (0, decorators_1.Patch)('/:agentId/skills/:skillId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('skillId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.UpdateAttachedAgentSkillDto]),
    __metadata("design:returntype", Promise)
], AgentsSkillsController.prototype, "updateSkill", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/skills/:skillId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('skillId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentsSkillsController.prototype, "deleteSkill", null);
exports.AgentsSkillsController = AgentsSkillsController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_skills_service_1.AgentSkillsService, collaboration_service_1.CollaborationService])
], AgentsSkillsController);
//# sourceMappingURL=agents-skills.controller.js.map