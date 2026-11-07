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
exports.FolderExporter = void 0;
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const workflow_finder_service_1 = require("../../../../workflows/workflow-finder.service");
const folder_serializer_1 = require("./folder.serializer");
const manifest_entry_1 = require("../../io/manifest-entry");
const package_export_errors_1 = require("../package-export.errors");
const requirements_types_1 = require("../requirements.types");
const workflow_exporter_1 = require("../workflow/workflow.exporter");
let FolderExporter = class FolderExporter {
    constructor(folderFinder, folderSerializer, workflowFinder, workflowExporter) {
        this.folderFinder = folderFinder;
        this.folderSerializer = folderSerializer;
        this.workflowFinder = workflowFinder;
        this.workflowExporter = workflowExporter;
    }
    async export(request) {
        const folders = await this.folderFinder.findFolderSubtreesForUser(request.folderIds, request.user, ['folder:read']);
        await (0, package_export_errors_1.assertEveryRequestedEntityAccessible)('folder', request.folderIds, folders, async (ids) => await this.folderFinder.findExistingFolderIds(ids));
        const { roots, childrenByParent } = this.buildForest(folders);
        const workflowIdsByFolder = await this.workflowFinder.findWorkflowIdsByFolder(folders.map((folder) => folder.id), { includeArchived: request.includeArchivedWorkflows });
        const foldersToWrite = request.selectedWorkflowIds
            ? this.foldersContaining(request.selectedWorkflowIds, folders, workflowIdsByFolder)
            : undefined;
        const foldersDir = (0, manifest_entry_1.packageDirectory)('folders', request.basePrefix);
        return await this.exportLevel(roots, foldersDir, null, {
            childrenByParent,
            workflowIdsByFolder,
            foldersToWrite,
            request,
        });
    }
    foldersContaining(selectedWorkflowIds, folders, workflowIdsByFolder) {
        const parentById = new Map(folders.map((folder) => [folder.id, folder.parentFolderId]));
        const result = new Set();
        for (const [folderId, workflowIds] of workflowIdsByFolder) {
            if (!workflowIds.some((id) => selectedWorkflowIds.has(id)))
                continue;
            for (let current = folderId; current;) {
                if (result.has(current))
                    break;
                result.add(current);
                current = parentById.get(current);
            }
        }
        return result;
    }
    buildForest(folders) {
        const idsInSet = new Set(folders.map((folder) => folder.id));
        const roots = [];
        const childrenByParent = new Map();
        for (const folder of folders) {
            const parentId = folder.parentFolderId;
            if (parentId && idsInSet.has(parentId)) {
                const siblings = childrenByParent.get(parentId) ?? [];
                siblings.push(folder);
                childrenByParent.set(parentId, siblings);
            }
            else {
                roots.push(folder);
            }
        }
        return { roots, childrenByParent };
    }
    async exportLevel(siblings, parentDir, effectiveParentId, context) {
        const results = [];
        for (const folder of this.orderedByCreation(siblings)) {
            if (context.foldersToWrite && !context.foldersToWrite.has(folder.id))
                continue;
            results.push(await this.exportFolder(folder, parentDir, effectiveParentId, context));
        }
        return this.mergeFolderExportResults(results);
    }
    async exportFolder(folder, parentDir, effectiveParentId, context) {
        const { childrenByParent, workflowIdsByFolder, request } = context;
        const entry = await (0, manifest_entry_1.writeManifestEntry)(request.writer, 'folders', parentDir, folder, this.folderSerializer.serialize(folder, effectiveParentId));
        const workflowIds = workflowIdsByFolder.get(folder.id) ?? [];
        const contained = await this.exportContainedWorkflows(workflowIds, entry.target, request);
        const descendants = await this.exportLevel(childrenByParent.get(folder.id) ?? [], entry.target, folder.id, context);
        const own = {
            entries: [entry],
            workflowEntries: contained.entries,
            requirements: contained.requirements,
        };
        return this.mergeFolderExportResults([own, descendants]);
    }
    async exportContainedWorkflows(workflowIds, basePrefix, request) {
        const { selectedWorkflowIds } = request;
        const selected = selectedWorkflowIds
            ? workflowIds.filter((id) => selectedWorkflowIds.has(id))
            : workflowIds;
        if (selected.length === 0) {
            return { entries: [], requirements: (0, requirements_types_1.mergeRequirements)() };
        }
        return await this.workflowExporter.export({
            user: request.user,
            writer: request.writer,
            workflowIds: selected,
            includeTags: request.includeTags,
            versionPolicy: request.versionPolicy,
            basePrefix,
        });
    }
    mergeFolderExportResults(results) {
        return {
            entries: results.flatMap((result) => result.entries),
            workflowEntries: results.flatMap((result) => result.workflowEntries),
            requirements: (0, requirements_types_1.mergeRequirements)(...results.map((result) => result.requirements)),
        };
    }
    orderedByCreation(folders) {
        return [...folders].sort((a, b) => {
            const byCreatedAt = a.createdAt.getTime() - b.createdAt.getTime();
            return byCreatedAt !== 0 ? byCreatedAt : a.id.localeCompare(b.id);
        });
    }
};
exports.FolderExporter = FolderExporter;
exports.FolderExporter = FolderExporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.FolderFinderService, folder_serializer_1.FolderSerializer, workflow_finder_service_1.WorkflowFinderService, workflow_exporter_1.WorkflowExporter])
], FolderExporter);
//# sourceMappingURL=folder.exporter.js.map