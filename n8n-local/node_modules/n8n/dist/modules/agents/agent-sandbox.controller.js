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
exports.AgentSandboxController = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const agent_knowledge_service_1 = require("./agent-knowledge.service");
const agent_sandbox_runtime_service_1 = require("./agent-sandbox-runtime.service");
let AgentSandboxController = class AgentSandboxController {
    constructor(agentKnowledgeService, logger, agentSandboxRuntimeService) {
        this.agentKnowledgeService = agentKnowledgeService;
        this.logger = logger;
        this.agentSandboxRuntimeService = agentSandboxRuntimeService;
    }
    async warmKnowledgeSandbox(_req, res, projectId, agentId) {
        this.assertKnowledgeBaseEnabled();
        res.status(202);
        setImmediate(() => {
            void this.warmKnowledgeSandboxInBackground(projectId, agentId);
        });
        return { accepted: true };
    }
    assertKnowledgeBaseEnabled() {
        if (!this.agentSandboxRuntimeService.isEnabled()) {
            throw new errors_1.NotFoundError('Agent knowledge base is not enabled');
        }
    }
    async warmKnowledgeSandboxInBackground(projectId, agentId) {
        try {
            await this.agentKnowledgeService.warmKnowledgeSandbox(agentId, projectId);
        }
        catch (error) {
            this.logger.warn('Failed to warm agent knowledge sandbox', {
                projectId,
                agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
};
exports.AgentSandboxController = AgentSandboxController;
__decorate([
    (0, decorators_1.Post)('/:agentId/sandbox/knowledge/warmup'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentSandboxController.prototype, "warmKnowledgeSandbox", null);
exports.AgentSandboxController = AgentSandboxController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_knowledge_service_1.AgentKnowledgeService, backend_common_1.Logger, agent_sandbox_runtime_service_1.AgentSandboxRuntimeService])
], AgentSandboxController);
//# sourceMappingURL=agent-sandbox.controller.js.map