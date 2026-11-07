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
exports.AgentsListController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const agents_service_1 = require("./agents.service");
const parse_thread_list_limit_1 = require("./utils/parse-thread-list-limit");
let AgentsListController = class AgentsListController {
    constructor(agentsService) {
        this.agentsService = agentsService;
    }
    async list(req, res, query) {
        res.json(query.filter?.availableInChat === undefined
            ? await this.agentsService.findListableByUserPaginated(req.user, query)
            : await this.agentsService.findChatReachableByUserPaginated(req.user, query));
    }
    async getChatAgent(req, _res, agentId) {
        const agent = await this.agentsService.findChatReachableAgentForUser(agentId, req.user);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        return agent;
    }
    async listN8nChatThreads(req, res, query) {
        const limit = (0, parse_thread_list_limit_1.parseThreadListLimit)(query.limit);
        res.json(await this.agentsService.findN8nChatThreadsForUser(req.user, {
            limit,
            cursor: query.cursor,
            agentId: query.agentId,
            search: query.search,
        }));
    }
    async getN8nChatThread(req, _res, threadId) {
        const thread = await this.agentsService.findN8nChatThreadForUser(req.user, threadId);
        if (!thread)
            throw new errors_1.NotFoundError(`Thread "${threadId}" not found`);
        return thread;
    }
};
exports.AgentsListController = AgentsListController;
__decorate([
    (0, decorators_1.Get)('/'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListAgentsQueryDto]),
    __metadata("design:returntype", Promise)
], AgentsListController.prototype, "list", null);
__decorate([
    (0, decorators_1.Get)('/n8n-chat/agents/:agentId'),
    __param(2, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentsListController.prototype, "getChatAgent", null);
__decorate([
    (0, decorators_1.Get)('/n8n-chat/threads'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListN8nChatThreadsQueryDto]),
    __metadata("design:returntype", Promise)
], AgentsListController.prototype, "listN8nChatThreads", null);
__decorate([
    (0, decorators_1.Get)('/n8n-chat/threads/:threadId'),
    __param(2, (0, decorators_1.Param)('threadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AgentsListController.prototype, "getN8nChatThread", null);
exports.AgentsListController = AgentsListController = __decorate([
    (0, decorators_1.RestController)('/agents/v2'),
    __metadata("design:paramtypes", [agents_service_1.AgentsService])
], AgentsListController);
//# sourceMappingURL=agents-list.controller.js.map