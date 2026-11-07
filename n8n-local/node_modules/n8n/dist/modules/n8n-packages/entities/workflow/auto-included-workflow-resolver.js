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
exports.AutoIncludedWorkflowResolver = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const project_service_ee_1 = require("../../../../services/project.service.ee");
const workflow_finder_service_1 = require("../../../../workflows/workflow-finder.service");
const package_export_errors_1 = require("../package-export.errors");
const project_export_access_1 = require("../project/project-export-access");
const workflow_version_policy_1 = require("./workflow-version-policy");
let AutoIncludedWorkflowResolver = class AutoIncludedWorkflowResolver {
    constructor(workflowFinder, folderFinder, projectService, sharedWorkflowRepository) {
        this.workflowFinder = workflowFinder;
        this.folderFinder = folderFinder;
        this.projectService = projectService;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
    }
    async resolve(options) {
        const exportedWorkflowIds = new Set(options.exportedWorkflowIds);
        const originsByWorkflowId = this.seedOrigins(options.workflowSeeds);
        this.propagateOrigins(originsByWorkflowId, options.requirements);
        const autoIncludedWorkflowIds = [...originsByWorkflowId.keys()].filter((workflowId) => !exportedWorkflowIds.has(workflowId));
        const autoIncludedWorkflows = await this.buildAutoIncludedWorkflows({
            user: options.user,
            workflowIds: autoIncludedWorkflowIds,
            originsByWorkflowId,
            includeTags: options.includeTags,
            versionPolicy: options.versionPolicy,
        });
        return { autoIncludedWorkflows };
    }
    seedOrigins(seeds) {
        const originsByWorkflowId = new Map();
        for (const { workflowId, origin } of seeds) {
            const origins = originsByWorkflowId.get(workflowId) ?? new Set();
            origins.add(origin);
            originsByWorkflowId.set(workflowId, origins);
        }
        return originsByWorkflowId;
    }
    propagateOrigins(originsByWorkflowId, requirements) {
        const requirementsByWorkflowId = new Map();
        for (const requirement of requirements) {
            const current = requirementsByWorkflowId.get(requirement.workflowId) ?? [];
            current.push(requirement);
            requirementsByWorkflowId.set(requirement.workflowId, current);
        }
        const pending = new Set(originsByWorkflowId.keys());
        while (pending.size > 0) {
            const workflowId = pending.values().next().value;
            pending.delete(workflowId);
            const origins = originsByWorkflowId.get(workflowId);
            if (!origins)
                continue;
            for (const { referencedWorkflowId } of requirementsByWorkflowId.get(workflowId) ?? []) {
                const childOrigins = originsByWorkflowId.get(referencedWorkflowId) ?? new Set();
                let changed = false;
                for (const origin of origins) {
                    if (!childOrigins.has(origin)) {
                        childOrigins.add(origin);
                        changed = true;
                    }
                }
                originsByWorkflowId.set(referencedWorkflowId, childOrigins);
                if (changed) {
                    pending.add(referencedWorkflowId);
                }
            }
        }
    }
    async buildAutoIncludedWorkflows(options) {
        if (options.workflowIds.length === 0)
            return [];
        const workflows = await this.findExportableWorkflows(options.user, options.workflowIds, options.includeTags, options.versionPolicy);
        const workflowsById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
        const ownersByWorkflowId = await this.sharedWorkflowRepository.findOwnerProjectsByWorkflowIds(options.workflowIds);
        const placementsByWorkflowId = new Map(options.workflowIds.map((workflowId) => [
            workflowId,
            this.choosePlacement(options.originsByWorkflowId.get(workflowId)),
        ]));
        const folderIds = options.workflowIds
            .map((workflowId) => workflowsById.get(workflowId))
            .filter((workflow) => workflow !== undefined)
            .filter((workflow) => placementsByWorkflowId.get(workflow.id) !== 'top-level')
            .map((workflow) => workflow.parentFolder?.id)
            .filter((folderId) => folderId !== undefined);
        const folderChainsByFolderId = await this.findAccessibleFolderChains(options.user, folderIds);
        const projectIds = [
            ...new Set(options.workflowIds
                .filter((workflowId) => placementsByWorkflowId.get(workflowId) === 'project')
                .map((workflowId) => ownersByWorkflowId.get(workflowId)?.id)
                .filter((projectId) => projectId !== undefined)),
        ];
        const accessibleProjects = await (0, project_export_access_1.findExportableProjects)(this.projectService, options.user, projectIds);
        const accessibleProjectIds = new Set(accessibleProjects.map(({ id }) => id));
        return options.workflowIds.map((workflowId) => {
            const workflow = workflowsById.get(workflowId);
            const ownerProject = ownersByWorkflowId.get(workflowId);
            if (!workflow || !ownerProject) {
                throw new package_export_errors_1.PackageExportBlockedError('Static sub-workflow dependency could not be resolved. Export aborted.');
            }
            let placement = placementsByWorkflowId.get(workflowId) ?? 'top-level';
            if (placement === 'folder' && !workflow.parentFolder) {
                placement = 'top-level';
            }
            if (placement === 'project' && !accessibleProjectIds.has(ownerProject.id)) {
                throw new package_export_errors_1.PackageExportBlockedError('Static sub-workflow dependency project metadata is not accessible. Export aborted.');
            }
            const folderChain = workflow.parentFolder
                ? (folderChainsByFolderId.get(workflow.parentFolder.id) ?? [])
                : [];
            if (placement !== 'top-level' && workflow.parentFolder && folderChain.length === 0) {
                throw new package_export_errors_1.PackageExportBlockedError('Static sub-workflow dependency folder metadata is not accessible. Export aborted.');
            }
            return { workflow, placement, ownerProject, folderChain };
        });
    }
    choosePlacement(origins) {
        if (origins?.has('project'))
            return 'project';
        if (origins?.has('folder'))
            return 'folder';
        return 'top-level';
    }
    async findExportableWorkflows(user, workflowIds, includeTags, versionPolicy) {
        const workflows = await this.workflowFinder.findWorkflowsByIdsForUser(workflowIds, user, ['workflow:export'], {
            includeParentFolder: true,
            includeTags,
            includeActiveVersion: (0, workflow_version_policy_1.needsActiveVersion)(versionPolicy),
        });
        await (0, package_export_errors_1.assertEveryRequestedEntityAccessible)('workflow', workflowIds, workflows, async (ids) => await this.workflowFinder.findExistingWorkflowIds(ids));
        const exportableWorkflows = (0, workflow_version_policy_1.applyWorkflowVersionPolicy)(workflows, versionPolicy);
        if (exportableWorkflows.length < workflows.length) {
            const exportableIds = new Set(exportableWorkflows.map(({ id }) => id));
            const droppedIds = workflows.map(({ id }) => id).filter((id) => !exportableIds.has(id));
            const displayed = droppedIds.slice(0, 20);
            const omittedCount = droppedIds.length - displayed.length;
            const dependencyLabel = droppedIds.length === 1 ? 'dependency has' : 'dependencies have';
            throw new package_export_errors_1.PackageExportBlockedError(`${droppedIds.length} sub-workflow ${dependencyLabel} no published version. Export aborted.`, {
                description: `Unpublished sub-workflow IDs: ${displayed.join(', ')}${omittedCount > 0 ? `, and ${omittedCount} more` : ''}`,
            });
        }
        return exportableWorkflows;
    }
    async findAccessibleFolderChains(user, folderIds) {
        const uniqueFolderIds = [...new Set(folderIds)];
        const folderChainsByFolderId = await this.folderFinder.findFolderAncestorChainsForUser(uniqueFolderIds, user, ['folder:read']);
        await (0, package_export_errors_1.assertEveryRequestedEntityAccessible)('folder', uniqueFolderIds, [...folderChainsByFolderId.values()]
            .map((chain) => chain.at(-1))
            .filter((folder) => folder !== undefined), async (ids) => await this.folderFinder.findExistingFolderIds(ids));
        return folderChainsByFolderId;
    }
};
exports.AutoIncludedWorkflowResolver = AutoIncludedWorkflowResolver;
exports.AutoIncludedWorkflowResolver = AutoIncludedWorkflowResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_finder_service_1.WorkflowFinderService, backend_services_1.FolderFinderService, project_service_ee_1.ProjectService, db_1.SharedWorkflowRepository])
], AutoIncludedWorkflowResolver);
//# sourceMappingURL=auto-included-workflow-resolver.js.map