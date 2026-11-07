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
exports.AgentTasksController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
const agent_task_service_1 = require("./agent-task.service");
const agent_repository_1 = require("./repositories/agent.repository");
const get_agent_or_throw_1 = require("./utils/get-agent-or-throw");
let AgentTasksController = class AgentTasksController {
    constructor(agentTaskService, agentRepository, collaborationService) {
        this.agentTaskService = agentTaskService;
        this.agentRepository = agentRepository;
        this.collaborationService = collaborationService;
    }
    async listTasks(req, _res, agentId) {
        await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, req.params.projectId);
        return await this.agentTaskService.list(agentId);
    }
    async createTask(req, _res, agentId, payload) {
        const projectId = req.params.projectId;
        await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, projectId, agentId, 'create task for');
        return await this.agentTaskService.create(agentId, projectId, payload, {
            user: req.user,
            modifiedBy: 'user',
            pushRef: req.headers?.['push-ref'],
        });
    }
    async updateTask(req, _res, agentId, taskId, payload) {
        const projectId = req.params.projectId;
        await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, projectId, agentId, 'update task for');
        return await this.agentTaskService.update(agentId, projectId, taskId, payload, {
            user: req.user,
            modifiedBy: 'user',
            pushRef: req.headers?.['push-ref'],
        });
    }
    async deleteTask(req, _res, agentId, taskId) {
        const projectId = req.params.projectId;
        await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const clientId = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, clientId, projectId, agentId, 'delete task for');
        await this.agentTaskService.delete(agentId, projectId, taskId, {
            user: req.user,
            modifiedBy: 'user',
            pushRef: req.headers?.['push-ref'],
        });
        return { success: true };
    }
    async runTaskNow(req, _res, agentId, taskId) {
        await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, req.params.projectId);
        await this.agentTaskService.runNow(agentId, taskId, req.user);
        return { success: true };
    }
};
exports.AgentTasksController = AgentTasksController;
__decorate([
    (0, decorators_1.Get)('/:agentId/tasks'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentTasksController.prototype, "listTasks", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/tasks'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.CreateAgentTaskDto]),
    __metadata("design:returntype", Promise)
], AgentTasksController.prototype, "createTask", null);
__decorate([
    (0, decorators_1.Patch)('/:agentId/tasks/:taskId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('taskId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.UpdateAgentTaskDto]),
    __metadata("design:returntype", Promise)
], AgentTasksController.prototype, "updateTask", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/tasks/:taskId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentTasksController.prototype, "deleteTask", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/tasks/:taskId/run'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __param(3, (0, decorators_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentTasksController.prototype, "runTaskNow", null);
exports.AgentTasksController = AgentTasksController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_task_service_1.AgentTaskService, agent_repository_1.AgentRepository, collaboration_service_1.CollaborationService])
], AgentTasksController);
//# sourceMappingURL=agent-tasks.controller.js.map