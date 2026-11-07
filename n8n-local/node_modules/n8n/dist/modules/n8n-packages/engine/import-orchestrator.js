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
exports.ImportOrchestrator = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const node_types_1 = require("../../../node-types");
const credential_conflict_policy_1 = require("../entities/credential/credential-conflict-policy");
const credential_importer_1 = require("../entities/credential/credential-importer");
const credential_missing_mode_1 = require("../entities/credential/credential-missing-mode");
const data_table_importer_1 = require("../entities/data-table/data-table-importer");
const folder_conflict_policy_1 = require("../entities/folder/folder-conflict-policy");
const folder_importer_1 = require("../entities/folder/folder-importer");
const folder_remover_1 = require("../entities/folder/folder-remover");
const tag_importer_1 = require("../entities/tag/tag-importer");
const tag_types_1 = require("../entities/tag/tag.types");
const variable_importer_1 = require("../entities/variable/variable-importer");
const variable_types_1 = require("../entities/variable/variable.types");
const missing_node_type_mode_1 = require("../entities/workflow/missing-node-type-mode");
const workflow_importer_1 = require("../entities/workflow/workflow-importer");
const workflow_remover_1 = require("../entities/workflow/workflow-remover");
const workflow_publisher_1 = require("../entities/workflow/workflow-publisher");
const n8n_packages_types_1 = require("../n8n-packages.types");
const requirement_consumers_1 = require("../spec/requirement-consumers");
const content_import_policy_1 = require("./content-import-policy");
const credential_save_policy_1 = require("./credential-save-policy");
const import_blocked_error_1 = require("./import-blocked.error");
const import_gates_1 = require("./import-gates");
let ImportOrchestrator = class ImportOrchestrator {
    constructor(credentialImporter, dataTableImporter, variableImporter, tagImporter, folderImporter, folderRemover, workflowImporter, workflowRemover, workflowPublisher, contentImportPolicyGate, credentialSavePolicyGate, nodeTypes, licenseState) {
        this.credentialImporter = credentialImporter;
        this.dataTableImporter = dataTableImporter;
        this.variableImporter = variableImporter;
        this.tagImporter = tagImporter;
        this.folderImporter = folderImporter;
        this.folderRemover = folderRemover;
        this.workflowImporter = workflowImporter;
        this.workflowRemover = workflowRemover;
        this.workflowPublisher = workflowPublisher;
        this.contentImportPolicyGate = contentImportPolicyGate;
        this.credentialSavePolicyGate = credentialSavePolicyGate;
        this.nodeTypes = nodeTypes;
        this.licenseState = licenseState;
    }
    async assertNotBlocked(plans, options) {
        const creations = plans.flatMap((plan) => plan.variablePlan.creations);
        const overwrites = plans.flatMap((plan) => plan.variablePlan.overwrites);
        (0, import_gates_1.assertVariableWritesAllowed)({
            licenseState: this.licenseState,
            apiKeyScopes: options.apiKeyScopes,
            hasCreations: creations.length > 0,
            hasOverwrites: overwrites.length > 0,
        });
        (0, import_gates_1.assertDataTableWritesAllowed)(options.apiKeyScopes, plans.map((plan) => plan.dataTablePlan));
        (0, import_gates_1.assertCredentialWritesAllowed)(options.apiKeyScopes, plans.map(({ input, credentialPlan }) => ({
            missingMode: input.credentialRequest.missingMode,
            resolution: credentialPlan,
        })));
        for (const { input, variablePlan, credentialPlan } of plans) {
            await this.credentialImporter.assertCanCreate(input.context, input.credentialRequest, credentialPlan);
            if (variablePlan.creations.length > 0) {
                await this.variableImporter.assertCanCreate(input.context, variablePlan.creations, input.projectPendingCreation ?? false);
            }
            if (variablePlan.overwrites.length > 0) {
                await this.variableImporter.assertCanUpdate(input.context, variablePlan.overwrites);
            }
        }
        const issues = await this.collectPackageBlockingIssues(plans);
        if (issues.length > 0)
            throw (0, import_blocked_error_1.toImportBlockedError)(issues);
    }
    async collectPackageBlockingIssues(plans) {
        const issues = plans.flatMap((plan) => plan.blockingIssues);
        issues.push(...(0, tag_types_1.contestedReconcileTargetFailures)(plans.map((plan) => plan.tagPlan)).map((failure) => toTagBlockingIssue(failure, plans)));
        const divergent = new Set((0, variable_types_1.divergentOverwrites)(plans.flatMap((plan) => plan.variablePlan.overwrites)));
        for (const { input, variablePlan } of plans) {
            issues.push(...variablePlan.overwrites
                .filter((overwrite) => divergent.has(overwrite))
                .map(({ variableId, value, ...conflict }) => ({
                type: 'variable-conflict',
                ...conflict,
                usedBy: variableConsumers(input.variableRequest, conflict.name),
            })));
        }
        if (plans.length > 0) {
            const credentialPlans = plans.map((plan) => plan.credentialPlan);
            for (const forbidden of (0, credential_conflict_policy_1.forbiddenCredentialUpdates)(credentialPlans)) {
                issues.push({ type: 'credential-update-forbidden', ...forbidden });
            }
            const conflicts = (0, credential_conflict_policy_1.credentialConflicts)(plans[0].input.credentialRequest.conflictPolicy, credentialPlans);
            for (const conflict of conflicts) {
                issues.push({ type: 'credential-conflict', ...conflict });
            }
        }
        const quotaFailure = await this.variableImporter.quotaFailure(plans.flatMap((plan) => plan.variablePlan.creations));
        if (quotaFailure) {
            const consumers = plans.flatMap(({ input, variablePlan }) => {
                const createdNames = new Set(variablePlan.creations.map(({ name }) => name));
                return (input.variableRequest.requirements ?? [])
                    .filter(({ name }) => createdNames.has(name))
                    .flatMap(({ usedBy }) => usedBy);
            });
            issues.push({
                type: 'variable-limit-exceeded',
                ...quotaFailure,
                usedBy: (0, requirement_consumers_1.mergeRequirementConsumers)(consumers),
            });
        }
        return issues;
    }
    async plan(input) {
        const { context, folders, workflows, credentialRequest, dataTableRequest, variableRequest, tagRequest, options, } = input;
        await this.workflowPublisher.assertCanPublish(context.user, context.projectId, options.workflowPublishingPolicy, input.projectPendingCreation);
        const credentialPlan = await this.credentialImporter.plan(context, credentialRequest);
        const dataTablePlan = await this.dataTableImporter.plan(context, dataTableRequest);
        const variablePlan = await this.variableImporter.plan(context, variableRequest);
        const workflowPlan = await this.workflowImporter.plan(context, workflows, options);
        const tagPlan = await this.tagImporter.plan(context, tagRequest, workflowPlan.items.filter((item) => item.action !== 'skip'));
        const folderContext = { ...context, folderConflictPolicy: options.folderConflictPolicy };
        const folderPlan = await this.folderImporter.plan(folderContext, folders);
        const packageFolderIds = folders.map(({ sourceFolderId }) => sourceFolderId);
        const removalPlan = await this.workflowRemover.plan(context, {
            folderConflictPolicy: options.folderConflictPolicy,
            deletionPolicy: options.overwriteDeletionPolicy,
            workflowItems: workflowPlan.items,
            packageFolderIds,
            subWorkflowRequirementIds: input.subWorkflowRequirements?.map(({ id }) => id),
            projectPendingCreation: input.projectPendingCreation,
            importSource: input.importSource,
            explicitDeleteIds: input.explicitDeleteWorkflowIds,
        });
        const folderRemovalPlan = (0, folder_conflict_policy_1.removesUnpackagedWorkflows)(options.folderConflictPolicy) && !input.projectPendingCreation
            ? await this.folderRemover.plan(context, {
                packageFolderIds,
                occupiedFolderIds: removalPlan.occupiedFolderIds,
            })
            : { removals: [], failures: [] };
        const missingNodeTypes = (0, missing_node_type_mode_1.collectMissingNodeTypes)(workflowPlan.items.filter((item) => item.action !== 'skip'), (nodeType) => this.nodeTypes.getSupportedVersions(nodeType));
        const actor = { kind: 'user', user: context.user };
        const refusedByPolicy = await this.contentImportPolicyGate.refusedWorkflows(workflowPlan.items, context.projectId, (0, content_import_policy_1.contentImportTransport)(input.importSource), actor);
        const refusedStubs = await this.credentialSavePolicyGate.refusedStubs(credentialRequest, credentialPlan, context.projectId, actor);
        const blockingIssues = this.collectBlockingIssues({
            workflowPlan,
            credentialPlan,
            credentialRequest,
            folderPlan,
            dataTableRequest,
            dataTablePlan,
            variableRequest,
            variablePlan,
            tagPlan,
            removalPlan,
            folderRemovalPlan,
            missingNodeTypes,
            missingNodeTypeMode: options.missingNodeTypeMode,
        });
        blockingIssues.push(...refusedByPolicy, ...refusedStubs);
        return {
            input,
            folderContext,
            credentialPlan,
            workflowPlan,
            folderPlan,
            dataTablePlan,
            variablePlan,
            tagPlan,
            removalPlan,
            folderRemovalPlan,
            missingNodeTypes,
            blockingIssues,
        };
    }
    async apply(plan, seedWorkflowBindings) {
        const { input, folderContext, credentialPlan, workflowPlan, folderPlan, dataTablePlan, variablePlan, tagPlan, } = plan;
        const { context, credentialRequest } = input;
        await this.tagImporter.apply(context, tagPlan);
        const folderSummaries = await this.folderImporter.apply(folderContext, folderPlan);
        const credentialResult = await this.credentialImporter.apply(context, credentialRequest, credentialPlan);
        await this.dataTableImporter.apply(context, dataTablePlan);
        const blockedFromPublish = new Map();
        for (const sourceWorkflowId of (0, credential_missing_mode_1.workflowsBlockedFromPublish)(credentialRequest.requirements, new Set(credentialResult.incomplete))) {
            blockedFromPublish.set(sourceWorkflowId, 'incomplete-credential');
        }
        for (const sourceWorkflowId of (0, credential_missing_mode_1.workflowsBlockedFromPublish)(credentialRequest.requirements, new Set(credentialResult.stubbed))) {
            blockedFromPublish.set(sourceWorkflowId, 'stub-credential');
        }
        for (const sourceWorkflowId of (0, missing_node_type_mode_1.workflowsWithMissingNodeTypes)(plan.missingNodeTypes)) {
            blockedFromPublish.set(sourceWorkflowId, 'missing-node-type');
        }
        const { outcomes, bindings } = await this.workflowImporter.apply({ ...context, droppedTagIds: (0, tag_types_1.droppedTagIds)(tagPlan) }, workflowPlan, (0, n8n_packages_types_1.createBindings)({
            credentials: credentialResult.bindings,
            ...(seedWorkflowBindings ? { workflows: seedWorkflowBindings } : {}),
        }));
        const variableResult = await this.variableImporter.apply(context, variablePlan);
        const removedWorkflows = await this.workflowRemover.apply(context, plan.removalPlan);
        const removedFolders = await this.folderRemover.apply(context, plan.folderRemovalPlan);
        return {
            workflowOutcomes: outcomes.map((outcome) => withBlockedFromPublish(outcome, blockedFromPublish.get(outcome.sourceWorkflowId))),
            removedWorkflows,
            removedFolders,
            folderSummaries,
            bindings,
            credentialResult,
            dataTablePlan,
            variablePlan,
            variableResult,
            tagPlan,
        };
    }
    collectBlockingIssues({ workflowPlan, credentialPlan, credentialRequest, folderPlan, dataTableRequest, dataTablePlan, variableRequest, variablePlan, tagPlan, removalPlan, folderRemovalPlan, missingNodeTypes, missingNodeTypeMode, }) {
        return [
            ...workflowPlan.conflicts.map((conflict) => ({ type: 'workflow-conflict', ...conflict })),
            ...workflowPlan.lineageConflicts.map((conflict) => ({ type: 'workflow-lineage-conflict', ...conflict })),
            ...workflowPlan.idConflicts.map((conflict) => ({ type: 'workflow-id-conflict', ...conflict })),
            ...workflowPlan.folderConflicts.map((conflict) => ({ type: 'workflow-folder-conflict', ...conflict })),
            ...workflowPlan.archiveForbidden.map((failure) => ({ type: 'workflow-archive-forbidden', ...failure })),
            ...folderPlan.conflicts.map((conflict) => ({ type: 'folder-conflict', ...conflict })),
            ...removalPlan.failures.map((failure) => ({ type: 'workflow-removal-forbidden', ...failure })),
            ...removalPlan.conflicts.map((conflict) => ({ type: 'workflow-removal-conflict', ...conflict })),
            ...folderRemovalPlan.failures.map((failure) => ({ type: 'folder-removal-forbidden', ...failure })),
            ...dataTablePlan.failures.map((failure) => toDataTableBlockingIssue(failure, dataTableRequest, dataTablePlan)),
            ...tagPlan.failures.map((failure) => toTagBlockingIssue(failure, [{ tagPlan, workflowPlan }])),
            ...this.credentialImporter
                .blockingFailures(credentialRequest, credentialPlan)
                .map((failure) => toCredentialBlockingIssue(failure, credentialRequest)),
            ...this.variableImporter.blockingFailures(variableRequest, variablePlan).map((failure) => ({
                type: 'variable-unresolved',
                ...failure,
                usedBy: variableConsumers(variableRequest, failure.name),
            })),
            ...this.variableImporter.blockingConflicts(variableRequest, variablePlan).map((conflict) => ({
                type: 'variable-conflict',
                ...conflict,
                usedBy: variableConsumers(variableRequest, conflict.name),
            })),
            ...(0, missing_node_type_mode_1.missingNodeTypeBlockingFailures)(missingNodeTypeMode, missingNodeTypes).map((requirement) => ({
                type: 'missing-node-type',
                nodeType: requirement.type,
                typeVersion: requirement.typeVersion,
                usedBy: requirement.usedBy,
            })),
        ];
    }
};
exports.ImportOrchestrator = ImportOrchestrator;
exports.ImportOrchestrator = ImportOrchestrator = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credential_importer_1.CredentialImporter, data_table_importer_1.DataTableImporter, variable_importer_1.VariableImporter, tag_importer_1.TagImporter, folder_importer_1.FolderImporter, folder_remover_1.FolderRemover, workflow_importer_1.WorkflowImporter, workflow_remover_1.WorkflowRemover, workflow_publisher_1.WorkflowPublisher, content_import_policy_1.ContentImportPolicyGate, credential_save_policy_1.CredentialSavePolicyGate, node_types_1.NodeTypes, backend_common_1.LicenseState])
], ImportOrchestrator);
function withBlockedFromPublish(outcome, blockedFromPublish) {
    if (outcome.status === 'skipped' || !blockedFromPublish)
        return outcome;
    return { ...outcome, blockedFromPublish };
}
function toCredentialBlockingIssue(failure, request) {
    const { kind, sourceId, targetId, expectedType, actualType } = failure;
    return {
        type: 'credential-unresolved',
        kind,
        sourceId,
        ...(targetId ? { targetId } : {}),
        ...(expectedType ? { expectedType } : {}),
        ...(actualType ? { actualType } : {}),
        usedBy: (0, requirement_consumers_1.mergeRequirementConsumers)(request.requirements?.find(({ id }) => id === sourceId)?.usedBy ?? []),
    };
}
function toDataTableBlockingIssue(failure, request, plan) {
    let requirements = request.requirements ?? [];
    if (failure.sourceId) {
        requirements = requirements.filter(({ id }) => id === failure.sourceId);
    }
    else if (failure.kind === 'permission-denied') {
        const writtenIds = new Set(failure.missingScope === 'dataTable:create'
            ? plan.creations.map(({ id }) => id)
            : [
                ...plan.updates.map(({ table }) => table.id),
                ...plan.columnAlignments.map(({ id }) => id),
            ]);
        requirements = requirements.filter(({ id }) => writtenIds.has(id));
    }
    return {
        type: 'data-table-unresolved',
        ...failure,
        usedBy: (0, requirement_consumers_1.mergeRequirementConsumers)(requirements.flatMap(({ usedBy }) => usedBy)),
    };
}
function toTagBlockingIssue(failure, plans) {
    const consumers = plans.flatMap(({ tagPlan, workflowPlan }) => {
        let tagIds;
        if (failure.sourceId) {
            tagIds = [failure.sourceId];
        }
        else if (failure.missingScope === 'tag:create') {
            tagIds = tagPlan.creations.map(({ id }) => id);
        }
        else {
            tagIds = [...tagPlan.renames, ...tagPlan.reconciles].map(({ id }) => id);
        }
        return workflowPlan.items
            .filter((item) => item.action !== 'skip' && item.tagIds?.some((id) => tagIds.includes(id)))
            .map(({ sourceWorkflowId }) => ({
            kind: 'workflow',
            id: sourceWorkflowId,
        }));
    });
    return { type: 'tag-unresolved', ...failure, usedBy: (0, requirement_consumers_1.mergeRequirementConsumers)(consumers) };
}
function variableConsumers(request, name) {
    return (0, requirement_consumers_1.mergeRequirementConsumers)(request.requirements?.find((requirement) => requirement.name === name)?.usedBy ?? []);
}
//# sourceMappingURL=import-orchestrator.js.map