import type { TagImportPlan } from '../entities/tag/tag.types';
import type { VariableApplyResult, VariableImportPlan } from '../entities/variable/variable.types';
import type { PersistedWorkflowOutcome, PreparedWorkflow } from '../entities/workflow/workflow-import.types';
import type { PackagePublishingResults } from '../entities/workflow/workflow-publisher';
import type { RemovedFolderSummary, RemovedWorkflowSummary, ImportBindingMap, ImportCredentialSummary, ImportDataTableSummary, ImportedFolderSummary, ImportedProjectSummary, ImportedWorkflowSummary, ImportPackageSummary, ImportResult, ImportTagSummary, ImportVariableSummary, PackageImportBindings } from '../n8n-packages.types';
import type { PackageManifest } from '../spec/manifest.schema';
import type { PackageCredentialRequirement, PackageRequirementConsumer } from '../spec/requirements.schema';
export declare function toPackageSummary(manifest: PackageManifest): ImportPackageSummary;
export declare function toImportedWorkflowSummaries(outcomes: PersistedWorkflowOutcome[], projectId: string, published: PackagePublishingResults): ImportedWorkflowSummary[];
export declare function buildImportResult(input: {
    package: ImportPackageSummary;
    workflows: ImportedWorkflowSummary[];
    removedWorkflows: RemovedWorkflowSummary[];
    removedFolders: RemovedFolderSummary[];
    folders: ImportedFolderSummary[];
    projects: ImportedProjectSummary[];
    bindings: PackageImportBindings;
    credentials: ImportCredentialSummary;
    dataTables: ImportDataTableSummary;
    variables: ImportVariableSummary;
    tags: ImportTagSummary;
}): ImportResult;
export declare function reconcileVariableSummary(input: {
    matched: Iterable<string>;
    missing: Iterable<string>;
    created: Iterable<string>;
    stubbed: Iterable<string>;
    skipped: Iterable<string>;
    updated: Iterable<string>;
}): ImportVariableSummary;
export declare function toVariableSummary(plan: VariableImportPlan, result: VariableApplyResult): ImportVariableSummary;
export declare function toTagSummary(plan: TagImportPlan): ImportTagSummary;
export declare function unionTagSummaries(summaries: ImportTagSummary[]): ImportTagSummary;
export declare function identifyRequirements<T extends {
    usedBy: PackageRequirementConsumer[];
}>(requirements: T[] | undefined, workflows: PreparedWorkflow[]): T[] | undefined;
export declare function scopeCredentialBindingsToRequirements(bindings: ImportBindingMap | undefined, requirements: PackageCredentialRequirement[] | undefined): ImportBindingMap | undefined;
