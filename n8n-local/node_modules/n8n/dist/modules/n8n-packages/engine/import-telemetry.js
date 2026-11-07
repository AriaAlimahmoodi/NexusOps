"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitPackageImportedEvent = emitPackageImportedEvent;
const credential_conflict_policy_1 = require("../entities/credential/credential-conflict-policy");
const n8n_packages_types_1 = require("../n8n-packages.types");
const import_result_1 = require("./import-result");
function emitPackageImportedEvent(eventService, params) {
    const { request, manifest, scopes } = params;
    const workflowOutcomes = scopes.flatMap(({ imported }) => imported.workflowOutcomes);
    const removedWorkflows = scopes.flatMap(({ imported }) => imported.removedWorkflows);
    const credentialResults = scopes.map(({ imported }) => imported.credentialResult);
    const importedWorkflows = workflowOutcomes.filter(({ status }) => status !== 'skipped');
    const countByStatus = (status) => workflowOutcomes.filter((outcome) => outcome.status === status).length;
    const credentialRequirements = scopes.reduce((total, { credentialRequest }) => total + (credentialRequest.requirements?.length ?? 0), 0);
    const matchedCredentialIds = credentialResults.flatMap(({ matched, bindings }) => matched.map((sourceId) => bindings.get(sourceId)));
    const createdCredentialIds = credentialResults.flatMap(({ stubbed, seeded, incomplete, bindings }) => [...stubbed, ...seeded, ...incomplete].map((sourceId) => bindings.get(sourceId)));
    const dataTablePlans = scopes.map(({ imported }) => imported.dataTablePlan);
    const dataTableRequirements = scopes.reduce((total, { dataTableRequest }) => total + (dataTableRequest.requirements?.length ?? 0), 0);
    const dataTablesMatched = dataTablePlans.reduce((total, plan) => total + plan.matchedCount, 0);
    const dataTablesCreated = dataTablePlans.reduce((total, plan) => total + plan.creations.length, 0);
    const dataTablesUpdated = dataTablePlans.reduce((total, plan) => total + plan.updates.length, 0);
    const variableRequirements = scopes.reduce((total, { variableRequest }) => total + (variableRequest.requirements?.length ?? 0), 0);
    const variableSummary = (0, import_result_1.reconcileVariableSummary)({
        matched: scopes.flatMap(({ imported }) => imported.variablePlan.matched),
        missing: scopes.flatMap(({ imported }) => imported.variablePlan.missing.map(({ name }) => name)),
        created: scopes.flatMap(({ imported }) => imported.variableResult.created),
        stubbed: scopes.flatMap(({ imported }) => imported.variableResult.stubbed),
        skipped: scopes.flatMap(({ imported }) => imported.variableResult.skippedExisting),
        updated: scopes.flatMap(({ imported }) => imported.variableResult.updated),
    });
    const countRows = (pick) => scopes.reduce((total, { imported }) => total + pick(imported).length, 0);
    const tagPlans = scopes.map(({ imported }) => imported.tagPlan);
    const uniqueTagIds = (pick) => new Set(tagPlans.flatMap((plan) => pick(plan).map(({ id }) => id))).size;
    const tagRequirements = new Set(scopes.flatMap(({ tagRequest }) => (tagRequest.requirements ?? []).map(({ id }) => id))).size;
    const folderId = scopes.length === 1 ? scopes[0].context.folderId : null;
    eventService.emit('n8n-package-imported', {
        user: request.user,
        projectIds: scopes.map(({ context }) => context.projectId),
        folderId,
        workflowIds: importedWorkflows.map(({ workflow }) => workflow.id),
        options: {
            workflowConflictPolicy: request.workflowConflictPolicy,
            workflowIdPolicy: request.workflowIdPolicy,
            credentialMatchingMode: request.credentialMatchingMode,
            credentialMissingMode: request.credentialMissingMode,
            credentialConflictPolicy: (0, credential_conflict_policy_1.resolveCredentialConflictPolicy)(request.credentialConflictPolicy),
            workflowPublishingPolicy: request.workflowPublishingPolicy,
            missingNodeTypeMode: request.missingNodeTypeMode,
            projectConflictPolicy: request.projectConflictPolicy,
            folderConflictPolicy: request.folderConflictPolicy,
            overwriteDeletionPolicy: request.overwriteDeletionPolicy,
            dataTableMatchingMode: request.dataTableMatchingMode,
            dataTableMissingMode: request.dataTableMissingMode,
            dataTableSchemaConflictPolicy: request.dataTableSchemaConflictPolicy,
            variableMissingMode: request.variableMissingMode,
            variableConflictPolicy: request.variableConflictPolicy,
            variableParentPolicy: request.variableParentPolicy ?? n8n_packages_types_1.VariableParentPolicy.Project,
            tagMissingMode: request.tagMissingMode,
            tagConflictPolicy: request.tagConflictPolicy,
        },
        packageSourceId: manifest.sourceId,
        packageVersion: manifest.packageFormatVersion,
        credentialIds: {
            matched: matchedCredentialIds,
            created: createdCredentialIds,
            updated: [],
        },
        counts: {
            workflows: {
                created: countByStatus('created'),
                updated: countByStatus('updated'),
                skipped: countByStatus('skipped'),
                archived: removedWorkflows.filter(({ deletion }) => deletion === 'archived').length,
                deleted: removedWorkflows.filter(({ deletion }) => deletion === 'deleted').length,
            },
            folders: {
                removed: scopes.reduce((total, { imported }) => total + imported.removedFolders.length, 0),
            },
            credentials: {
                matched: matchedCredentialIds.length,
                created: createdCredentialIds.length,
                requirements: credentialRequirements,
            },
            dataTables: {
                matched: dataTablesMatched,
                created: dataTablesCreated,
                updated: dataTablesUpdated,
                requirements: dataTableRequirements,
            },
            variables: {
                matched: variableSummary.matched.length,
                missing: variableSummary.missing.length,
                created: countRows(({ variableResult }) => variableResult.created),
                stubbed: countRows(({ variableResult }) => variableResult.stubbed),
                updated: countRows(({ variableResult }) => variableResult.updated),
                requirements: variableRequirements,
            },
            tags: {
                matched: uniqueTagIds((plan) => plan.matched),
                created: uniqueTagIds((plan) => plan.creations),
                renamed: uniqueTagIds((plan) => plan.renames),
                reconciled: uniqueTagIds((plan) => plan.reconciles),
                skipped: uniqueTagIds((plan) => plan.dropped),
                requirements: tagRequirements,
            },
        },
    });
}
//# sourceMappingURL=import-telemetry.js.map