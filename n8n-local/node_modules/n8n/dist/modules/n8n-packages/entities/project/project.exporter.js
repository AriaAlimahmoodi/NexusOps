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
exports.ProjectExporter = void 0;
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const project_service_ee_1 = require("../../../../services/project.service.ee");
const workflow_finder_service_1 = require("../../../../workflows/workflow-finder.service");
const project_export_access_1 = require("./project-export-access");
const project_shell_exporter_1 = require("./project-shell.exporter");
const folder_exporter_1 = require("../folder/folder.exporter");
const package_export_errors_1 = require("../package-export.errors");
const requirements_types_1 = require("../requirements.types");
const workflow_exporter_1 = require("../workflow/workflow.exporter");
let ProjectExporter = class ProjectExporter {
    constructor(projectService, projectShellExporter, folderFinder, workflowFinder, folderExporter, workflowExporter) {
        this.projectService = projectService;
        this.projectShellExporter = projectShellExporter;
        this.folderFinder = folderFinder;
        this.workflowFinder = workflowFinder;
        this.folderExporter = folderExporter;
        this.workflowExporter = workflowExporter;
    }
    async export(request) {
        const projects = await (0, project_export_access_1.findExportableProjects)(this.projectService, request.user, request.projectIds);
        const selectedWorkflowIds = request.workflowIds ? new Set(request.workflowIds) : undefined;
        if (request.workflowIds) {
            await this.assertSelectionInProjects(request.workflowIds, projects, request.user);
        }
        const results = [];
        for (const project of projects) {
            results.push(await this.exportProject(project, request, selectedWorkflowIds));
        }
        return this.mergeProjectExportResults(results);
    }
    async assertSelectionInProjects(workflowIds, projects, user) {
        const members = new Set();
        for (const project of projects) {
            const ids = await this.workflowFinder.findAllWorkflowIdsForUser(user, ['workflow:export'], undefined, project.id);
            for (const id of ids)
                members.add(id);
        }
        const missing = workflowIds.filter((id) => !members.has(id));
        if (missing.length === 0)
            return;
        throw new package_export_errors_1.PackageEntityNotFoundError(`${missing.length} workflow(s) not found in the requested project(s). Export aborted.`, { description: `Missing workflow IDs: ${missing.join(', ')}` });
    }
    async exportProject(project, request, selectedWorkflowIds) {
        const shell = {
            writer: request.writer,
            projectEntries: [],
            projectTargetsById: new Map(),
        };
        const target = await this.projectShellExporter.export(project, shell);
        const folders = await this.exportProjectFolders(project.id, target, request, selectedWorkflowIds);
        const rootWorkflows = await this.exportProjectRootWorkflows(project.id, target, request, selectedWorkflowIds);
        return {
            entries: shell.projectEntries,
            folderEntries: folders.entries,
            workflowEntries: [...folders.workflowEntries, ...rootWorkflows.entries],
            requirements: (0, requirements_types_1.mergeRequirements)(folders.requirements, rootWorkflows.requirements),
            projectTargetsById: shell.projectTargetsById,
        };
    }
    async exportProjectFolders(projectId, target, request, selectedWorkflowIds) {
        const folderIds = await this.folderFinder.findFolderIdsInProject(projectId);
        if (folderIds.length === 0) {
            return {
                entries: [],
                workflowEntries: [],
                requirements: (0, requirements_types_1.mergeRequirements)(),
            };
        }
        return await this.folderExporter.export({
            user: request.user,
            folderIds,
            writer: request.writer,
            includeTags: request.includeTags,
            versionPolicy: request.versionPolicy,
            includeArchivedWorkflows: request.includeArchivedWorkflows,
            basePrefix: target,
            selectedWorkflowIds,
        });
    }
    async exportProjectRootWorkflows(projectId, target, request, selectedWorkflowIds) {
        const rootWorkflowIds = await this.workflowFinder.findRootWorkflowIdsInProject(projectId, {
            includeArchived: request.includeArchivedWorkflows,
        });
        const selected = selectedWorkflowIds
            ? rootWorkflowIds.filter((id) => selectedWorkflowIds.has(id))
            : rootWorkflowIds;
        if (selected.length === 0) {
            return { entries: [], requirements: (0, requirements_types_1.mergeRequirements)() };
        }
        return await this.workflowExporter.export({
            user: request.user,
            workflowIds: selected,
            writer: request.writer,
            includeTags: request.includeTags,
            versionPolicy: request.versionPolicy,
            basePrefix: target,
        });
    }
    mergeProjectExportResults(results) {
        return {
            entries: results.flatMap((result) => result.entries),
            folderEntries: results.flatMap((result) => result.folderEntries),
            workflowEntries: results.flatMap((result) => result.workflowEntries),
            requirements: (0, requirements_types_1.mergeRequirements)(...results.map((result) => result.requirements)),
            projectTargetsById: new Map(results.flatMap((result) => [...result.projectTargetsById])),
        };
    }
};
exports.ProjectExporter = ProjectExporter;
exports.ProjectExporter = ProjectExporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [project_service_ee_1.ProjectService, project_shell_exporter_1.ProjectShellExporter, backend_services_1.FolderFinderService, workflow_finder_service_1.WorkflowFinderService, folder_exporter_1.FolderExporter, workflow_exporter_1.WorkflowExporter])
], ProjectExporter);
//# sourceMappingURL=project.exporter.js.map