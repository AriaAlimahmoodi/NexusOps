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
exports.WorkflowRemover = void 0;
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const workflow_finder_service_1 = require("../../../../workflows/workflow-finder.service");
const workflow_service_1 = require("../../../../workflows/workflow.service");
const folder_conflict_policy_1 = require("../folder/folder-conflict-policy");
const n8n_packages_types_1 = require("../../n8n-packages.types");
let WorkflowRemover = class WorkflowRemover {
    constructor(workflowFinderService, workflowService) {
        this.workflowFinderService = workflowFinderService;
        this.workflowService = workflowService;
    }
    async plan(context, request) {
        const nothingToRemove = {
            removals: [],
            failures: [],
            conflicts: [],
            deletionPolicy: request.deletionPolicy,
            occupiedFolderIds: [],
        };
        if (request.explicitDeleteIds?.length) {
            return await this.planExplicitDeletes(context, request);
        }
        if (!(0, folder_conflict_policy_1.removesUnpackagedWorkflows)(request.folderConflictPolicy) ||
            request.projectPendingCreation) {
            return nothingToRemove;
        }
        const placements = await this.workflowFinderService.findOwnedWorkflowPlacementsInProject(context.projectId, { includeArchived: true });
        if (placements.length === 0)
            return nothingToRemove;
        const candidates = candidatesFor(placements, request);
        if (candidates.length === 0) {
            return { ...nothingToRemove, occupiedFolderIds: occupiedBy(placements) };
        }
        const removable = await this.workflowFinderService.findWorkflowIdsWithScopeForUser(candidates.map(({ id }) => id), context.user, ['workflow:delete']);
        const removals = candidates.filter(({ id }) => removable.has(id));
        const removedIds = new Set(removals.map(({ id }) => id));
        return {
            removals,
            conflicts: [],
            failures: candidates
                .filter(({ id }) => !removable.has(id))
                .map(({ id, name }) => ({ workflowId: id, name, projectId: context.projectId })),
            deletionPolicy: request.deletionPolicy,
            occupiedFolderIds: occupiedBy(placements.filter(({ id }) => !removedIds.has(id))),
        };
    }
    async planExplicitDeletes(context, request) {
        const requested = new Set(request.explicitDeleteIds);
        const conflicts = request.workflowItems
            .filter((item) => requested.has(targetIdOf(item)))
            .map((item) => ({
            sourceWorkflowId: item.sourceWorkflowId,
            workflowId: targetIdOf(item),
            projectId: context.projectId,
        }));
        if (conflicts.length > 0) {
            return {
                removals: [],
                failures: [],
                conflicts,
                deletionPolicy: request.deletionPolicy,
                occupiedFolderIds: [],
            };
        }
        const targets = await this.workflowFinderService.findOwnedWorkflowRemovalCandidates(context.projectId, [...requested], { includeArchived: request.deletionPolicy === n8n_packages_types_1.OverwriteDeletionPolicy.HardDelete });
        if (targets.length === 0) {
            return {
                removals: [],
                failures: [],
                conflicts: [],
                deletionPolicy: request.deletionPolicy,
                occupiedFolderIds: [],
            };
        }
        const authorized = await this.workflowFinderService.findWorkflowIdsWithScopeForUser(targets.map(({ id }) => id), context.user, ['workflow:delete']);
        return {
            removals: targets
                .filter(({ id }) => authorized.has(id))
                .map(({ id, name, parentFolderId }) => ({ id, name, parentFolderId })),
            conflicts: [],
            failures: targets
                .filter(({ id }) => !authorized.has(id))
                .map(({ id, name }) => ({ workflowId: id, name, projectId: context.projectId })),
            deletionPolicy: request.deletionPolicy,
            occupiedFolderIds: [],
        };
    }
    async apply(context, plan) {
        const summaries = [];
        for (const workflow of plan.removals) {
            await this.workflowService.archive(context.user, workflow.id, { skipArchived: true });
            const deleted = plan.deletionPolicy === n8n_packages_types_1.OverwriteDeletionPolicy.HardDelete &&
                (await this.deleteArchived(context, workflow));
            summaries.push({
                workflowId: workflow.id,
                name: workflow.name,
                projectId: context.projectId,
                parentFolderId: workflow.parentFolderId,
                deletion: deleted ? 'deleted' : 'archived',
            });
        }
        return summaries;
    }
    async deleteArchived(context, workflow) {
        try {
            await this.workflowService.delete(context.user, workflow.id);
            return true;
        }
        catch (error) {
            if (error instanceof errors_1.ConflictError)
                return false;
            throw error;
        }
    }
};
exports.WorkflowRemover = WorkflowRemover;
exports.WorkflowRemover = WorkflowRemover = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_finder_service_1.WorkflowFinderService, workflow_service_1.WorkflowService])
], WorkflowRemover);
function occupiedBy(placements) {
    return [
        ...new Set(placements
            .map(({ parentFolderId }) => parentFolderId)
            .filter((id) => id !== null)),
    ];
}
function candidatesFor(placements, request) {
    const retained = retainedWorkflowIds(request);
    const packageFolderIds = new Set(request.packageFolderIds);
    const isGitPull = request.importSource === 'git-pull';
    return placements
        .filter(({ id, parentFolderId, isArchived }) => !isArchived &&
        !retained.has(id) &&
        (isGitPull || parentFolderId === null || packageFolderIds.has(parentFolderId)))
        .map(({ id, name, parentFolderId }) => ({ id, name, parentFolderId }));
}
function retainedWorkflowIds({ workflowItems, subWorkflowRequirementIds = [], }) {
    return new Set([...workflowItems.map(targetIdOf), ...subWorkflowRequirementIds]);
}
function targetIdOf(item) {
    return item.action === 'create' ? item.decidedId : item.existing.id;
}
//# sourceMappingURL=workflow-remover.js.map