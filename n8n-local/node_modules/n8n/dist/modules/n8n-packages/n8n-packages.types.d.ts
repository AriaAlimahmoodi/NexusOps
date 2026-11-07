import type { PolicyViolation } from '@n8n/api-types';
import type { User } from '@n8n/db';
import type { Readable } from 'node:stream';
import type { CredentialConflict, CredentialUpdateForbidden } from './entities/credential/credential.types';
import type { DataTableResolutionFailure } from './entities/data-table/data-table.types';
import type { TagResolutionFailure } from './entities/tag/tag.types';
import type { VariableConflict, VariableLimitFailure, VariableResolutionFailure } from './entities/variable/variable.types';
import type { WorkflowIdConflict, WorkflowLineageConflict } from './entities/workflow/workflow-import-match.service';
import type { WorkflowArchiveForbidden, WorkflowConflict, WorkflowFolderConflict } from './entities/workflow/workflow-import.types';
import type { WorkflowPublishingOutcome, WorkflowPublishingPolicy } from './entities/workflow/workflow-publishing-policy.types';
import type { PackageManifest } from './spec/manifest.schema';
import type { PackageRequirementConsumer } from './spec/requirements.schema';
export type { CredentialResolution } from './entities/credential/credential.types';
export { WorkflowPublishingPolicy } from './entities/workflow/workflow-publishing-policy.types';
export type { WorkflowPublishingOutcome } from './entities/workflow/workflow-publishing-policy.types';
export type CredentialMatchingMode = 'id-only' | 'name-and-type' | 'type-only';
export type CredentialMissingMode = 'must-preexist' | 'create-stub' | 'create-with-values';
export type PackageFailureReason = 'access-denied' | 'entity-not-found' | 'blocked' | 'validation';
export declare const WorkflowConflictPolicy: {
    readonly NewVersion: 'new-version';
    readonly Fail: 'fail';
    readonly Skip: 'skip';
};
export declare const WorkflowIdPolicy: {
    readonly New: 'new';
    readonly Source: 'source';
};
export declare const ProjectConflictPolicy: {
    readonly Merge: 'merge';
    readonly Fail: 'fail';
    readonly Overwrite: 'overwrite';
};
export declare const FolderConflictPolicy: {
    readonly Merge: 'merge';
    readonly Fail: 'fail';
    readonly Overwrite: 'overwrite';
};
export declare const OverwriteDeletionPolicy: {
    readonly Archive: 'archive';
    readonly HardDelete: 'hard-delete';
};
export declare const MissingNodeTypeMode: {
    readonly Fail: 'fail';
    readonly ImportAnyway: 'import-anyway';
};
export declare const ExportDependencyPolicy: {
    readonly Fail: 'fail';
    readonly ReferenceOnly: 'reference-only';
    readonly IncludeInPackage: 'include-in-package';
};
export declare const ExportVersionPolicy: {
    readonly PublishedStrict: 'published-strict';
    readonly PreferPublished: 'prefer-published';
    readonly IgnoreUnpublished: 'ignore-unpublished';
    readonly Latest: 'latest';
};
export declare const CredentialExportPolicy: {
    readonly ExpressionValuesOnly: 'expression-values-only';
    readonly NoValues: 'no-values';
};
export declare const DataTableMatchingMode: {
    readonly ById: 'by-id';
};
export declare const DataTableMissingMode: {
    readonly Create: 'create';
    readonly MustPreexist: 'must-preexist';
    readonly DoNothing: 'do-nothing';
};
export declare const DataTableSchemaConflictPolicy: {
    readonly KeepExisting: 'keep-existing';
    readonly Fail: 'fail';
    readonly Overwrite: 'overwrite';
    readonly OverwriteNonDestructive: 'overwrite-non-destructive';
};
export declare const VariableMissingMode: {
    readonly DoNothing: 'do-nothing';
    readonly MustPreexist: 'must-preexist';
    readonly CreateStub: 'create-stub';
    readonly CreateWithValue: 'create-with-value';
};
export declare const VariableConflictPolicy: {
    readonly KeepExisting: 'keep-existing';
    readonly Overwrite: 'overwrite';
    readonly Fail: 'fail';
};
export declare const CredentialConflictPolicy: {
    readonly KeepExisting: 'keep-existing';
    readonly Overwrite: 'overwrite';
    readonly Fail: 'fail';
};
export declare const VariableParentPolicy: {
    readonly Project: 'project';
    readonly Global: 'global';
};
export declare const TagMissingMode: {
    readonly Create: 'create';
    readonly DoNothing: 'do-nothing';
};
export declare const TagConflictPolicy: {
    readonly Skip: 'skip';
    readonly Fail: 'fail';
    readonly Rename: 'rename';
};
export type WorkflowConflictPolicy = (typeof WorkflowConflictPolicy)[keyof typeof WorkflowConflictPolicy];
export type WorkflowIdPolicy = (typeof WorkflowIdPolicy)[keyof typeof WorkflowIdPolicy];
export type ProjectConflictPolicy = (typeof ProjectConflictPolicy)[keyof typeof ProjectConflictPolicy];
export type FolderConflictPolicy = (typeof FolderConflictPolicy)[keyof typeof FolderConflictPolicy];
export type OverwriteDeletionPolicy = (typeof OverwriteDeletionPolicy)[keyof typeof OverwriteDeletionPolicy];
export type MissingNodeTypeMode = (typeof MissingNodeTypeMode)[keyof typeof MissingNodeTypeMode];
export type ExportDependencyPolicy = (typeof ExportDependencyPolicy)[keyof typeof ExportDependencyPolicy];
export type ExportVersionPolicy = (typeof ExportVersionPolicy)[keyof typeof ExportVersionPolicy];
export type CredentialExportPolicy = (typeof CredentialExportPolicy)[keyof typeof CredentialExportPolicy];
export type DataTableMatchingMode = (typeof DataTableMatchingMode)[keyof typeof DataTableMatchingMode];
export type DataTableMissingMode = (typeof DataTableMissingMode)[keyof typeof DataTableMissingMode];
export type DataTableSchemaConflictPolicy = (typeof DataTableSchemaConflictPolicy)[keyof typeof DataTableSchemaConflictPolicy];
export type VariableMissingMode = (typeof VariableMissingMode)[keyof typeof VariableMissingMode];
export type VariableConflictPolicy = (typeof VariableConflictPolicy)[keyof typeof VariableConflictPolicy];
export type CredentialConflictPolicy = (typeof CredentialConflictPolicy)[keyof typeof CredentialConflictPolicy];
export type VariableParentPolicy = (typeof VariableParentPolicy)[keyof typeof VariableParentPolicy];
export type TagMissingMode = (typeof TagMissingMode)[keyof typeof TagMissingMode];
export type TagConflictPolicy = (typeof TagConflictPolicy)[keyof typeof TagConflictPolicy];
export interface ExportPackageRequest {
    user: User;
    agentIds?: string[];
    workflowIds?: string[];
    folderIds?: string[];
    projectIds?: string[];
    projectWorkflowIds?: string[];
    includeAgents?: boolean;
    includeVariableValues?: boolean;
    canExportVariableValues?: boolean;
    includeTags?: boolean;
    includeArchivedWorkflows?: boolean;
    dependencyPolicy?: ExportDependencyPolicy;
    versionPolicy?: ExportVersionPolicy;
    credentialExportPolicy?: CredentialExportPolicy;
}
export type PackageImportSource = 'package-import' | 'git-pull';
export type ImportRequest = {
    user: User;
    projectId?: string;
    folderId?: string;
    bindings?: Partial<PackageImportBindings>;
    apiKeyScopes?: string[];
    selection?: ImportSelection;
} & ImportCredentialProperties & ImportWorkflowProperties & ImportProjectProperties & ImportFolderProperties & ImportDataTableProperties & ImportVariableProperties & ImportTagProperties;
export type ImportPackageRequest = ImportRequest & {
    packageBuffer: Buffer;
};
export interface ImportSelection {
    selectedProjectId: string;
    selectedWorkflowIds: string[];
    deletedWorkflowIds?: string[];
}
export type ImportSelectionRequest = {
    user: User;
    apiKeyScopes?: string[];
    bindings?: Partial<PackageImportBindings>;
    workflowConflictPolicy?: WorkflowConflictPolicy;
    workflowIdPolicy?: WorkflowIdPolicy;
    overwriteDeletionPolicy?: OverwriteDeletionPolicy;
    dataTableSchemaConflictPolicy?: DataTableSchemaConflictPolicy;
};
export type ImportPackageSelectionRequest = ImportSelectionRequest & {
    packageBuffer: Buffer;
};
export type ImportCredentialProperties = {
    credentialMatchingMode: CredentialMatchingMode;
    credentialMissingMode: CredentialMissingMode;
    credentialConflictPolicy?: CredentialConflictPolicy;
};
export type ImportWorkflowProperties = {
    workflowConflictPolicy: WorkflowConflictPolicy;
    workflowPublishingPolicy: WorkflowPublishingPolicy;
    workflowIdPolicy: WorkflowIdPolicy;
    missingNodeTypeMode: MissingNodeTypeMode;
};
export type ImportProjectProperties = {
    projectConflictPolicy: ProjectConflictPolicy;
};
export type ResolvedImportFolderProperties = ImportFolderProperties & {
    folderConflictPolicy: FolderConflictPolicy;
};
export type ResolvedImportRequest = ImportRequest & ResolvedImportFolderProperties;
export type ResolvedImportPackageRequest = ImportPackageRequest & ResolvedImportFolderProperties;
export type ImportFolderProperties = {
    folderConflictPolicy?: FolderConflictPolicy;
    overwriteDeletionPolicy: OverwriteDeletionPolicy;
};
export type ImportDataTableProperties = {
    dataTableMatchingMode: DataTableMatchingMode;
    dataTableMissingMode: DataTableMissingMode;
    dataTableSchemaConflictPolicy: DataTableSchemaConflictPolicy;
};
export type ImportVariableProperties = {
    variableMissingMode: VariableMissingMode;
    variableConflictPolicy: VariableConflictPolicy;
    variableParentPolicy?: VariableParentPolicy;
};
export type ImportTagProperties = {
    tagMissingMode: TagMissingMode;
    tagConflictPolicy: TagConflictPolicy;
};
export interface ImportContext {
    user: User;
    projectId: string;
    folderId: string | null;
}
export type ImportPackageEventOptions = Required<ImportCredentialProperties> & ImportWorkflowProperties & ImportProjectProperties & ResolvedImportFolderProperties & ImportDataTableProperties & ImportVariableProperties & ImportTagProperties;
export type ImportAuditCredentialIds = {
    matched: string[];
    created: string[];
    updated: string[];
};
export type ImportPackageEventCounts = {
    workflows: {
        created: number;
        updated: number;
        skipped: number;
        archived: number;
        deleted: number;
    };
    folders: {
        removed: number;
    };
    credentials: {
        matched: number;
        created: number;
        requirements: number;
    };
    dataTables: {
        matched: number;
        created: number;
        updated: number;
        requirements: number;
    };
    variables: {
        matched: number;
        missing: number;
        created: number;
        stubbed: number;
        updated: number;
        requirements: number;
    };
    tags: {
        matched: number;
        created: number;
        renamed: number;
        reconciled: number;
        skipped: number;
        requirements: number;
    };
};
export type ExportPackageEventCounts = {
    agents: number;
    workflows: number;
    folders: number;
    credentials: number;
    dataTables: number;
    variables: number;
    tags: number;
};
export interface ExportPackageSummary {
    counts: ExportPackageEventCounts;
}
export interface ExportPackageResult extends ExportPackageSummary {
    stream: Readable;
}
export interface ExportPackageDirectoryResult extends ExportPackageSummary {
    manifest: PackageManifest;
}
export interface ImportedWorkflowSummary {
    sourceWorkflowId: string;
    localId: string;
    name: string;
    projectId: string;
    parentFolderId: string | null;
    activeVersionId: string | null;
    isArchived: boolean;
    publishing: WorkflowPublishingOutcome;
    status: 'created' | 'updated' | 'skipped';
}
export interface ImportedFolderSummary {
    sourceFolderId: string;
    localId: string;
    name: string;
    parentFolderId: string | null;
    status: 'created' | 'skipped';
}
export interface RemovedWorkflowSummary {
    workflowId: string;
    name: string;
    projectId: string;
    parentFolderId: string | null;
    deletion: 'archived' | 'deleted';
}
export interface RemovedFolderSummary {
    folderId: string;
    name: string;
    projectId: string;
    parentFolderId: string | null;
}
export interface ImportedProjectSummary {
    sourceProjectId: string;
    localId: string;
    name: string;
    status: 'created' | 'updated' | 'skipped';
}
export type BlockingIssue = ({
    type: 'workflow-conflict';
} & WorkflowConflict) | ({
    type: 'workflow-lineage-conflict';
} & WorkflowLineageConflict) | ({
    type: 'workflow-id-conflict';
} & WorkflowIdConflict) | ({
    type: 'workflow-folder-conflict';
} & WorkflowFolderConflict) | ({
    type: 'workflow-archive-forbidden';
} & WorkflowArchiveForbidden) | {
    type: 'credential-unresolved';
    kind: 'not_found' | 'unknown_type' | 'source_not_found' | 'type_mismatch';
    sourceId: string;
    targetId?: string;
    expectedType?: string;
    actualType?: string;
    usedBy: PackageRequirementConsumer[];
} | ({
    type: 'credential-conflict';
} & CredentialConflict) | ({
    type: 'credential-update-forbidden';
} & CredentialUpdateForbidden) | ({
    type: 'project-conflict';
} & ProjectConflict) | ({
    type: 'folder-conflict';
} & FolderConflict) | ({
    type: 'workflow-removal-forbidden';
} & WorkflowRemovalFailure) | ({
    type: 'workflow-removal-conflict';
} & WorkflowRemovalConflict) | ({
    type: 'folder-removal-forbidden';
} & FolderRemovalFailure) | ({
    type: 'data-table-unresolved';
    usedBy: PackageRequirementConsumer[];
} & DataTableResolutionFailure) | ({
    type: 'tag-unresolved';
    usedBy: PackageRequirementConsumer[];
} & TagResolutionFailure) | ({
    type: 'variable-unresolved';
    usedBy: PackageRequirementConsumer[];
} & VariableResolutionFailure) | ({
    type: 'variable-conflict';
    usedBy: PackageRequirementConsumer[];
} & VariableConflict) | ({
    type: 'variable-limit-exceeded';
    usedBy: PackageRequirementConsumer[];
} & VariableLimitFailure) | {
    type: 'missing-node-type';
    nodeType: string;
    typeVersion: number;
    usedBy: PackageRequirementConsumer[];
} | {
    type: 'policy-violation';
    sourceWorkflowId: string;
    name: string;
    violations: PolicyViolation[];
} | {
    type: 'credential-policy-violation';
    sourceId: string;
    name?: string;
    credentialType: string;
    usedBy: PackageRequirementConsumer[];
    violations: PolicyViolation[];
};
export interface WorkflowRemovalFailure {
    workflowId: string;
    name: string;
    projectId: string;
}
export interface WorkflowRemovalConflict {
    sourceWorkflowId: string;
    workflowId: string;
    projectId: string;
}
export interface FolderRemovalFailure {
    folderId: string;
    name: string;
    projectId: string;
}
export interface ProjectConflict {
    kind: 'fail-policy';
    sourceProjectId: string;
    name: string;
}
export interface FolderConflict {
    kind: 'parent-mismatch' | 'id-in-other-project' | 'fail-policy';
    sourceFolderId: string;
    name: string;
    existingParentFolderId?: string | null;
    expectedParentFolderId?: string | null;
    existingProjectId?: string | null;
}
export type ImportBindingMap = Map<string, string>;
export interface PackageImportBindings {
    workflows: ImportBindingMap;
    credentials: ImportBindingMap;
}
export declare function createBindings(seed?: Partial<PackageImportBindings>): PackageImportBindings;
export declare function mergeBindings(...bindings: PackageImportBindings[]): PackageImportBindings;
export type SerializedBindings = Record<keyof PackageImportBindings, Record<string, string>>;
export declare function serializeBindings(bindings: PackageImportBindings): SerializedBindings;
export interface ImportPackageSummary {
    sourceN8nVersion: string;
    sourceId: string;
    exportedAt: string;
}
export interface ImportCredentialSummary {
    matched: string[];
    stubbed: string[];
    seeded: string[];
    incomplete: string[];
}
export interface ImportVariableSummary {
    matched: string[];
    missing: string[];
    created: string[];
    stubbed: string[];
    updated: string[];
}
export interface ImportDataTableSummary {
    matched: number;
    created: number;
    updated: number;
}
export interface ImportTagSummary {
    matched: string[];
    created: string[];
    renamed: string[];
    reconciled: string[];
    skipped: string[];
}
export interface ImportResult {
    package: ImportPackageSummary;
    workflows: ImportedWorkflowSummary[];
    removedWorkflows: RemovedWorkflowSummary[];
    removedFolders: RemovedFolderSummary[];
    folders: ImportedFolderSummary[];
    projects: ImportedProjectSummary[];
    bindings: SerializedBindings;
    credentials: ImportCredentialSummary;
    dataTables: ImportDataTableSummary;
    variables: ImportVariableSummary;
    tags: ImportTagSummary;
}
