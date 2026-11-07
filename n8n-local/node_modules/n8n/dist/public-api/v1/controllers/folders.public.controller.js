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
exports.FoldersPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const n8n_workflow_1 = require("n8n-workflow");
const folder_not_found_error_1 = require("../../../errors/folder-not-found.error");
const errors_1 = require("@n8n/errors");
const utils_service_1 = require("../../../public-api/v1/shared/services/utils.service");
const folder_service_1 = require("../../../services/folder.service");
const project_service_ee_1 = require("../../../services/project.service.ee");
const tags = ['Folders'];
const PERSONAL_PROJECT_ALIAS = 'personal';
const toFolderPublicDto = (folder) => ({
    id: folder.id,
    name: folder.name,
    parentFolderId: folder.parentFolderId,
    createdAt: folder.createdAt?.toISOString(),
    updatedAt: folder.updatedAt?.toISOString(),
    homeProject: folder.homeProject && {
        id: folder.homeProject.id,
        name: folder.homeProject.name,
        type: folder.homeProject.type,
        icon: folder.homeProject.icon,
    },
    parentFolder: folder.parentFolder && {
        id: folder.parentFolder.id,
        name: folder.parentFolder.name,
        parentFolderId: folder.parentFolder.parentFolderId,
    },
    tags: folder.tags?.map((tag) => ({ id: tag.id, name: tag.name })),
    workflowCount: folder.workflowCount,
    subFolderCount: folder.subFolderCount,
    path: folder.path,
});
const toFolderDetailsPublicDto = (folder, totalSubFolders, totalWorkflows) => ({
    id: folder.id,
    name: folder.name,
    parentFolderId: folder.parentFolderId,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
    totalSubFolders,
    totalWorkflows,
});
const toUpdatedFolderPublicDto = (folder) => ({
    id: folder.id,
    name: folder.name,
    parentFolderId: folder.parentFolderId,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
});
const toCreatedFolderPublicDto = (folder) => ({
    id: folder.id,
    name: folder.name,
    parentFolderId: folder.parentFolderId ?? folder.parentFolder?.id ?? null,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
});
const handleError = (error) => {
    if (error instanceof folder_not_found_error_1.FolderNotFoundError) {
        throw new errors_1.NotFoundError(error.message);
    }
    if (error instanceof n8n_workflow_1.UserError) {
        throw new errors_1.BadRequestError(error.message);
    }
    throw error;
};
let FoldersPublicController = class FoldersPublicController {
    constructor(folderService, projectService) {
        this.folderService = folderService;
        this.projectService = projectService;
    }
    async listFolders(req, _res, projectId, query) {
        await (0, utils_service_1.assertProjectScope)(req.user, projectId, ['folder:list']);
        const [data, count] = await this.folderService.getManyAndCount(projectId, query);
        return { count, data: data.map(toFolderPublicDto) };
    }
    async createFolder(req, _res, projectId, body) {
        const resolvedProjectId = await this.resolveProjectId(req, projectId);
        await (0, utils_service_1.assertProjectScope)(req.user, resolvedProjectId, ['folder:create']);
        try {
            return toCreatedFolderPublicDto(await this.folderService.createFolder(body, resolvedProjectId));
        }
        catch (error) {
            return handleError(error);
        }
    }
    async getFolder(req, _res, projectId, folderId) {
        await (0, utils_service_1.assertProjectScope)(req.user, projectId, ['folder:read']);
        try {
            const { folder, totalSubFolders, totalWorkflows } = await this.folderService.findFolderWithContentCounts(folderId, projectId);
            return toFolderDetailsPublicDto(folder, totalSubFolders, totalWorkflows);
        }
        catch (error) {
            return handleError(error);
        }
    }
    async updateFolder(req, _res, projectId, folderId, body) {
        await (0, utils_service_1.assertProjectScope)(req.user, projectId, ['folder:update']);
        try {
            const folder = await this.folderService.updateFolder(folderId, projectId, body);
            return toUpdatedFolderPublicDto(folder);
        }
        catch (error) {
            return handleError(error);
        }
    }
    async deleteFolder(req, _res, projectId, folderId, query) {
        await (0, utils_service_1.assertProjectScope)(req.user, projectId, ['folder:delete']);
        try {
            await this.folderService.deleteFolder(req.user, folderId, projectId, query);
        }
        catch (error) {
            return handleError(error);
        }
    }
    async resolveProjectId(req, projectId) {
        if (projectId !== PERSONAL_PROJECT_ALIAS)
            return projectId;
        const personalProject = await this.projectService.getPersonalProject(req.user);
        if (!personalProject) {
            throw new errors_1.NotFoundError('Could not find a personal project for this user');
        }
        return personalProject.id;
    }
};
exports.FoldersPublicController = FoldersPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.FOLDERS),
    (0, decorators_1.ApiKeyScope)('folder:list'),
    (0, decorators_1.ApiSummary)('Retrieve folders'),
    (0, decorators_1.ApiDescription)('Retrieve folders within a project. Supports filtering, sorting, field selection, and pagination.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.FolderListPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ListFoldersQueryPublicDto]),
    __metadata("design:returntype", Promise)
], FoldersPublicController.prototype, "listFolders", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.FOLDERS),
    (0, decorators_1.ApiKeyScope)('folder:create'),
    (0, decorators_1.ApiSummary)('Create a folder'),
    (0, decorators_1.ApiDescription)('Create a folder within a project.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201, api_types_1.CreatedFolderPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.folderProjectIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.CreateFolderPublicDto]),
    __metadata("design:returntype", Promise)
], FoldersPublicController.prototype, "createFolder", null);
__decorate([
    (0, decorators_1.Get)('/:folderId'),
    (0, decorators_1.ApiKeyScope)('folder:read'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.FOLDERS),
    (0, decorators_1.ApiSummary)('Get folder details'),
    (0, decorators_1.ApiDescription)('Get folder details including sub-folder and workflow counts.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.FolderDetailsPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, (0, decorators_1.Param)('folderId', api_types_1.folderIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], FoldersPublicController.prototype, "getFolder", null);
__decorate([
    (0, decorators_1.Patch)('/:folderId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.FOLDERS),
    (0, decorators_1.ApiKeyScope)('folder:update'),
    (0, decorators_1.ApiSummary)('Update a folder'),
    (0, decorators_1.ApiDescription)('Update folder name or parent folder.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.UpdatedFolderPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, (0, decorators_1.Param)('folderId', api_types_1.folderIdParamSchema)),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.UpdateFolderPublicDto]),
    __metadata("design:returntype", Promise)
], FoldersPublicController.prototype, "updateFolder", null);
__decorate([
    (0, decorators_1.Delete)('/:folderId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.FOLDERS),
    (0, decorators_1.ApiKeyScope)('folder:delete'),
    (0, decorators_1.ApiSummary)('Delete a folder'),
    (0, decorators_1.ApiDescription)('Delete a folder within a project. When `transferToFolderId` is provided, workflows and ' +
        'sub-folders are moved to the target folder before deletion. When omitted, workflows are ' +
        'moved to the project root and archived, and child folders are deleted.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, (0, decorators_1.Param)('folderId', api_types_1.folderIdParamSchema)),
    __param(4, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.DeleteFolderQueryPublicDto]),
    __metadata("design:returntype", Promise)
], FoldersPublicController.prototype, "deleteFolder", null);
exports.FoldersPublicController = FoldersPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/projects/:projectId/folders'),
    __metadata("design:paramtypes", [folder_service_1.FolderService, project_service_ee_1.ProjectService])
], FoldersPublicController);
//# sourceMappingURL=folders.public.controller.js.map