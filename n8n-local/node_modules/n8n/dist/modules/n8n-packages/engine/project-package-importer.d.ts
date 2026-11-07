import { LicenseState } from '@n8n/backend-common';
import { ProjectImporter } from '../entities/project/project-importer';
import { WorkflowPublisher } from '../entities/workflow/workflow-publisher';
import type { PackageReader } from '../io/package-reader';
import type { ResolvedImportRequest, PackageImportSource } from '../n8n-packages.types';
import { ImportOrchestrator } from './import-orchestrator';
import type { ImportOutcome } from './import-telemetry';
import { N8nPackageParser } from './n8n-package-parser';
import type { PackageManifest } from '../spec/manifest.schema';
export declare class ProjectPackageImporter {
    private readonly packageParser;
    private readonly projectImporter;
    private readonly importOrchestrator;
    private readonly workflowPublisher;
    private readonly licenseState;
    constructor(packageParser: N8nPackageParser, projectImporter: ProjectImporter, importOrchestrator: ImportOrchestrator, workflowPublisher: WorkflowPublisher, licenseState: LicenseState);
    import(request: ResolvedImportRequest, reader: PackageReader, manifest: PackageManifest, importSource: PackageImportSource): Promise<ImportOutcome>;
    private buildImportContextForProject;
    private assertAdequatePermissions;
}
