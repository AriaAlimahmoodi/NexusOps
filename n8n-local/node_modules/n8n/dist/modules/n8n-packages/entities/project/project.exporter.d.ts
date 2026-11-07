import type { User } from '@n8n/db';
import { FolderFinderService } from '@n8n/backend-services';
import { ProjectService } from '../../../../services/project.service.ee';
import { WorkflowFinderService } from '../../../../workflows/workflow-finder.service';
import { ProjectShellExporter } from './project-shell.exporter';
import type { PackageWriter } from '../../io/package-writer';
import type { ManifestEntry } from '../../spec/manifest.schema';
import type { ExportVersionPolicy } from '../../n8n-packages.types';
import { FolderExporter } from '../folder/folder.exporter';
import type { ExportRequirements } from '../requirements.types';
import { WorkflowExporter } from '../workflow/workflow.exporter';
export interface ProjectExportRequest {
    user: User;
    projectIds: string[];
    writer: PackageWriter;
    includeTags: boolean;
    versionPolicy: ExportVersionPolicy;
    includeArchivedWorkflows: boolean;
    workflowIds?: string[];
}
interface ProjectExportResult {
    entries: ManifestEntry[];
    folderEntries: ManifestEntry[];
    workflowEntries: ManifestEntry[];
    requirements: ExportRequirements;
    projectTargetsById: Map<string, string>;
}
export declare class ProjectExporter {
    private readonly projectService;
    private readonly projectShellExporter;
    private readonly folderFinder;
    private readonly workflowFinder;
    private readonly folderExporter;
    private readonly workflowExporter;
    constructor(projectService: ProjectService, projectShellExporter: ProjectShellExporter, folderFinder: FolderFinderService, workflowFinder: WorkflowFinderService, folderExporter: FolderExporter, workflowExporter: WorkflowExporter);
    export(request: ProjectExportRequest): Promise<ProjectExportResult>;
    private assertSelectionInProjects;
    private exportProject;
    private exportProjectFolders;
    private exportProjectRootWorkflows;
    private mergeProjectExportResults;
}
export {};
