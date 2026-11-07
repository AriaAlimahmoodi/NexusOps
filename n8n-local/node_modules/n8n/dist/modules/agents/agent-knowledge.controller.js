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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentKnowledgeController = void 0;
const di_1 = require("@n8n/di");
const decorators_1 = require("@n8n/decorators");
const multer_1 = __importDefault(require("multer"));
const errors_1 = require("@n8n/errors");
const agent_knowledge_service_1 = require("./agent-knowledge.service");
const agent_runtime_cache_service_1 = require("./agent-runtime-cache.service");
const agent_sandbox_runtime_service_1 = require("./agent-sandbox-runtime.service");
const agent_upload_middleware_1 = require("./agent-upload.middleware");
const agentUploadMiddleware = di_1.Container.get(agent_upload_middleware_1.AgentUploadMiddleware);
let AgentKnowledgeController = class AgentKnowledgeController {
    constructor(agentKnowledgeService, agentSandboxRuntimeService, runtimeCacheService) {
        this.agentKnowledgeService = agentKnowledgeService;
        this.agentSandboxRuntimeService = agentSandboxRuntimeService;
        this.runtimeCacheService = runtimeCacheService;
    }
    assertKnowledgeBaseEnabled() {
        if (!this.agentSandboxRuntimeService.isEnabled()) {
            throw new errors_1.NotFoundError('Agent knowledge base is not enabled');
        }
    }
    async listFiles(_req, _res, projectId, agentId) {
        this.assertKnowledgeBaseEnabled();
        return await this.agentKnowledgeService.listFiles(agentId, projectId);
    }
    async uploadFiles(req, _res, projectId, agentId) {
        const files = req.files ?? [];
        try {
            this.assertKnowledgeBaseEnabled();
            if (req.fileUploadError) {
                const error = req.fileUploadError;
                if (error instanceof multer_1.default.MulterError) {
                    throw new errors_1.BadRequestError(`File upload error: ${(0, agent_upload_middleware_1.describeMulterError)(error)}`);
                }
                throw error;
            }
            if (files.length === 0) {
                throw new errors_1.BadRequestError('No files uploaded');
            }
            const uploadedFiles = await this.agentKnowledgeService.uploadFiles(agentId, projectId, files);
            this.runtimeCacheService.clearRuntimes(agentId);
            return uploadedFiles;
        }
        catch (error) {
            await (0, agent_upload_middleware_1.cleanupUploadedTempFiles)(files);
            throw error;
        }
    }
    async deleteFile(_req, _res, projectId, agentId, fileId) {
        this.assertKnowledgeBaseEnabled();
        await this.agentKnowledgeService.deleteFile(agentId, projectId, fileId);
        this.runtimeCacheService.clearRuntimes(agentId);
        return { success: true };
    }
};
exports.AgentKnowledgeController = AgentKnowledgeController;
__decorate([
    (0, decorators_1.Get)('/:agentId/files'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentKnowledgeController.prototype, "listFiles", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/files', {
        middlewares: [agentUploadMiddleware.array('files')],
    }),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, (0, decorators_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentKnowledgeController.prototype, "uploadFiles", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/files/:fileId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, (0, decorators_1.Param)('agentId')),
    __param(4, (0, decorators_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AgentKnowledgeController.prototype, "deleteFile", null);
exports.AgentKnowledgeController = AgentKnowledgeController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_knowledge_service_1.AgentKnowledgeService, agent_sandbox_runtime_service_1.AgentSandboxRuntimeService, agent_runtime_cache_service_1.AgentRuntimeCacheService])
], AgentKnowledgeController);
//# sourceMappingURL=agent-knowledge.controller.js.map