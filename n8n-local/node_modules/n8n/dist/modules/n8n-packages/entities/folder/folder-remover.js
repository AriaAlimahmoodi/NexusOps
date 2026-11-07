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
exports.FolderRemover = void 0;
const di_1 = require("@n8n/di");
const folder_service_1 = require("../../../../services/folder.service");
const project_service_ee_1 = require("../../../../services/project.service.ee");
let FolderRemover = class FolderRemover {
    constructor(folderService, projectService) {
        this.folderService = folderService;
        this.projectService = projectService;
    }
    async plan(context, input) {
        const nothingToRemove = { removals: [], failures: [] };
        const placements = await this.folderService.getFolderPlacementsInProject(context.projectId);
        if (placements.length === 0)
            return nothingToRemove;
        const packageFolderIds = new Set(input.packageFolderIds);
        const candidates = placements.filter(({ id }) => !packageFolderIds.has(id));
        if (candidates.length === 0)
            return nothingToRemove;
        const removableIds = resolveRemovable(candidates, placements, new Set(input.occupiedFolderIds));
        const depths = folderDepths(placements);
        const removals = candidates
            .filter(({ id }) => removableIds.has(id))
            .map(({ id, name, parentFolderId }) => ({
            id,
            name,
            parentFolderId,
            depth: depths.get(id) ?? 0,
        }))
            .sort((a, b) => b.depth - a.depth);
        if (removals.length === 0)
            return nothingToRemove;
        const project = await this.projectService.getProjectWithScope(context.user, context.projectId, [
            'folder:delete',
        ]);
        if (!project) {
            return {
                removals: [],
                failures: removals.map(({ id, name }) => ({
                    folderId: id,
                    name,
                    projectId: context.projectId,
                })),
            };
        }
        return { removals, failures: [] };
    }
    async apply(context, plan) {
        const summaries = [];
        for (const folder of plan.removals) {
            await this.folderService.deleteFolder(context.user, folder.id, context.projectId, {});
            summaries.push({
                folderId: folder.id,
                name: folder.name,
                projectId: context.projectId,
                parentFolderId: folder.parentFolderId,
            });
        }
        return summaries;
    }
};
exports.FolderRemover = FolderRemover;
exports.FolderRemover = FolderRemover = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [folder_service_1.FolderService, project_service_ee_1.ProjectService])
], FolderRemover);
function resolveRemovable(candidates, placements, occupiedFolderIds) {
    const removable = new Set();
    for (let settled = false; !settled;) {
        settled = true;
        for (const candidate of candidates) {
            if (removable.has(candidate.id) || occupiedFolderIds.has(candidate.id))
                continue;
            const holdsSurvivingFolder = placements.some(({ id, parentFolderId }) => parentFolderId === candidate.id && !removable.has(id));
            if (holdsSurvivingFolder)
                continue;
            removable.add(candidate.id);
            settled = false;
        }
    }
    return removable;
}
function folderDepths(placements) {
    const parents = new Map(placements.map(({ id, parentFolderId }) => [id, parentFolderId]));
    const depths = new Map();
    const depthOf = (id) => {
        const cached = depths.get(id);
        if (cached !== undefined)
            return cached;
        depths.set(id, 0);
        const parentId = parents.get(id) ?? null;
        const depth = parentId === null ? 0 : depthOf(parentId) + 1;
        depths.set(id, depth);
        return depth;
    };
    for (const { id } of placements)
        depthOf(id);
    return depths;
}
//# sourceMappingURL=folder-remover.js.map