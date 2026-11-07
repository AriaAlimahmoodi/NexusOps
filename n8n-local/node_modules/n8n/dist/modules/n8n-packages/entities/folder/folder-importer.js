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
exports.FolderImporter = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const folder_service_1 = require("../../../../services/folder.service");
const folder_conflict_policy_1 = require("./folder-conflict-policy");
let FolderImporter = class FolderImporter {
    constructor(folderService) {
        this.folderService = folderService;
    }
    async plan(context, folders) {
        const ordered = orderParentsFirst(folders);
        const existing = await this.findExisting(ordered.map(({ sourceFolderId }) => sourceFolderId));
        const items = [];
        const conflicts = [];
        for (const folder of ordered) {
            const targetParentFolderId = folder.parentFolderId === null ? (context.folderId ?? null) : folder.parentFolderId;
            const match = existing.get(folder.sourceFolderId);
            if (!match) {
                items.push({
                    action: 'create',
                    sourceFolderId: folder.sourceFolderId,
                    name: folder.name,
                    targetParentFolderId,
                });
                continue;
            }
            if (match.projectId !== context.projectId) {
                conflicts.push({
                    kind: 'id-in-other-project',
                    sourceFolderId: folder.sourceFolderId,
                    name: folder.name,
                    existingProjectId: match.projectId,
                });
                continue;
            }
            if (match.parentFolderId !== targetParentFolderId) {
                conflicts.push({
                    kind: 'parent-mismatch',
                    sourceFolderId: folder.sourceFolderId,
                    name: folder.name,
                    existingParentFolderId: match.parentFolderId,
                    expectedParentFolderId: targetParentFolderId,
                });
                continue;
            }
            if ((0, folder_conflict_policy_1.decideMatchedFolder)(context.folderConflictPolicy).blocked) {
                conflicts.push({
                    kind: 'fail-policy',
                    sourceFolderId: folder.sourceFolderId,
                    name: folder.name,
                });
                continue;
            }
            items.push({
                action: 'skip',
                sourceFolderId: folder.sourceFolderId,
                name: folder.name,
                targetParentFolderId,
            });
        }
        return { items, conflicts };
    }
    async apply(context, plan) {
        const summaries = [];
        for (const item of plan.items) {
            if (item.action === 'skip') {
                summaries.push(toSummary(item, 'skipped'));
                continue;
            }
            await this.folderService.createFolder({ name: item.name, parentFolderId: item.targetParentFolderId ?? undefined }, context.projectId, item.sourceFolderId);
            summaries.push(toSummary(item, 'created'));
        }
        return summaries;
    }
    async findExisting(folderIds) {
        const folders = await this.folderService.getFoldersByIds(folderIds);
        return new Map(folders.map((folder) => [
            folder.id,
            {
                projectId: folder.homeProject.id,
                parentFolderId: folder.parentFolderId,
                name: folder.name,
            },
        ]));
    }
};
exports.FolderImporter = FolderImporter;
exports.FolderImporter = FolderImporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [folder_service_1.FolderService])
], FolderImporter);
function toSummary(item, status) {
    return {
        sourceFolderId: item.sourceFolderId,
        localId: item.sourceFolderId,
        name: item.name,
        parentFolderId: item.targetParentFolderId,
        status,
    };
}
function orderParentsFirst(folders) {
    const byId = new Map(folders.map((folder) => [folder.sourceFolderId, folder]));
    const ordered = [];
    const visited = new Set();
    const onStack = new Set();
    const visit = (folder) => {
        if (visited.has(folder.sourceFolderId))
            return;
        if (onStack.has(folder.sourceFolderId)) {
            throw new n8n_workflow_1.UserError('Package folder hierarchy contains a cycle.');
        }
        onStack.add(folder.sourceFolderId);
        const parentId = folder.parentFolderId;
        if (parentId !== null) {
            const parent = byId.get(parentId);
            if (!parent) {
                throw new n8n_workflow_1.UserError(`Package folder "${folder.name}" references a parent folder that is not in the package.`);
            }
            visit(parent);
        }
        onStack.delete(folder.sourceFolderId);
        visited.add(folder.sourceFolderId);
        ordered.push(folder);
    };
    for (const folder of folders)
        visit(folder);
    return ordered;
}
//# sourceMappingURL=folder-importer.js.map