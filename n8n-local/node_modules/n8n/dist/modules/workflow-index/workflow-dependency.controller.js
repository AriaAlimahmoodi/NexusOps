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
exports.WorkflowDependencyController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const workflow_dependency_query_service_1 = require("./workflow-dependency-query.service");
let WorkflowDependencyController = class WorkflowDependencyController {
    constructor(workflowDependencyQueryService) {
        this.workflowDependencyQueryService = workflowDependencyQueryService;
    }
    async getResourceDependencyCounts(req, _res, body) {
        return await this.workflowDependencyQueryService.getDependencyCounts(body.resourceIds, body.resourceType, req.user);
    }
    async getResourceDependencies(req, _res, body) {
        return await this.workflowDependencyQueryService.getResourceDependencies(body.resourceIds, body.resourceType, req.user, { listUnavailableCredentials: true });
    }
    async getFolderDependencies(req) {
        const { projectId, folderId } = req.params;
        return await this.workflowDependencyQueryService.getFolderDependencies(projectId, folderId, req.user);
    }
};
exports.WorkflowDependencyController = WorkflowDependencyController;
__decorate([
    (0, decorators_1.Post)('/counts'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.GetResourceDependencyCountsDto]),
    __metadata("design:returntype", Promise)
], WorkflowDependencyController.prototype, "getResourceDependencyCounts", null);
__decorate([
    (0, decorators_1.Post)('/details'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.GetResourceDependenciesDto]),
    __metadata("design:returntype", Promise)
], WorkflowDependencyController.prototype, "getResourceDependencies", null);
__decorate([
    (0, decorators_1.Get)('/projects/:projectId/folders/:folderId'),
    (0, decorators_1.ProjectScope)('folder:read'),
    (0, decorators_1.Licensed)('feat:folders'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowDependencyController.prototype, "getFolderDependencies", null);
exports.WorkflowDependencyController = WorkflowDependencyController = __decorate([
    (0, decorators_1.RestController)('/workflow-dependencies'),
    __metadata("design:paramtypes", [workflow_dependency_query_service_1.WorkflowDependencyQueryService])
], WorkflowDependencyController);
//# sourceMappingURL=workflow-dependency.controller.js.map