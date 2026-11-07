"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPackageSummary = toPackageSummary;
exports.toImportedWorkflowSummaries = toImportedWorkflowSummaries;
exports.buildImportResult = buildImportResult;
exports.reconcileVariableSummary = reconcileVariableSummary;
exports.toVariableSummary = toVariableSummary;
exports.toTagSummary = toTagSummary;
exports.unionTagSummaries = unionTagSummaries;
exports.identifyRequirements = identifyRequirements;
exports.scopeCredentialBindingsToRequirements = scopeCredentialBindingsToRequirements;
const n8n_packages_types_1 = require("../n8n-packages.types");
function toPackageSummary(manifest) {
    return {
        sourceN8nVersion: manifest.sourceN8nVersion,
        sourceId: manifest.sourceId,
        exportedAt: manifest.exportedAt,
    };
}
function toImportedWorkflowSummaries(outcomes, projectId, published) {
    return outcomes.map(({ workflow, sourceWorkflowId, status }) => {
        const result = published.get(sourceWorkflowId);
        const current = result?.workflow ?? workflow;
        return {
            sourceWorkflowId,
            localId: current.id,
            name: current.name,
            projectId,
            parentFolderId: current.parentFolder?.id ?? null,
            activeVersionId: current.activeVersionId ?? null,
            isArchived: current.isArchived,
            publishing: result?.publishing ?? { state: 'unchanged' },
            status,
        };
    });
}
function buildImportResult(input) {
    return {
        package: input.package,
        workflows: input.workflows,
        removedWorkflows: input.removedWorkflows,
        removedFolders: input.removedFolders,
        folders: input.folders,
        projects: input.projects,
        bindings: (0, n8n_packages_types_1.serializeBindings)(input.bindings),
        credentials: input.credentials,
        dataTables: input.dataTables,
        variables: input.variables,
        tags: input.tags,
    };
}
function reconcileVariableSummary(input) {
    const matched = new Set(input.matched);
    const created = new Set(input.created);
    const stubbed = new Set(input.stubbed);
    const skipped = new Set(input.skipped);
    const updated = new Set(input.updated);
    for (const name of skipped) {
        if (!created.has(name) && !stubbed.has(name))
            matched.add(name);
    }
    for (const name of updated) {
        matched.delete(name);
    }
    return {
        matched: [...matched],
        created: [...created],
        stubbed: [...stubbed],
        updated: [...updated],
        missing: [...new Set(input.missing)].filter((name) => !created.has(name) && !stubbed.has(name) && !skipped.has(name)),
    };
}
function toVariableSummary(plan, result) {
    return reconcileVariableSummary({
        matched: plan.matched,
        missing: plan.missing.map(({ name }) => name),
        created: result.created,
        stubbed: result.stubbed,
        skipped: result.skippedExisting,
        updated: result.updated,
    });
}
function toTagSummary(plan) {
    return {
        matched: plan.matched.map(({ name }) => name),
        created: plan.creations.map(({ name }) => name),
        renamed: plan.renames.map(({ to }) => to),
        reconciled: plan.reconciles.map(({ name }) => name),
        skipped: plan.dropped.map(({ name }) => name),
    };
}
function unionTagSummaries(summaries) {
    return {
        matched: [...new Set(summaries.flatMap(({ matched }) => matched))],
        created: [...new Set(summaries.flatMap(({ created }) => created))],
        renamed: [...new Set(summaries.flatMap(({ renamed }) => renamed))],
        reconciled: [...new Set(summaries.flatMap(({ reconciled }) => reconciled))],
        skipped: [...new Set(summaries.flatMap(({ skipped }) => skipped))],
    };
}
function identifyRequirements(requirements, workflows) {
    if (!requirements)
        return undefined;
    const importedIds = new Set(workflows.map((workflow) => workflow.sourceWorkflowId));
    return requirements
        .map((requirement) => ({
        ...requirement,
        usedBy: requirement.usedBy.filter(({ kind, id }) => kind === 'workflow' && importedIds.has(id)),
    }))
        .filter((requirement) => requirement.usedBy.length > 0);
}
function scopeCredentialBindingsToRequirements(bindings, requirements) {
    if (!bindings)
        return undefined;
    const requirementIds = new Set((requirements ?? []).map((requirement) => requirement.id));
    return new Map([...bindings].filter(([sourceId]) => requirementIds.has(sourceId)));
}
//# sourceMappingURL=import-result.js.map