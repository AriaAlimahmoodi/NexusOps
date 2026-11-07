import type { User } from '@n8n/db';
import { FolderFinderService } from '@n8n/backend-services';
import { WorkflowFinderService } from '../../../../workflows/workflow-finder.service';
import { FolderSerializer } from './folder.serializer';
import type { PackageWriter } from '../../io/package-writer';
import type { ManifestEntry } from '../../spec/manifest.schema';
import type { ExportVersionPolicy } from '../../n8n-packages.types';
import type { ExportRequirements } from '../requirements.types';
import { WorkflowExporter } from '../workflow/workflow.exporter';
export interface FolderExportRequest {
    user: User;
    folderIds: string[];
    writer: PackageWriter;
    includeTags: boolean;
    versionPolicy: ExportVersionPolicy;
    includeArchivedWorkflows: boolean;
    basePrefix?: string;
    selectedWorkflowIds?: ReadonlySet<string>;
}
export interface FolderExportResult {
    entries: ManifestEntry[];
    workflowEntries: ManifestEntry[];
    requirements: ExportRequirements;
}
export declare class FolderExporter {
    private readonly folderFinder;
    private readonly folderSerializer;
    private readonly workflowFinder;
    private readonly workflowExporter;
    constructor(folderFinder: FolderFinderService, folderSerializer: FolderSerializer, workflowFinder: WorkflowFinderService, workflowExporter: WorkflowExporter);
    export(request: FolderExportRequest): Promise<FolderExportResult>;
    private foldersContaining;
    private buildForest;
    private exportLevel;
    private exportFolder;
    private exportContainedWorkflows;
    private mergeFolderExportResults;
    private orderedByCreation;
}
