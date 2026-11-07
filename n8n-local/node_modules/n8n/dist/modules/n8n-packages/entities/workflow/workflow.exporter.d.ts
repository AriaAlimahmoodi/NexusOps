import type { User } from '@n8n/db';
import { WorkflowFinderService } from '../../../../workflows/workflow-finder.service';
import { WorkflowSerializer } from './workflow.serializer';
import type { PackageWriter } from '../../io/package-writer';
import type { ExportVersionPolicy } from '../../n8n-packages.types';
import type { ManifestEntry } from '../../spec/manifest.schema';
import { CredentialRequirementsExtractor } from '../credential/credential-requirements.extractor';
import { DataTableRequirementsExtractor } from '../data-table/data-table-requirements.extractor';
import type { ExportRequirements } from '../requirements.types';
import { TagRequirementsExtractor } from '../tag/tag-requirements.extractor';
import { VariableRequirementsExtractor } from '../variable/variable-requirements.extractor';
export interface WorkflowExportRequest {
    user: User;
    workflowIds: string[];
    writer: PackageWriter;
    includeTags: boolean;
    versionPolicy: ExportVersionPolicy;
    basePrefix?: string;
}
export interface WorkflowExportResult {
    entries: ManifestEntry[];
    requirements: ExportRequirements;
}
export declare class WorkflowExporter {
    private readonly workflowFinder;
    private readonly workflowSerializer;
    private readonly credentialRequirementsExtractor;
    private readonly dataTableRequirementsExtractor;
    private readonly variableRequirementsExtractor;
    private readonly tagRequirementsExtractor;
    constructor(workflowFinder: WorkflowFinderService, workflowSerializer: WorkflowSerializer, credentialRequirementsExtractor: CredentialRequirementsExtractor, dataTableRequirementsExtractor: DataTableRequirementsExtractor, variableRequirementsExtractor: VariableRequirementsExtractor, tagRequirementsExtractor: TagRequirementsExtractor);
    export(request: WorkflowExportRequest): Promise<WorkflowExportResult>;
    private orderWorkflowsByRequest;
}
