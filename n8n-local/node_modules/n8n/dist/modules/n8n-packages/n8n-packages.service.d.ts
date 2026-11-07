import { EventService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { N8nPackageParser } from './engine/n8n-package-parser';
import { ProjectPackageImporter } from './engine/project-package-importer';
import { WorkflowPackageImporter } from './engine/workflow-package-importer';
import { AgentSelectionExporter } from './entities/agent/agent-selection.exporter';
import { CredentialExporter } from './entities/credential/credential.exporter';
import { DataTableExporter } from './entities/data-table/data-table.exporter';
import { FolderExporter } from './entities/folder/folder.exporter';
import { ProjectExporter } from './entities/project/project.exporter';
import { TagExporter } from './entities/tag/tag.exporter';
import { VariableExporter } from './entities/variable/variable.exporter';
import { AutoIncludedWorkflowResolver } from './entities/workflow/auto-included-workflow-resolver';
import { AutoIncludedWorkflowExporter } from './entities/workflow/auto-included-workflow.exporter';
import { WorkflowDependencyResolver } from './entities/workflow/workflow-dependency-resolver';
import { WorkflowRequirementExporter } from './entities/workflow/workflow-requirement.exporter';
import { WorkflowExporter } from './entities/workflow/workflow.exporter';
import type { PackageWriter } from './io/package-writer';
import { PackageImportConfig } from './n8n-packages.config';
import { type ExportPackageRequest, type ExportPackageDirectoryResult, type ExportPackageResult, type ExportPackageSummary, type ImportPackageRequest, type ImportPackageSelectionRequest, type ImportRequest, type ImportResult, type ImportSelection, type ImportSelectionRequest } from './n8n-packages.types';
import { type ManifestEntry, type PackageManifest } from './spec/manifest.schema';
export declare class N8nPackagesService {
    private readonly projectExporter;
    private readonly workflowExporter;
    private readonly folderExporter;
    private readonly credentialExporter;
    private readonly dataTableExporter;
    private readonly variableExporter;
    private readonly tagExporter;
    private readonly globalConfig;
    private readonly instanceSettings;
    private readonly packageParser;
    private readonly packageImportConfig;
    private readonly projectPackageImporter;
    private readonly workflowPackageImporter;
    private readonly eventService;
    private readonly workflowRequirementExporter;
    private readonly workflowDependencyResolver;
    private readonly autoIncludedWorkflowResolver;
    private readonly autoIncludedWorkflowExporter;
    private readonly agentSelectionExporter;
    constructor(projectExporter: ProjectExporter, workflowExporter: WorkflowExporter, folderExporter: FolderExporter, credentialExporter: CredentialExporter, dataTableExporter: DataTableExporter, variableExporter: VariableExporter, tagExporter: TagExporter, globalConfig: GlobalConfig, instanceSettings: InstanceSettings, packageParser: N8nPackageParser, packageImportConfig: PackageImportConfig, projectPackageImporter: ProjectPackageImporter, workflowPackageImporter: WorkflowPackageImporter, eventService: EventService, workflowRequirementExporter: WorkflowRequirementExporter, workflowDependencyResolver: WorkflowDependencyResolver, autoIncludedWorkflowResolver: AutoIncludedWorkflowResolver, autoIncludedWorkflowExporter: AutoIncludedWorkflowExporter, agentSelectionExporter: AgentSelectionExporter);
    exportPackage(request: ExportPackageRequest): Promise<ExportPackageResult>;
    exportPackageToDirectory(request: ExportPackageRequest, target: {
        targetDir: string;
    }): Promise<ExportPackageDirectoryResult>;
    exportPackageToWriter(request: ExportPackageRequest, writer: PackageWriter): Promise<ExportPackageSummary & {
        manifest: PackageManifest;
    }>;
    private writeExport;
    private exportSelectedEntities;
    importPackage(request: ImportPackageRequest): Promise<ImportResult>;
    importPackageFromDirectory(request: ImportRequest, source: {
        sourceDir: string;
    }): Promise<ImportResult>;
    importPackageSelectionFromDirectory(request: ImportSelectionRequest, source: {
        sourceDir: string;
    }, selection: ImportSelection): Promise<ImportResult>;
    importPackageSelection(request: ImportPackageSelectionRequest, selection: ImportSelection): Promise<ImportResult>;
    private readImportManifest;
    private readDirectoryProjectPackage;
    private dispatchSelectionImport;
    private dispatchImport;
    filterWorkflowsAlreadyInFolders(workflowsInFolders: ManifestEntry[] | undefined, workflowIds: string[]): string[];
    private dedupeManifestEntries;
    private buildManifestRequirements;
}
