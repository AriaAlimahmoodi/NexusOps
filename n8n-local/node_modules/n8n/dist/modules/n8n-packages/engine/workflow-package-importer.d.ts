import { LicenseState } from '@n8n/backend-common';
import { FolderService } from '../../../services/folder.service';
import { ProjectService } from '../../../services/project.service.ee';
import { WorkflowPublisher } from '../entities/workflow/workflow-publisher';
import type { PackageReader } from '../io/package-reader';
import type { ResolvedImportRequest } from '../n8n-packages.types';
import { ImportOrchestrator } from './import-orchestrator';
import type { ImportOutcome } from './import-telemetry';
import { N8nPackageParser } from './n8n-package-parser';
import type { PackageManifest } from '../spec/manifest.schema';
export declare class WorkflowPackageImporter {
    private readonly packageParser;
    private readonly importOrchestrator;
    private readonly workflowPublisher;
    private readonly projectService;
    private readonly folderService;
    private readonly licenseState;
    constructor(packageParser: N8nPackageParser, importOrchestrator: ImportOrchestrator, workflowPublisher: WorkflowPublisher, projectService: ProjectService, folderService: FolderService, licenseState: LicenseState);
    import(request: ResolvedImportRequest, reader: PackageReader, manifest: PackageManifest): Promise<ImportOutcome>;
    private assertFoldersLicensed;
    private findImportLocation;
    private resolveImportProject;
    private assertFolderExistsInProject;
}
