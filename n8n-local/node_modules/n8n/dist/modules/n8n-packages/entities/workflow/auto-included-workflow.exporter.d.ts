import type { AutoIncludedWorkflow } from './auto-included-workflow-resolver';
import { WorkflowSerializer } from './workflow.serializer';
import type { PackageWriter } from '../../io/package-writer';
import type { ManifestEntry } from '../../spec/manifest.schema';
import { CredentialRequirementsExtractor } from '../credential/credential-requirements.extractor';
import { DataTableRequirementsExtractor } from '../data-table/data-table-requirements.extractor';
import { FolderSerializer } from '../folder/folder.serializer';
import { ProjectShellExporter } from '../project/project-shell.exporter';
import type { ExportRequirements } from '../requirements.types';
import { TagRequirementsExtractor } from '../tag/tag-requirements.extractor';
import { VariableRequirementsExtractor } from '../variable/variable-requirements.extractor';
export interface AutoIncludedWorkflowExportRequest {
    writer: PackageWriter;
    workflows: AutoIncludedWorkflow[];
    existingWorkflowEntries: ManifestEntry[];
    existingFolderEntries: ManifestEntry[];
    existingProjectEntries: ManifestEntry[];
    includeTags: boolean;
    projectTargetsById?: Map<string, string>;
}
export interface AutoIncludedWorkflowExportResult {
    workflowEntries: ManifestEntry[];
    folderEntries: ManifestEntry[];
    projectEntries: ManifestEntry[];
    requirements: ExportRequirements;
    projectTargetsById: Map<string, string>;
}
export declare class AutoIncludedWorkflowExporter {
    private readonly workflowSerializer;
    private readonly folderSerializer;
    private readonly projectShellExporter;
    private readonly credentialRequirementsExtractor;
    private readonly dataTableRequirementsExtractor;
    private readonly variableRequirementsExtractor;
    private readonly tagRequirementsExtractor;
    constructor(workflowSerializer: WorkflowSerializer, folderSerializer: FolderSerializer, projectShellExporter: ProjectShellExporter, credentialRequirementsExtractor: CredentialRequirementsExtractor, dataTableRequirementsExtractor: DataTableRequirementsExtractor, variableRequirementsExtractor: VariableRequirementsExtractor, tagRequirementsExtractor: TagRequirementsExtractor);
    export(request: AutoIncludedWorkflowExportRequest): Promise<AutoIncludedWorkflowExportResult>;
    private resolveWorkflowBaseDir;
    private ensureFolderChain;
}
