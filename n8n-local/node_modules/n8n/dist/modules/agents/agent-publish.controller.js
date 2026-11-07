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
exports.AgentPublishController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const agent_publish_service_1 = require("./agent-publish.service");
const agent_runnable_state_service_1 = require("./agent-runnable-state.service");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
let AgentPublishController = class AgentPublishController {
    constructor(agentPublishService, agentRunnableStateService, collaborationService) {
        this.agentPublishService = agentPublishService;
        this.agentRunnableStateService = agentRunnableStateService;
        this.collaborationService = collaborationService;
    }
    async publish(req, _res, agentId, payload) {
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, req.params.projectId, agentId, 'publish');
        const { agent, draftValidation } = await this.agentPublishService.publishAgent(agentId, req.params.projectId, req.user, { by: 'user', trigger: 'explicit' }, payload?.versionId, req.headers?.['push-ref']);
        return await this.agentRunnableStateService.addRunnableState(agent, req.params.projectId, req.user, draftValidation);
    }
    async unpublish(req, _res, agentId) {
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, req.params.projectId, agentId, 'unpublish');
        const agent = await this.agentPublishService.unpublishAgent(agentId, req.params.projectId, req.user, 'user', req.headers?.['push-ref']);
        return await this.agentRunnableStateService.addRunnableState(agent, req.params.projectId, req.user);
    }
    async revertToPublished(req, _res, agentId) {
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, req.params.projectId, agentId, 'revert to published');
        const agent = await this.agentPublishService.revertToPublishedAgent(agentId, req.params.projectId, req.user, 'user', req.headers?.['push-ref']);
        return await this.agentRunnableStateService.addRunnableState(agent, req.params.projectId, req.user);
    }
    async revertToVersion(req, _res, agentId, payload) {
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, req.params.projectId, agentId, 'revert to version');
        const agent = await this.agentPublishService.revertToVersion(agentId, req.params.projectId, payload.versionId, req.user, 'user', req.headers?.['push-ref']);
        return await this.agentRunnableStateService.addRunnableState(agent, req.params.projectId, req.user);
    }
    async listVersions(req, _res, agentId, query) {
        return await this.agentPublishService.listPublishHistory(agentId, req.params.projectId, query.take, query.skip);
    }
};
exports.AgentPublishController = AgentPublishController;
__decorate([
    (0, decorators_1.Post)('/:agentId/publish'),
    (0, decorators_1.ProjectScope)('agent:publish'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.PublishAgentDto]),
    __metadata("design:returntype", Promise)
], AgentPublishController.prototype, "publish", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/unpublish'),
    (0, decorators_1.ProjectScope)('agent:unpublish'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentPublishController.prototype, "unpublish", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/revert-to-published'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentPublishController.prototype, "revertToPublished", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/revert-to-version'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.RevertAgentToVersionDto]),
    __metadata("design:returntype", Promise)
], AgentPublishController.prototype, "revertToVersion", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/versions'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], AgentPublishController.prototype, "listVersions", null);
exports.AgentPublishController = AgentPublishController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_publish_service_1.AgentPublishService, agent_runnable_state_service_1.AgentRunnableStateService, collaboration_service_1.CollaborationService])
], AgentPublishController);
//# sourceMappingURL=agent-publish.controller.js.map