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
exports.AgentThreadsController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const agent_execution_service_1 = require("./agent-execution.service");
const agent_session_langsmith_export_service_1 = require("./agent-session-langsmith-export.service");
const agent_thread_access_1 = require("./utils/agent-thread-access");
const parse_thread_list_limit_1 = require("./utils/parse-thread-list-limit");
let AgentThreadsController = class AgentThreadsController {
    constructor(agentExecutionService, langsmithExportService) {
        this.agentExecutionService = agentExecutionService;
        this.langsmithExportService = langsmithExportService;
    }
    async listThreads(req, _res, query) {
        const { cursor, limit: requestedLimit, ...filters } = query;
        const limit = (0, parse_thread_list_limit_1.parseThreadListLimit)(requestedLimit);
        return await this.agentExecutionService.getThreads(req.params.projectId, req.params.agentId, req.user.id, limit, cursor, filters);
    }
    async getThread(req) {
        const result = await this.agentExecutionService.getThreadDetail(req.params.threadId, req.params.projectId, req.params.agentId, req.user.id);
        if (!result) {
            throw new errors_1.NotFoundError(`Thread "${req.params.threadId}" not found`);
        }
        const { ownerId: _ownerId, accessScope: _accessScope, owner: _owner, ...thread } = result.thread;
        const source = result.executions.find((execution) => execution.source !== null)?.source;
        const access = {
            canContinueInPreview: (0, agent_thread_access_1.canContinueThreadInPreview)(result.thread, req.user.id, source),
        };
        return { ...result, thread: { ...thread, ...access, source: source ?? null } };
    }
    async exportThreadToLangSmith(req) {
        const { projectId, agentId, threadId } = req.params;
        return await this.langsmithExportService.exportSession({
            projectId,
            agentId,
            threadId,
            user: req.user,
        });
    }
    async deleteThread(req) {
        const { projectId, agentId, threadId } = req.params;
        const deleted = await this.agentExecutionService.deleteThread(projectId, agentId, threadId, req.user.id);
        if (!deleted) {
            throw new errors_1.NotFoundError(`Thread "${threadId}" not found`);
        }
        return { success: true };
    }
};
exports.AgentThreadsController = AgentThreadsController;
__decorate([
    (0, decorators_1.Get)('/:agentId/threads'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListAgentSessionsQueryDto]),
    __metadata("design:returntype", Promise)
], AgentThreadsController.prototype, "listThreads", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/threads/:threadId'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentThreadsController.prototype, "getThread", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/threads/:threadId/langsmith-export'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentThreadsController.prototype, "exportThreadToLangSmith", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/threads/:threadId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentThreadsController.prototype, "deleteThread", null);
exports.AgentThreadsController = AgentThreadsController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_execution_service_1.AgentExecutionService, agent_session_langsmith_export_service_1.AgentSessionLangSmithExportService])
], AgentThreadsController);
//# sourceMappingURL=agent-threads.controller.js.map