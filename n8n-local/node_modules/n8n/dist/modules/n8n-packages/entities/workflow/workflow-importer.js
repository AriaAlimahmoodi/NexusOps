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
exports.WorkflowImporter = void 0;
exports.collectPlannedWorkflowBindings = collectPlannedWorkflowBindings;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const workflow_creation_service_1 = require("../../../../workflows/workflow-creation.service");
const workflow_finder_service_1 = require("../../../../workflows/workflow-finder.service");
const workflow_service_1 = require("../../../../workflows/workflow.service");
const workflow_references_1 = require("./references/workflow-references");
const workflow_archive_transition_1 = require("./workflow-archive-transition");
const workflow_conflict_policy_1 = require("./workflow-conflict-policy");
const workflow_id_policy_1 = require("./workflow-id-policy");
const workflow_import_match_service_1 = require("./workflow-import-match.service");
const workflow_credential_references_1 = require("../credential/workflow-credential-references");
let WorkflowImporter = class WorkflowImporter {
    constructor(workflowImportMatchService, workflowCreationService, workflowService, workflowFinderService) {
        this.workflowImportMatchService = workflowImportMatchService;
        this.workflowCreationService = workflowCreationService;
        this.workflowService = workflowService;
        this.workflowFinderService = workflowFinderService;
    }
    async plan(context, prepared, options) {
        const { matches: existingBySourceWorkflowId, lineageConflicts } = await this.workflowImportMatchService.findBySourceWorkflowIds(context.projectId, prepared.map(({ sourceWorkflowId }) => sourceWorkflowId));
        const items = [];
        const conflicts = [];
        const folderConflicts = [];
        const sourceCreateIds = [];
        const archiveTransitionItems = [];
        const ambiguousSourceIds = new Set(lineageConflicts.map(({ sourceWorkflowId }) => sourceWorkflowId));
        for (const workflow of prepared) {
            const existing = existingBySourceWorkflowId.get(workflow.sourceWorkflowId) ?? null;
            if (existing && ambiguousSourceIds.has(workflow.sourceWorkflowId)) {
                items.push({ action: 'skip', ...workflow, existing });
                continue;
            }
            const { action, blocked } = (0, workflow_conflict_policy_1.decideWorkflowConflictAction)(options.workflowConflictPolicy, existing);
            const item = toPlanItem(workflow, existing, action, options.workflowIdPolicy);
            items.push(item);
            if (item.action === 'create' && options.workflowIdPolicy === 'source' && !blocked) {
                sourceCreateIds.push(item.decidedId);
            }
            if (hasArchiveTransition(item)) {
                archiveTransitionItems.push(item);
            }
            if (blocked && existing) {
                conflicts.push({
                    sourceWorkflowId: workflow.sourceWorkflowId,
                    existingWorkflowId: existing.id,
                    name: existing.name,
                });
            }
            const targetFolderId = workflow.parentFolderId ?? context.folderId;
            if (targetFolderId && item.action === 'update') {
                const existingParentFolderId = item.existing.parentFolder?.id ?? null;
                if (existingParentFolderId !== targetFolderId) {
                    folderConflicts.push({
                        sourceWorkflowId: workflow.sourceWorkflowId,
                        existingWorkflowId: item.existing.id,
                        existingParentFolderId,
                        targetFolderId,
                        name: item.existing.name,
                    });
                }
            }
        }
        const [idConflicts, archiveForbidden] = await Promise.all([
            this.collectIdConflicts(sourceCreateIds),
            this.collectArchiveForbidden(context, archiveTransitionItems),
        ]);
        return {
            items,
            conflicts,
            lineageConflicts,
            idConflicts,
            folderConflicts,
            archiveForbidden,
        };
    }
    async collectArchiveForbidden(context, items) {
        if (items.length === 0)
            return [];
        const allowed = await this.workflowFinderService.findWorkflowIdsWithScopeForUser(items.map(({ existing }) => existing.id), context.user, ['workflow:delete']);
        return items.flatMap(({ sourceWorkflowId, existing, archiveTransition }) => {
            if (allowed.has(existing.id))
                return [];
            return [
                {
                    sourceWorkflowId,
                    existingWorkflowId: existing.id,
                    name: existing.name,
                    projectId: context.projectId,
                    transition: archiveTransition,
                },
            ];
        });
    }
    async collectIdConflicts(candidateIds) {
        const existing = await this.workflowImportMatchService.findOwningProjectsByWorkflowId(candidateIds);
        return candidateIds.flatMap((id) => {
            const location = existing.get(id);
            if (!location)
                return [];
            return [
                {
                    sourceWorkflowId: id,
                    existingWorkflowId: id,
                    existingProjectId: location.projectId,
                    isArchived: location.isArchived,
                    name: location.name,
                },
            ];
        });
    }
    async apply(context, plan, bindings) {
        const workflowBindings = new Map([
            ...bindings.workflows,
            ...collectPlannedWorkflowBindings(plan.items),
        ]);
        const resolvedBindings = { ...bindings, workflows: workflowBindings };
        const createItems = plan.items.filter((item) => item.action === 'create');
        const batchContext = createItems.length === 0
            ? undefined
            : await this.workflowCreationService.prepareBatchContext(context.user, context.projectId, createItems.flatMap((item) => {
                const folderId = item.parentFolderId ?? context.folderId;
                return folderId ? [folderId] : [];
            }), createItems.map(({ entity }) => entity), resolvedBindings.credentials);
        const outcomes = [];
        for (const item of plan.items) {
            outcomes.push(await this.applyItem(context, item, resolvedBindings, batchContext));
        }
        return { outcomes, bindings: resolvedBindings };
    }
    async applyItem(context, item, bindings, batchContext) {
        if (item.action === 'skip') {
            return {
                status: 'skipped',
                workflow: item.existing,
                sourceWorkflowId: item.sourceWorkflowId,
            };
        }
        return {
            status: item.action === 'create' ? 'created' : 'updated',
            workflow: await this.persistWorkflow(context, item, bindings, batchContext),
            sourceWorkflowId: item.sourceWorkflowId,
            item,
        };
    }
    async persistWorkflow(context, item, bindings, batchContext) {
        const tagIds = item.tagIds && [...new Set(item.tagIds)].filter((id) => !context.droppedTagIds.has(id));
        if (item.action === 'create') {
            const entity = prepareEntityForPersist(item.entity, bindings, item.decidedId);
            return await this.workflowCreationService.createWorkflow(context.user, entity, {
                projectId: context.projectId,
                parentFolderId: item.parentFolderId ?? context.folderId ?? undefined,
                publicApi: true,
                source: 'import',
                sourceWorkflowId: item.sourceWorkflowId,
                ...(batchContext ? { batchContext } : {}),
                ...(tagIds !== undefined ? { tagIds } : {}),
            });
        }
        const entity = prepareEntityForPersist(item.entity, bindings);
        const updated = await this.workflowService.update(context.user, entity, item.existing.id, {
            publicApi: true,
            source: 'import',
            allowArchivedUpdate: item.existing.isArchived,
            allowUnresolvedErrorWorkflow: true,
            ...(tagIds !== undefined ? { tagIds } : {}),
        });
        if (item.archiveTransition !== null) {
            return await this.transitionArchive(context, item, item.archiveTransition);
        }
        return updated;
    }
    async transitionArchive(context, item, transition) {
        const workflow = transition === 'archive'
            ? await this.workflowService.archive(context.user, item.existing.id, {
                skipArchived: true,
                publicApi: true,
            })
            : await this.workflowService.unarchive(context.user, item.existing.id, {
                publicApi: true,
            });
        if (!workflow) {
            throw new errors_1.ForbiddenError(`You do not have permission to ${transition} workflow ${item.existing.id}.`);
        }
        return workflow;
    }
};
exports.WorkflowImporter = WorkflowImporter;
exports.WorkflowImporter = WorkflowImporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_import_match_service_1.WorkflowImportMatchService, workflow_creation_service_1.WorkflowCreationService, workflow_service_1.WorkflowService, workflow_finder_service_1.WorkflowFinderService])
], WorkflowImporter);
function hasArchiveTransition(item) {
    return item.action === 'update' && item.archiveTransition !== null;
}
function planItemTargetId(item) {
    return item.action === 'create' ? item.decidedId : item.existing.id;
}
function collectPlannedWorkflowBindings(items) {
    return new Map(items.map((item) => [item.sourceWorkflowId, planItemTargetId(item)]));
}
function prepareEntityForPersist(source, bindings, decidedId) {
    const entity = Object.assign(new db_1.WorkflowEntity(), source, {
        nodes: structuredClone(source.nodes),
        ...(source.settings ? { settings: structuredClone(source.settings) } : {}),
        ...(decidedId !== undefined ? { id: decidedId } : {}),
    });
    applyCredentialBindingsInPlace(entity, bindings.credentials);
    for (const reference of workflow_references_1.workflowReferences)
        reference.apply(entity, bindings);
    return entity;
}
function applyCredentialBindingsInPlace(entity, credentialBindings) {
    (0, workflow_credential_references_1.visitWorkflowCredentials)(entity.nodes, (_credentialType, details) => {
        if (!details.id)
            return false;
        const targetId = credentialBindings.get(details.id);
        if (!targetId || targetId === details.id)
            return false;
        details.id = targetId;
        return true;
    });
}
function toPlanItem(prepared, existing, action, idPolicy) {
    if (existing === null) {
        return {
            action: 'create',
            decidedId: (0, workflow_id_policy_1.decideWorkflowId)(idPolicy, prepared.sourceWorkflowId),
            ...prepared,
        };
    }
    switch (action) {
        case 'update': {
            return {
                action,
                ...prepared,
                existing,
                archiveTransition: (0, workflow_archive_transition_1.decideWorkflowArchiveTransition)(prepared.sourceArchived, existing.isArchived),
            };
        }
        case 'skip':
            return { action, ...prepared, existing };
        case 'create':
            return {
                action,
                decidedId: (0, workflow_id_policy_1.decideWorkflowId)(idPolicy, prepared.sourceWorkflowId),
                ...prepared,
            };
    }
}
//# sourceMappingURL=workflow-importer.js.map